import Link from "next/link";
import { NotificationSwitch } from "@/components/Notifications";
import clsx from "clsx";
import AvatarField from "@/components/AvatarField";
import { Avatar, PageHead, btn, field, label } from "@/components/ui";
import { changePassword, confirmTwoStep, deleteFirm, disableTwoStep, setTwoStepRequired, signOutSession, startTwoStep, updateFirm, updateProfile, removeStyleRule } from "@/lib/actions";
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
import CopyLink from "@/components/CopyLink";
import { firmLink, linkUrl, memberLink } from "@/lib/client-intake";
import { ROLES } from "@/lib/roles";
import AdminSwitch from "@/components/AdminSwitch";
import { inviteMember, revokeInvite } from "@/lib/actions";
import { inviteUrl, pendingInvites } from "@/lib/invites";
import RoleSelect from "@/components/RoleSelect";
import { rules } from "@/lib/memory";
import { ConfirmButton } from "@/components/Confirm";

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
const EVENT: Record<string, string> = { sign_in: "Signed in", sign_in_failed: "Wrong password", sign_in_code_failed: "Wrong two step code", recovery_code_used: "Recovery code used", password_changed: "Password changed", password_reset_requested: "Password reset requested", password_reset: "Password reset", two_step_on: "Two step sign in turned on", two_step_off: "Two step sign in turned off", two_step_required: "Two step sign in required for the firm", two_step_optional: "Two step sign in made optional for the firm", role_changed: "Role changed", member_invited: "Invited to the firm", admin_given: "Made an admin", admin_removed: "Admin removed", connected: "Account connected", disconnected: "Account disconnected", sessions_signed_out: "Devices signed out", account_created: "Account created", firm_exported: "Firm exported" };
const ACCESS: Record<string, string> = { case_viewed: "Opened", page_viewed: "Viewed", exported: "Exported", firm_exported: "Exported" };
const device = deviceName;

const MSG: Record<string, Record<string, string>> = {
  profile: { name: "Name required.", sample: "Not available in the sample workspace." },
  security: { limited: "Too many attempts. Try again in 15 minutes.", sample: "Not available in the sample workspace.", current: "Wrong password.", nopassword: "Set a password first.", password: "10 characters min.", code: "Wrong code.", breached: "This password appears in known data breaches.", required: "The firm requires two step sign in.", admin: "Administrators only.", selffirst: "Turn on two step sign in for this account first." },
  firm: { invite: "A valid email and a role are needed.", member: "This email already has an account.", limited: "Too many invites. Try again later.", "1": "Administrators only.", sample: "Not available in the sample workspace.", delete: "Name or password did not match.", export: "Wrong password.", password: "Wrong password.", nopassword: "Set a password in Security first." },
};

function Row({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("flex items-center gap-4 border-b border-line py-3", className)}>{children}</div>;
}

