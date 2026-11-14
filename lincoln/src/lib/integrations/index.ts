import { db, uid } from "../db";
import { seal } from "../secret";
import * as google from "./google";
import * as microsoft from "./microsoft";
import type { Connection, FileHit, Inbound, OfficeKind, Provider } from "./types";

export type { Connection, FileHit, Inbound, OfficeKind, Provider } from "./types";
export { settingsOf } from "./types";

const P = { google, microsoft } as const;

export const PROVIDERS: { id: Provider; name: string; services: string[]; configured: () => boolean }[] = [
  { id: "google", name: "Google", services: ["Gmail", "Drive", "Docs", "Sheets", "Slides", "Calendar"], configured: google.configured },
  { id: "microsoft", name: "Microsoft", services: ["Outlook", "Word", "Excel", "PowerPoint", "OneDrive", "SharePoint", "Teams"], configured: microsoft.configured },
];
export const isProvider = (v: string): v is Provider => v === "google" || v === "microsoft";
export const authUrl = (p: Provider, state: string, mode: "auth" | "connect" = "connect") => P[p].authUrl(state, mode);

export const connectionsOf = (firmId: string, userId?: string) =>
  (userId
    ? db().prepare("SELECT * FROM mailboxes WHERE firm_id = ? AND user_id = ? ORDER BY created_at").all(firmId, userId)
    : db().prepare("SELECT * FROM mailboxes WHERE firm_id = ? ORDER BY created_at").all(firmId)) as Connection[];
export const connection = (firmId: string, userId: string, p: Provider) => db().prepare("SELECT * FROM mailboxes WHERE firm_id = ? AND user_id = ? AND provider = ?").get(firmId, userId, p) as Connection | undefined;
/** The connection to act through: the user's own first, otherwise any in the firm. */
export const firmMailbox = (firmId: string, userId?: string) => (userId ? connectionsOf(firmId, userId)[0] : undefined) ?? connectionsOf(firmId)[0];

/** Completes a sign in. Mail already in the inbox is marked as seen, so only new mail is worked. */
export async function connect(p: Provider, firmId: string, userId: string, code: string) {
  const t = await P[p].exchange(code);
  if (!t.refresh) throw new Error("Offline access was not granted.");
  linkIdentity(p, t.subject, userId);
  return store(p, firmId, userId, t);
}

/** Lets this Google or Microsoft account sign in to the Lincoln user, unless it already belongs to another. */
function linkIdentity(p: Provider, subject: string, userId: string) {
  if (!subject || subject.endsWith(":")) return;
  db().prepare("INSERT OR IGNORE INTO identities (provider, subject, user_id, created_at) VALUES (?, ?, ?, ?)").run(p, subject, userId, new Date().toISOString());
}

type Exchanged = Awaited<ReturnType<typeof google.exchange>>;

