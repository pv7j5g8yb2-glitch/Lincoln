import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { db } from "./db";
import { sha } from "./passwords";

export type User = { id: string; firm_id: string; name: string; email: string; role: string; initials: string; avatar: string | null };
export type Firm = { id: string; name: string; demo: number; require_2fa: number };
/** Who is looking: restricted (sensitive) cases are visible only to their team and to administrators. */
export type Viewer = { id: string; admin: boolean };

// In production the cookie carries the __Host- prefix: the browser then only accepts it over HTTPS,
// for this exact host, for the whole site, and no subdomain can set or overwrite it.
export const COOKIE = process.env.NODE_ENV === "production" ? "__Host-lincoln_session" : "lincoln_session";
export const MFA_COOKIE = process.env.NODE_ENV === "production" ? "__Host-lincoln_mfa" : "lincoln_mfa";
export const SESSION_HOURS = 12;
/** A session left untouched this long ends, even inside its 12 hours. */
export const IDLE_HOURS = 2;

export const isAdmin = (role: string) => /admin|managing/i.test(role);
export const viewer = (u: { id: string; role: string }): Viewer => ({ id: u.id, admin: isAdmin(u.role) });

export async function currentUser(): Promise<{ user: User; firm: Firm; sessionId: string; twoStep: boolean } | null> {
  const sid = (await cookies()).get(COOKIE)?.value;
  if (!sid) return null;
  const d = db();
  const hashed = sha(sid);
  const row = d.prepare("SELECT u.id, u.firm_id, u.name, u.email, u.role, u.initials, u.avatar, u.totp_enc IS NOT NULL AS two FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ? AND s.created_at > ? AND (s.last_seen IS NULL OR s.last_seen > ?)").get(hashed, new Date(Date.now() - SESSION_HOURS * 3600_000).toISOString(), new Date(Date.now() - IDLE_HOURS * 3600_000).toISOString()) as (User & { two: number }) | undefined;
  if (!row) return null;
  const { two, ...user } = row;
  const firm = d.prepare("SELECT id, name, demo, require_2fa FROM firms WHERE id = ?").get(user.firm_id) as Firm;
  // Last seen, at most once a minute.
  d.prepare("UPDATE sessions SET last_seen = ? WHERE id = ? AND (last_seen IS NULL OR last_seen < ?)").run(new Date().toISOString(), hashed, new Date(Date.now() - 60_000).toISOString());
  return { user, firm, sessionId: hashed, twoStep: Boolean(two) };
}

/**
 * Every page and action starts here. Nothing is read without a signed in user and their firm. When the
 * firm requires two step sign in, an account without it can only reach the screen that sets it up.
 */
export async function requireUser(opts: { setup?: boolean } = {}) {
  const s = await currentUser();
  if (!s) redirect("/signin");
  if (s.firm.require_2fa && !s.twoStep && !opts.setup) redirect("/settings?tab=security&required=1");
  return { ...s, viewer: viewer(s.user) };
}

/** For API routes: the signed in user, or null when there is none or the firm's two step rule is unmet. */
export async function apiUser() {
  const s = await currentUser();
  if (!s || (s.firm.require_2fa && !s.twoStep)) return null;
  return { ...s, viewer: viewer(s.user) };
}