export default async function SettingsPage({ searchParams }: { searchParams: Promise<{ tab?: string; saved?: string; error?: string; connected?: string; inbound?: string; setup?: string; codes?: string; invite?: string }> }) {
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
  const admin = Boolean(user.admin);
  const details = d.prepare("SELECT address, phone, email FROM firms WHERE id = ?").get(firm.id) as { address: string | null; phone: string | null; email: string | null };
  const bar = d.prepare("SELECT bar_number, bar_state FROM users WHERE id = ?").get(user.id) as { bar_number: string | null; bar_state: string | null };
  const err = error && tab !== "integrations" ? MSG[tab]?.[error] : null;

  return (
    <div className="rise">
      <PageHead title="Settings" />
      <div className="grid gap-8 md:grid-cols-[180px_1fr]">
        <nav className="edge-fade flex gap-1 overflow-x-auto pr-6 md:flex-col md:pr-0">
          {TABS.map(([k, t]) => (
            <Link key={k} href={`/settings?tab=${k}`} scroll={false} className={clsx("whitespace-nowrap px-3 py-[7px] text-[13px] transition", tab === k ? "bg-ink/[0.06] font-medium text-ink" : "text-muted hover:text-ink")}>{t}</Link>
          ))}
        </nav>
        <div className="min-w-0 max-w-[620px]">
          {mustSetUp && !codes && <p className="mb-5 text-[13px] font-medium">Two step sign in is required.</p>}
          {err && <p className="mb-5 text-[13px] text-risk">{err}</p>}

          {tab === "profile" && (
            <form action={updateProfile} className="flex flex-col gap-5">
              <AvatarField initials={user.initials} current={user.avatar} />
              <label className="block"><span className={label}>Name</span><input name="name" required maxLength={100} defaultValue={user.name} className={field} /></label>
              <label className="block"><span className={label}>Role</span>
                <select name="role" defaultValue={user.role} className={field}>
                  {[...new Set([...ROLES, user.role])].map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </label>
              <div className="grid gap-5 sm:grid-cols-2">
                <label className="block"><span className={label}>Bar number</span><input name="bar_number" maxLength={40} defaultValue={bar.bar_number ?? ""} className={field} /></label>
                <label className="block"><span className={label}>Licensing state</span><input name="bar_state" maxLength={40} defaultValue={bar.bar_state ?? ""} className={field} /></label>
              </div>
              <label className="block"><span className={label}>Email</span><input value={user.email} disabled className={clsx(field, "bg-side text-muted")} /></label>
              <div><button className={btn.primary}>Save</button></div>
            </form>
          )}
          {tab === "profile" && !firm.demo && (
            <div className="mt-10 flex items-center justify-between gap-4 border-t border-line pt-6">
              <span className="text-[14px] font-medium">Notifications on this device</span>
              <NotificationSwitch />
            </div>
          )}
          {tab === "profile" && !firm.demo && (
            <section className="mt-10 border-t border-line pt-6">
              <h2 className="mb-2 text-[14px] font-medium">Intake link</h2>
              <CopyLink inline url={linkUrl(memberLink(firm.id, user.id))} />
            </section>
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
                    <div className="mb-2 grid grid-cols-2 gap-1.5 bg-side p-3 font-mono text-[13px] sm:grid-cols-4">{codes.split("-").map((c) => <span key={c}>{c}</span>)}</div>
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
                    <img src={qr} alt="QR code for the authenticator app" width={180} height={180} className="border border-line" />
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
                  <ConfirmButton password={Boolean(firm.require_2fa)} className={btn.ghost}>{firm.require_2fa ? "Turn off" : "Turn on"}</ConfirmButton>
                </form>
              )}

              <h2 className="mb-1 mt-12 text-[14px] font-medium">Signed in devices</h2>
              <div className="border-t border-line">
                {sessions.map((x) => (
                  <Row key={x.id}>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px]">{device(x.agent)}{x.id === sessionId ? <span className="text-faint"> · this device</span> : null}</span><span className="block text-[12px] text-faint">{x.ip ? `${x.ip} · ` : ""}{ago(x.last_seen ?? x.created_at)}</span></span>
                    {x.id !== sessionId && <form action={signOutSession}><input type="hidden" name="session" value={x.id} /><ConfirmButton className={btn.ghost}>Sign out</ConfirmButton></form>}
                  </Row>
                ))}
              </div>
              {sessions.length > 1 && <form action={signOutSession} className="mt-2"><input type="hidden" name="session" value="others" /><ConfirmButton className={btn.ghost}>Sign out all other devices</ConfirmButton></form>}

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
              <form action={updateFirm} className="flex flex-col gap-5">
                <label className="block"><span className={label}>Firm name</span><input name="firm" required maxLength={120} defaultValue={firm.name} disabled={!admin} className={clsx(field, !admin && "bg-side text-muted")} /></label>
                <label className="block"><span className={label}>Address</span><input name="address" maxLength={200} defaultValue={details.address ?? ""} disabled={!admin} autoComplete="street-address" className={clsx(field, !admin && "bg-side text-muted")} /></label>
                <div className="grid gap-5 sm:grid-cols-2">
                  <label className="block"><span className={label}>Phone</span><input name="phone" maxLength={40} defaultValue={details.phone ?? ""} disabled={!admin} autoComplete="tel" className={clsx(field, !admin && "bg-side text-muted")} /></label>
                  <label className="block"><span className={label}>Email</span><input name="email" type="email" maxLength={120} defaultValue={details.email ?? ""} disabled={!admin} className={clsx(field, !admin && "bg-side text-muted")} /></label>
                </div>
                {admin && <div><button className={btn.primary}>Save</button></div>}
              </form>
              {!firm.demo && (
                <>
                  <h2 className="mb-2 mt-10 text-[14px] font-medium">Firm intake link</h2>
                  <CopyLink inline url={linkUrl(firmLink(firm.id))} />
                </>
              )}
              <h2 className="mb-1 mt-10 text-[14px] font-medium">Members</h2>
              <div className="border-t border-line">
                {people(firm.id).map((p) => (
                  <Row key={p.id}>
                    <Avatar initials={p.initials} src={p.avatar} size={28} />
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px]">{p.name}{p.id === user.id ? <span className="text-faint"> (this account)</span> : null}</span><span className="block truncate text-[12px] text-faint">{p.email}</span></span>
                    {admin && !firm.demo ? (
                      <><RoleSelect userId={p.id} role={p.role} roles={ROLES} /><AdminSwitch userId={p.id} on={Boolean(p.admin)} /></>
                    ) : <span className="hidden text-[12.5px] text-muted sm:block">{p.role}{p.admin ? " · Admin" : ""}</span>}
                  </Row>
                ))}
                {admin && !firm.demo && pendingInvites(firm.id).map((i) => (
                  <Row key={i.token_hash}>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px]">{i.email}</span><span className="block truncate text-[12px] text-faint">Invited{i.role ? ` · ${i.role}` : ""}{i.admin ? " · Admin" : ""}</span></span>
                    <form action={revokeInvite}><input type="hidden" name="id" value={i.token_hash} /><ConfirmButton className={btn.ghost}>Remove</ConfirmButton></form>
                  </Row>
                ))}
              </div>
              {admin && !firm.demo && (
                <form action={inviteMember} className="mt-5 flex flex-wrap items-center gap-2">
                  <input name="email" type="email" required placeholder="Email" className={clsx(field, "!w-auto min-w-[200px] flex-1")} />
                  <select name="role" defaultValue="Attorney" className={clsx(field, "!w-[180px]")}>{ROLES.map((r) => <option key={r} value={r}>{r}</option>)}</select>
                  <label className="flex items-center gap-2 px-1 text-[13px] text-muted"><input type="checkbox" name="admin" className="h-4 w-4 accent-ink" /> Admin</label>
                  <ConfirmButton askIf="admin" passwordIf="admin" className={btn.primary}>Invite</ConfirmButton>
                </form>
              )}
              {admin && params.invite && /^[\w-]{20,80}$/.test(params.invite) && (
                <div className="mt-4"><span className={label}>Invite link</span><CopyLink inline url={inviteUrl(params.invite)} /></div>
              )}
            </>
          )}

          {tab === "firm" && (rules(firm.id, "draft").length > 0 || rules(firm.id, "email").length > 0) && (
            <details className="group mt-12">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[14px] font-medium [&::-webkit-details-marker]:hidden">
                Writing style<span className="text-[12px] font-normal text-faint group-open:hidden">{rules(firm.id, "draft").length + rules(firm.id, "email").length}</span>
              </summary>
              {(["draft", "email"] as const).filter((k) => rules(firm.id, k).length).map((k) => (
                <div key={k} className="mt-4">
                  <p className="mb-1 text-[12px] text-faint">{k === "draft" ? "Documents" : "Emails"}</p>
                  <ul className="border-t border-line">
                    {rules(firm.id, k).map((r, i) => (
                      <li key={i} className="flex items-start gap-3 border-b border-line py-2.5 text-[13px]">
                        <span className="min-w-0 flex-1 leading-relaxed">{r}</span>
                        {admin && <form action={removeStyleRule.bind(null, k, i)}><ConfirmButton className="text-[12px] text-faint transition hover:text-ink">Remove</ConfirmButton></form>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </details>
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
                <div><button className="inline-flex h-9 items-center border border-risk/40 px-3.5 text-[13px] font-medium text-risk transition hover:bg-risk-bg">Delete everything</button></div>
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
