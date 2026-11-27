import Link from "next/link";
import { NotificationSwitch } from "@/components/Notifications";
import clsx from "clsx";
import AvatarField from "@/components/AvatarField";
import { Avatar, PageHead, btn, field, label } from "@/components/ui";
import { changePassword, confirmTwoStep, deleteFirm, removeMember, disableTwoStep, signOutSession, startTwoStep, updateFirm, updateProfile, removeStyleRule } from "@/lib/actions";
import { db } from "@/lib/db";
import QRCode from "qrcode";
import { otpauth } from "@/lib/totp";
import { open as openSecret } from "@/lib/secret";
import { sessionCutoff } from "@/lib/session";
import { requireUser } from "@/lib/session";
import { kv, people } from "@/lib/queries";
import { ago } from "@/lib/format";
import { deviceName } from "@/lib/device";
import CopyLink from "@/components/CopyLink";
import { firmLink, linkUrl, memberLink } from "@/lib/client-intake";
import { ROLES } from "@/lib/roles";
import AdminSwitch from "@/components/AdminSwitch";
import { inviteMember, revokeInvite } from "@/lib/actions";
import { inviteUrl, pendingInvites } from "@/lib/invites";
import RoleSelect from "@/components/RoleSelect";
import { rules } from "@/lib/memory";
import { ConfirmButton } from "@/components/Confirm";
import AutoSelect from "@/components/AutoSelect";

const TABS: [string, string][] = [["profile", "Profile"], ["security", "Security"], ["firm", "Firm"], ["automation", "Automation"]];

// Automation (Ismael, 2026-11-26): a rule with a key is the firm's choice, Automatic or Approval, and changes what
// Lincoln does. The others are fixed: raising dates and posting to Teams have nothing to approve, and emails and legal
// judgement always wait for an attorney, as uselincoln.com promises.
const RULES: [string, "reminders" | "calendar" | null, boolean][] = [
  ["Reading and filing case mail", null, true],
  ["Opening new cases", null, true],
  ["Client reminders after 3 days", "reminders", true],
  ["Deadlines raised 14 days before", null, true],
  ["Dates added to the calendar", "calendar", true],
  ["Review items posted to Teams", null, true],
  ["Other messages", null, false],
  ["Strategy and eligibility", null, false],
];
const device = deviceName;

const MSG: Record<string, Record<string, string>> = {
  profile: { name: "Name required.", sample: "Not available in the sample workspace." },
  security: { limited: "Too many attempts. Try again in 15 minutes.", sample: "Not available in the sample workspace.", current: "Wrong password.", nopassword: "Set a password first.", password: "10 characters min.", code: "Wrong code.", breached: "This password appears in known data breaches.", required: "The firm requires two step sign in.", admin: "Administrators only.", selffirst: "Turn on two step sign in for this account first." },
  firm: { current: "Wrong password.", invite: "A valid email and a role are needed.", member: "This email already has an account.", limited: "Too many invites. Try again later.", "1": "Administrators only.", sample: "Not available in the sample workspace.", delete: "Name or password did not match.", export: "Wrong password.", password: "Wrong password.", nopassword: "Set a password in Security first." },
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
  const sessions = tab === "security" ? (d.prepare("SELECT id, ip, agent, created_at, last_seen FROM sessions WHERE user_id = ? AND COALESCE(last_seen, created_at) > ? ORDER BY last_seen DESC").all(user.id, sessionCutoff()) as { id: string; ip: string | null; agent: string | null; created_at: string; last_seen: string | null }[]) : [];
  const devices: { name: string; ip: string | null; last: string; mine: boolean; ids: string[] }[] = [];
  for (const x of sessions) {
    const name = device(x.agent);
    const at = x.last_seen ?? x.created_at;
    const g = devices.find((y) => y.name === name);
    if (!g) devices.push({ name, ip: x.ip, last: at, mine: x.id === sessionId, ids: [x.id] });
    else { g.ids.push(x.id); g.mine ||= x.id === sessionId; if (at > g.last) { g.last = at; g.ip = x.ip; } }
  }
  const hasPassword = Boolean((db().prepare("SELECT password_hash FROM users WHERE id = ?").get(user.id) as { password_hash: string | null }).password_hash);
  const admin = Boolean(user.admin);
  const details = d.prepare("SELECT address, phone, email FROM firms WHERE id = ?").get(firm.id) as { address: string | null; phone: string | null; email: string | null };
  const bar = d.prepare("SELECT bar_number, bar_state FROM users WHERE id = ?").get(user.id) as { bar_number: string | null; bar_state: string | null };
  const err = error && tab !== "integrations" ? MSG[tab]?.[error] : null;

  return (
    <div className="rise mx-auto max-w-[832px]">
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

              <h2 className="mb-1 mt-12 text-[14px] font-medium">Signed in devices</h2>
              <div className="border-t border-line">
                {devices.map((x) => (
                  <Row key={x.name}>
                    <span className="min-w-0 flex-1"><span className="block truncate text-[13px]">{x.name}{x.mine ? <span className="text-faint"> · this device</span> : null}</span><span className="block text-[12px] text-faint">{x.ip ? `${x.ip} · ` : ""}{ago(x.last)}</span></span>
                    {!x.mine && <form action={signOutSession}><input type="hidden" name="session" value={x.ids.join(",")} /><ConfirmButton className={btn.ghost}>Sign out</ConfirmButton></form>}
                  </Row>
                ))}
              </div>
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
                      <><RoleSelect userId={p.id} role={p.role} roles={ROLES} /><AdminSwitch userId={p.id} on={Boolean(p.admin)} />{p.id !== user.id ? <form action={removeMember}><input type="hidden" name="user" value={p.id} /><ConfirmButton password className={btn.ghost}>Remove</ConfirmButton></form> : <span className="w-[68px]" />}</>
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
                        {admin && <form action={removeStyleRule.bind(null, k, i)}><ConfirmButton className={btn.ghost}>Remove</ConfirmButton></form>}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </details>
          )}

          {tab === "firm" && admin && !firm.demo && (
            <section className="mt-12">
              <h2 className="mb-1 text-[14px] font-medium">Export data</h2>
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
                <input name="confirm" required placeholder={`Type "${firm.name}"`} className={clsx(field, "max-w-[360px]")} />
                <input name="password" type="password" required autoComplete="current-password" placeholder="Password" className={clsx(field, "max-w-[360px]")} />
                <div><button className="inline-flex h-9 items-center border border-risk/40 px-3.5 text-[13px] font-medium text-risk transition hover:bg-risk-bg">Delete everything</button></div>
              </form>
            </section>
          )}

          {tab === "automation" && (
            <div className="border-t border-line">
              {RULES.map(([t, rule, auto]) => (
                <Row key={t}>
                  <span className="min-w-0 flex-1 text-[13px]">{t}</span>
                  {rule
                    ? <AutoSelect rule={rule} value={kv(firm.id, `auto:${rule}`) === "approval" ? "approval" : "auto"} disabled={!admin || Boolean(firm.demo)} />
                    : <span className={clsx("text-[13px]", auto ? "text-muted" : "font-medium")}>{auto ? "Automatic" : "Approval"}</span>}
                </Row>
              ))}
            </div>
          )}


        </div>
      </div>
    </div>
  );
}
