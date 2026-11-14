import Link from "next/link";
import clsx from "clsx";
import AvatarField from "@/components/AvatarField";
import { Avatar, PageHead, btn, field, label } from "@/components/ui";
import { changePassword, confirmTwoStep, deleteFirm, disableTwoStep, setTwoStepRequired, signOutSession, startTwoStep, updateFirm, updateProfile } from "@/lib/actions";
import { db } from "@/lib/db";
import QRCode from "qrcode";
import { otpauth } from "@/lib/totp";
import { open as openSecret } from "@/lib/secret";
import { SESSION_HOURS } from "@/lib/session";
import { requireUser } from "@/lib/session";
import { people } from "@/lib/queries";
import { ago } from "@/lib/format";
import { deviceName } from "@/lib/device";
import { accessRecord } from "@/lib/access";

const TABS: [string, string][] = [["profile", "Profile"], ["security", "Security"], ["firm", "Firm"], ["automation", "Automation"]];

const RULES: [string, string, boolean][] = [
  ["Reading and filing case mail", "", true],
  ["Opening new cases", "", true],
  ["Client reminders after 3 days", "", true],
  ["Deadlines raised 14 days before", "", true],
  ["Dates added to the calendar", "", true],
  ["Review items posted to Teams", "", true],
  ["Other messages", "", false],
  ["Strategy and eligibility", "", false],
];
const EVENT: Record<string, string> = { sign_in: "Signed in", sign_in_failed: "Wrong password", sign_in_code_failed: "Wrong two step code", recovery_code_used: "Recovery code used", password_changed: "Password changed", password_reset_requested: "Password reset requested", password_reset: "Password reset", two_step_on: "Two step sign in turned on", two_step_off: "Two step sign in turned off", two_step_required: "Two step sign in required for the firm", two_step_optional: "Two step sign in made optional for the firm", connected: "Account connected", disconnected: "Account disconnected", sessions_signed_out: "Devices signed out", account_created: "Account created", firm_exported: "Firm exported" };
const ACCESS: Record<string, string> = { case_viewed: "Opened", page_viewed: "Viewed", exported: "Exported", firm_exported: "Exported" };
const device = deviceName;

const MSG: Record<string, Record<string, string>> = {
  profile: { name: "Name required.", sample: "Not available in the sample workspace." },
  security: { limited: "Too many attempts. Try again in 15 minutes.", sample: "Not available in the sample workspace.", current: "Wrong password.", password: "10 characters min.", code: "Wrong code.", breached: "This password appears in known data breaches.", required: "The firm requires two step sign in.", admin: "Administrators only.", selffirst: "Turn on two step sign in for this account first." },
  firm: { "1": "Administrators only.", sample: "Not available in the sample workspace.", delete: "Name or password did not match.", export: "Wrong password." },
};

