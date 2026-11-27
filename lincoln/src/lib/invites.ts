import { db, uid } from "./db";
import { hashPassword, initialsOf, newToken, sha } from "./auth";
import { ROLES } from "./roles";
import { appUrl } from "./integrations/http";

// Nobody signs up on their own. Lincoln sets up each firm with an invite for the person who contacted us, who
// becomes its admin; that admin invites everyone else and decides who else is an admin. An invite is a link that
// works once, for one email, for 14 days. Only its hash is stored.

export type Invite = { token_hash: string; firm_id: string; firm: string; email: string; role: string | null; admin: number };

const DAYS = 14;
const now = () => new Date().toISOString();
export const inviteUrl = (token: string) => `${appUrl()}/join/${token}`;

export function createInvite(firmId: string, email: string, opts: { role?: string | null; admin?: boolean; by?: string | null } = {}) {
  const token = newToken();
  const d = db();
  // A newer invite to the same person at the same firm replaces any earlier one.
  d.prepare("DELETE FROM invites WHERE firm_id = ? AND email = ? AND used_at IS NULL").run(firmId, email);
  d.prepare("INSERT INTO invites (token_hash, firm_id, email, role, admin, invited_by, created_at, expires_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(sha(token), firmId, email, opts.role && ROLES.includes(opts.role) ? opts.role : null, opts.admin ? 1 : 0, opts.by ?? null, now(), new Date(Date.now() + DAYS * 86400_000).toISOString());
  return token;
}

const live = "i.used_at IS NULL AND i.expires_at > ?";

export function findInvite(token: string): Invite | null {
  if (!/^[\w-]{20,80}$/.test(token)) return null;
  return (db().prepare(`SELECT i.token_hash, i.firm_id, f.name AS firm, i.email, i.role, i.admin FROM invites i JOIN firms f ON f.id = i.firm_id WHERE i.token_hash = ? AND ${live}`).get(sha(token), now()) as Invite | undefined) ?? null;
}

/** The open invite for an email, for joining with Google or Microsoft instead of a password. */
export function inviteForEmail(email: string): Invite | null {
  return (db().prepare(`SELECT i.token_hash, i.firm_id, f.name AS firm, i.email, i.role, i.admin FROM invites i JOIN firms f ON f.id = i.firm_id WHERE i.email = ? AND ${live} ORDER BY i.created_at DESC LIMIT 1`).get(email.toLowerCase(), now()) as Invite | undefined) ?? null;
}

/** Turns an invite into an account in its firm. Returns the new user's id, or null if the email is taken. */
export function acceptInvite(inv: Invite, name: string, password: string | null, role: string) {
  const d = db();
  if (d.prepare("SELECT 1 FROM users WHERE email = ?").get(inv.email)) return null;
  const id = "u_" + uid();
  d.transaction(() => {
    d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, password_hash, created_at, admin) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, inv.firm_id, name, inv.email, ROLES.includes(role) ? role : inv.role ?? "Attorney", initialsOf(name), password ? hashPassword(password) : null, now(), inv.admin);
    d.prepare("UPDATE invites SET used_at = ? WHERE token_hash = ?").run(now(), inv.token_hash);
  })();
  return id;
}

export const pendingInvites = (firmId: string) => db().prepare("SELECT token_hash, email, role, admin, expires_at FROM invites WHERE firm_id = ? AND used_at IS NULL AND expires_at > ? ORDER BY created_at DESC").all(firmId, now()) as { token_hash: string; email: string; role: string | null; admin: number; expires_at: string }[];

/** Lincoln sets up a firm for the person who contacted us: an empty firm and an admin invite for them. */
export function setUpFirm(name: string, adminEmail: string) {
  const firmId = "f_" + uid();
  db().prepare("INSERT INTO firms (id, name, demo) VALUES (?, ?, 0)").run(firmId, name);
  return { firmId, token: createInvite(firmId, adminEmail, { admin: true }) };
}

/** People who may set up firms: the emails in LINCOLN_OPS_EMAILS, set on the server only. */
export const isOps = (email: string) => (process.env.LINCOLN_OPS_EMAILS ?? "").split(",").map((e) => e.trim().toLowerCase()).filter(Boolean).includes(email.toLowerCase());