async function store(p: Provider, firmId: string, userId: string, t: Exchanged) {
  const d = db();
  d.prepare("DELETE FROM mailboxes WHERE firm_id = ? AND user_id = ? AND provider = ?").run(firmId, userId, p);
  const id = uid();
  d.prepare("INSERT INTO mailboxes (id, firm_id, user_id, provider, email, refresh_enc, access_enc, expires_at, created_at, settings) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, firmId, userId, p, t.email, seal(t.refresh), seal(t.access), t.expires, new Date().toISOString(), JSON.stringify({ granted: t.granted }));
  const c = d.prepare("SELECT * FROM mailboxes WHERE id = ?").get(id) as Connection;
  const seen = d.prepare("INSERT OR IGNORE INTO inbound_seen (mailbox_id, msg_id) VALUES (?, ?)");
  // A missing mail permission must not stop the sign in; the Integrations page shows what is missing.
  try { for (const m of await P[p].listInbox(c)) seen.run(id, m); } catch (e) { d.prepare("UPDATE mailboxes SET last_error = ? WHERE id = ?").run(`Mail: ${e instanceof Error ? e.message : "error"}`.slice(0, 200), id); }
  try { await ensurePush(c); } catch (e) { d.prepare("UPDATE mailboxes SET last_error = ? WHERE id = ?").run(`Instant delivery not set up: ${e instanceof Error ? e.message : "error"}`.slice(0, 200), id); }
  return t.email;
}

export async function fetchNew(c: Connection): Promise<Inbound[]> {
  const d = db();
  // Claim each message before reading it, so a notification and the safety sweep never both work it.
  const claim = d.prepare("INSERT OR IGNORE INTO inbound_seen (mailbox_id, msg_id) VALUES (?, ?)");
  const out: Inbound[] = [];
  for (const id of await P[c.provider].listInbox(c)) {
    if (out.length >= 10) break;
    if (claim.run(c.id, id).changes !== 1) continue;
    try {
      out.push(await P[c.provider].readMessage(c, id));
    } catch (e) {
      d.prepare("DELETE FROM inbound_seen WHERE mailbox_id = ? AND msg_id = ?").run(c.id, id);
      throw e;
    }
  }
  return out;
}

/** Asks the provider to notify Lincoln of new mail, and keeps the request from expiring. */
export async function ensurePush(c: Connection) {
  if (c.provider === "google") await google.watch(c);
  else await microsoft.subscribe(c);
}

export const send = (c: Connection, to: string, subject: string, body: string, threadId?: string | null) => (c.provider === "google" ? google.send(c, to, subject, body, threadId) : microsoft.send(c, to, subject, body));
export const addEvent = (c: Connection, e: { title: string; date: string; details: string }) => P[c.provider].addEvent(c, e);
export const searchFiles = (c: Connection, q: string): Promise<FileHit[]> => P[c.provider].searchFiles(c, q);
export const download = (c: Connection, id: string) => P[c.provider].download(c, id);
export const upload = (c: Connection, name: string, kind: OfficeKind, data: Buffer) => P[c.provider].upload(c, name, kind, data);
export const teamsChannels = (c: Connection) => microsoft.channels(c);
export const teamsPost = (c: Connection, teamId: string, channelId: string, html: string) => microsoft.post(c, teamId, channelId, html);

const CONSUMER = /^(gmail|googlemail|outlook|hotmail|live|msn|icloud|me|mac|yahoo|aol|proton|protonmail|pm)\./i;
const firmNameFrom = (email: string) => {
  const domain = email.split("@")[1] ?? "";
  if (!domain || CONSUMER.test(domain)) return "New firm";
  return domain.split(".")[0].split(/[-_]/).filter(Boolean).map((w) => w[0].toUpperCase() + w.slice(1)).join(" ") || "New firm";
};

export type SignInResult = { userId: string; firmId: string; created: boolean } | { error: "exists" | "unverified" | "sample" };

/**
 * Sign in or sign up with Google or Microsoft. A returning account is found by the provider's own
 * account id, never by email. A new account gets its own empty firm, and the same consent connects
 * mail, files, documents and calendar, so nothing else needs setting up.
 */
export async function signInWith(p: Provider, code: string): Promise<SignInResult> {
  const t = await P[p].exchange(code);
  const d = db();
  const linked = t.subject ? (d.prepare("SELECT i.user_id, u.firm_id, f.demo FROM identities i JOIN users u ON u.id = i.user_id JOIN firms f ON f.id = u.firm_id WHERE i.provider = ? AND i.subject = ?").get(p, t.subject) as { user_id: string; firm_id: string; demo: number } | undefined) : undefined;
  if (linked) {
    if (linked.demo) return { error: "sample" };
    if (t.refresh) await store(p, linked.firm_id, linked.user_id, t);
    return { userId: linked.user_id, firmId: linked.firm_id, created: false };
  }
  if (!t.accountEmail || !t.subject) return { error: "unverified" };
  // An existing password account is never taken over by email: it connects from Settings first.
  if (d.prepare("SELECT 1 FROM users WHERE email = ?").get(t.accountEmail)) return { error: "exists" };
  const firmId = "f_" + uid(), userId = "u_" + uid();
  const name = (t.name || t.accountEmail.split("@")[0]).slice(0, 100);
  const initials = name.split(/\s+/).filter(Boolean).map((w) => w[0].toUpperCase()).slice(0, 2).join("") || "U";
  d.transaction(() => {
    d.prepare("INSERT INTO firms (id, name, demo) VALUES (?, ?, 0)").run(firmId, firmNameFrom(t.accountEmail));
    d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, password_hash, created_at) VALUES (?, ?, ?, ?, 'Administrator', ?, NULL, ?)").run(userId, firmId, name, t.accountEmail, initials, new Date().toISOString());
  })();
  linkIdentity(p, t.subject, userId);
  if (t.refresh) await store(p, firmId, userId, t);
  return { userId, firmId, created: true };
}

const healthCache = new Map<string, { at: number; value: import("./google").Health }>();
/** Live check of every service on a connection, cached for five minutes. */
export async function checkHealth(c: Connection, fresh = false) {
  const hit = healthCache.get(c.id);
  if (!fresh && hit && Date.now() - hit.at < 5 * 60_000) return hit.value;
  const value = await Promise.race([P[c.provider].health(c), new Promise<import("./google").Health>((r) => setTimeout(() => r([{ service: "Check", ok: false, note: "Timed out" }]), 12_000))]);
  healthCache.set(c.id, { at: Date.now(), value });
  return value;
}