function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("flex items-center gap-4 border-b border-line py-3", className)}>{children}</div>;
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string; saved?: string; error?: string; connected?: string; inbound?: string; setup?: string; codes?: string }> }) {
  const { user, firm, viewer, sessionId, twoStep: hasTwoStep } = await requireUser({ setup: true });
  const params = await searchParams;
  const mustSetUp = Boolean(firm.require_2fa) && !hasTwoStep;
  const { saved, error, setup, codes } = params;
  const tab = mustSetUp ? "security" : params.tab ?? "profile";
  const d = db();
  const me = d.prepare("SELECT totp_enc, totp_pending_enc, recovery FROM users WHERE id = ?").get(user.id) as { totp_enc: string | null; totp_pending_enc: string | null; recovery: string | null };
  const twoStep = { on: Boolean(me.totp_enc), left: (JSON.parse(me.recovery ?? "[]") as string[]).length };
  const secretText = setup && me.totp_pending_enc ? openSecret(me.totp_pending_enc) : "";
  const qr = secretText ? await QRCode.toDataURL(otpauth(secretText, user.email), { margin: 1, width: 360 }) : null;
  const sessions = tab === "security" ? (d.prepare("SELECT id, ip, agent, created_at, last_seen FROM sessions WHERE user_id = ? AND created_at > ? ORDER BY last_seen DESC").all(user.id, new Date(Date.now() - SESSION_HOURS * 3600_000).toISOString()) as { id: string; ip: string | null; agent: string | null; created_at: string; last_seen: string | null }[]) : [];
  const events = tab === "security" ? (d.prepare("SELECT id, kind, detail, ip, at FROM security_events WHERE user_id = ? ORDER BY at DESC LIMIT 12").all(user.id) as { id: string; kind: string; detail: string | null; ip: string | null; at: string }[]) : [];
  const hasPassword = Boolean((db().prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string | null }).password_hash);
  const admin = /admin|managing/i.test(user.role);
  const err = error && tab !== "integrations" ? MSG[tab]?.[error] : null;

  return (
    <div className="rise">
      <PageHead title="Settings" />
      <div className="grid gap-8 md:grid-cols-[180px_1fr]">
        <nav className="edge-fade flex gap-1 overflow-x-auto pr-6 md:flex-col md:pr-0">
          {TABS.map(([k, t]) => (
            <Link key={k} href={`/settings?tab=${k}`} scroll={false} className={clsx("whitespace-nowrap rounded-lg px-3 py-[7px] text-[13px] transition", tab === k ? "bg-ink/[0.06] font-medium text-ink" : "text-muted hover:text-ink")}>{t}</Link>
          ))}
        </nav>
        <div className="min-w-0 max-w-[620px]">
          {mustSetUp && !codes && <p className="mb-5 text-[13px] font-medium">Two step sign in is required.</p>}
          {saved && <p className="mb-5 text-[13px] text-muted">Saved.</p>}
          {err && <p className="mb-5 text-[13px] text-risk">{err}</p>}

          {tab === "profile" && (
            <form action={updateProfile} className="flex flex-col gap-5">
              <AvatarField initials={user.initials} current={user.avatar} />
              <label className="block"><span className={label}>Name</span><input name="name" required maxLength={100} defaultValue={user.name} className={field} /></label>
              <label className="block"><span className={label}>Role</span><input name="role" maxLength={60} defaultValue={user.role} className={field} /></label>
              <label className="block"><span className={label}>Email</span><input value={user.email} disabled className={clsx(field, "bg-side text-muted")} /></label>
              <div><button className={btn.primary}>Save</button></div>
            </form>
          )}

          {tab === "security" && (
            <>
              <h2 className="mb-3 text-[14px] font-medium">Password</h2>
              {hasPassword ? (
                <form action={changePassword} className="flex flex-col gap-4">
                  <label className="block"><span className={label}>Current password</span><input name="current" type="password" required autoComplete="current-password" className={field} /></label>
                  <label className="block"><span className={label}>New password</span><input name="next" type="password" required minLength={10} autoComplete="new-password" placeholder="10 characters min." className={field} /></label>
                  <div><button className={btn.primary}>Update password</button></div>
                </form>
              ) : (
                <p className="text-[13px] text-muted">Not available in the sample workspace.</p>
              )}

              <h2 className="mb-1 mt-12 text-[14px] font-medium">Two step sign in</h2>
              <div className="border-t border-line pt-3">
                {codes ? (
                  <>
                    <p className="mb-3 text-[13px]">Recovery codes</p>
                    <div className="mb-2 grid grid-cols-2 gap-1.5 rounded-lg bg-side p-3 font-mono text-[13px] sm:grid-cols-4">{codes.split("-").map((c) => <span key={c}>{c}</span>)}</div>
                    <p className="text-[12px] text-faint">Shown once.</p>
                  </>
                ) : twoStep.on ? (
                  <form action={disableTwoStep} className="flex flex-wrap items-end gap-2">
                    <span className="mr-auto text-[13px]">On<span className="text-faint"> · {twoStep.left} recovery codes left</span></span>
                    <input name="password" type="password" required placeholder="Password to turn off" autoComplete="current-password" className={clsx(field, "h-9 w-[220px]")} />
                    <button className={btn.ghost}>Turn off</button>
                  </form>
                ) : setup && qr ? (
                  <form action={confirmTwoStep} className="flex flex-col gap-3">
                    
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qr} alt="QR code for the authenticator app" width={180} height={180} className="rounded-lg border border-line" />
                    <p className="break-all font-mono text-[12px] text-faint">{secretText}</p>
                    <div className="flex gap-2"><input name="code" required inputMode="numeric" autoComplete="one-time-code" maxLength={6} placeholder="123456" className={clsx(field, "w-[160px]")} /><button className={btn.primary}>Turn on</button></div>
                  </form>
                ) : (
                  <form action={startTwoStep} className="flex items-center justify-between gap-4">
                    <span className="text-[13px] text-muted">Off</span>
                    <button className={btn.secondary} disabled={Boolean(firm.demo)}>Set up</button>
                  </form>
                )}
              </div>

              {admin && !firm.demo && (
                <form action={setTwoStepRequired} className="mt-3 flex items-center justify-between gap-4 border-b border-line pb-3">
                  <input type="hidden" name="on" value={firm.require_2fa ? "0" : "1"} />
                  <span className="text-[13px]">Required for everyone in the firm<span className="text-faint"> · {firm.require_2fa ? "On" : "Off"}</span></span>
                  <button className={btn.ghost}>{firm.require_2fa ? "Turn off" : "Turn on"}</button>
                </form>
              )}

              <h2 className="mb-1 mt-12 text-[14px] font-medium">Signed in devices</h2>
              <div className="border-t border-line">
                {sessions.map((x) => (
                  <Row key={x.id}>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px]">{device(x.agent)}{x.id === sessionId ? <span className="text-faint"> · this device</span> : null}</span><span className="block text-[12px] text-faint">{x.ip ? `${x.ip} · ` : ""}{ago(x.last_seen ?? x.created_at)}</span></span>
                    {x.id !== sessionId && <form action={signOutSession}><input type="hidden" name="session" value={x.id} /><button className={btn.ghost}>Sign out</button></form>}
                  </Row>
                ))}
              </div>
              {sessions.length > 1 && <form action={signOutSession} className="mt-2"><input type="hidden" name="session" value="others" /><button className={btn.ghost}>Sign out all other devices</button></form>}

              {events.length > 0 && <h2 className="mb-1 mt-12 text-[14px] font-medium">Security activity</h2>}
              <div className={events.length ? "border-t border-line" : undefined}>
                {events.map((e) => (
                  <Row key={e.id} className="py-2.5"><span className="flex-1 text-[13px]">{EVENT[e.kind] ?? e.kind}{e.detail ? <span className="text-faint"> · {e.detail}</span> : null}</span><span className="shrink-0 text-[12px] text-faint">{e.ip ? `${e.ip} · ` : ""}{ago(e.at)}</span></Row>
                ))}
              </div>

              {admin && !firm.demo && accessRecord(firm.id).length > 0 && (
                <>
                  <h2 className="mb-1 mt-12 text-[14px] font-medium">Access record</h2>
                  <div className="border-t border-line">
                    {accessRecord(firm.id).map((e, i) => (
                      <Row key={i} className="py-2.5"><span className="min-w-0 flex-1 truncate text-[13px]">{e.name ?? "Unknown"}<span className="text-faint"> · {ACCESS[e.action] ?? e.action} {e.label}</span></span><span className="shrink-0 text-[12px] text-faint">{ago(e.at)}</span></Row>
                    ))}
                  </div>
                </>
              )}

            </>
          )}

          {tab === "firm" && (
            <>
              <form action={updateFirm} className="flex items-end gap-2">
                <label className="block flex-1"><span className={label}>Firm name</span><input name="firm" required maxLength={120} defaultValue={firm.name} disabled={!admin} className={clsx(field, !admin && "bg-side text-muted")} /></label>
                {admin && <button className={btn.secondary}>Save</button>}
              </form>
              <h2 className="mb-1 mt-10 text-[14px] font-medium">Members</h2>
              <div className="border-t border-line">
                {people(firm.id).map((p) => (
                  <Row key={p.id}>
                    <Avatar initials={p.initials} src={p.avatar} size={28} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px]">{p.name}{p.id === user.id ? <span className="text-faint"> (this account)</span> : null}</span><span className="block truncate text-[12px] text-faint">{p.email}</span></span>
                    <span className="hidden text-[12.5px] text-muted sm:block">{p.role}</span>
                  </Row>
                ))}
              </div>
            </>
          )}

          {tab === "firm" && admin && !firm.demo && (
            <section className="mt-12">
              <h2 className="mb-1 text-[14px] font-medium">Export everything</h2>
              <form action="/api/firm-export" method="post" className="flex flex-wrap items-center gap-2 border-t border-line pt-3">
                <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className={clsx(field, "max-w-[260px]")} />
                <button className={btn.secondary}>Download</button>
              </form>
            </section>
          )}

          {tab === "firm" && admin && !firm.demo && (
            <section className="mt-12">
              <h2 className="mb-1 text-[14px] font-medium">Delete firm</h2>
              <form action={deleteFirm} className="flex flex-col gap-3 border-t border-line pt-3">
                <p className="text-[13px] text-muted">Cannot be undone.</p>
                <input name="confirm" required placeholder={`Type ${firm.name}`} className={clsx(field, "max-w-[360px]")} />
                <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className={clsx(field, "max-w-[360px]")} />
                <div><button className="inline-flex h-9 items-center rounded-lg border border-risk/40 px-3.5 text-[13px] font-medium text-risk transition hover:bg-risk-bg">Delete everything</button></div>
              </form>
            </section>
          )}

          {tab === "automation" && (
            <div className="border-t border-line">
              {RULES.map(([t, , auto]) => (
                <Row key={t}>
                  <span className="min-w-0 flex-1 text-[13px]">{t}</span>
                  <span className={clsx("text-[12.5px]", auto ? "text-muted" : "font-medium")}>{auto ? "Automatic" : "Approval"}</span>
                </Row>
              ))}
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
