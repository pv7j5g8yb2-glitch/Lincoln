import crypto from "node:crypto";
import { db, uid } from "./db";
import { derivedKey } from "./keys";

// Phone and desktop notifications (Web Push). Nothing is installed: the server key is derived from the
// master secret, every message is signed (VAPID, RFC 8292) and encrypted for the device (RFC 8291), so the
// push services that carry it cannot read it. A notification goes out only when the person is not in the
// app; while they are, the app itself shows the change.

const b64u = (b: Buffer) => b.toString("base64url");

type Keys = { publicKey: string; key: crypto.KeyObject };
let keys: Keys | null = null;
function vapid(): Keys {
  if (keys) return keys;
  const ecdh = crypto.createECDH("prime256v1");
  ecdh.setPrivateKey(Buffer.from(derivedKey("vapid"), "hex"));
  const pub = ecdh.getPublicKey();
  const key = crypto.createPrivateKey({ key: { kty: "EC", crv: "P-256", d: b64u(ecdh.getPrivateKey()), x: b64u(pub.subarray(1, 33)), y: b64u(pub.subarray(33)) }, format: "jwk" });
  return (keys = { publicKey: b64u(pub), key });
}
export const vapidPublicKey = () => vapid().publicKey;

function jwt(audience: string) {
  const enc = (o: object) => b64u(Buffer.from(JSON.stringify(o)));
  const body = `${enc({ typ: "JWT", alg: "ES256" })}.${enc({ aud: audience, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: "mailto:hello@uselincoln.com" })}`;
  return `${body}.${b64u(crypto.sign("sha256", Buffer.from(body), { key: vapid().key, dsaEncoding: "ieee-p1363" }))}`;
}

const hmac = (key: Buffer, data: Buffer) => crypto.createHmac("sha256", key).update(data).digest();

/** RFC 8291: the payload encrypted for one subscription (aes128gcm, one record). */
export function encrypt(payload: Buffer, p256dh: string, auth: string) {
  const ua = Buffer.from(p256dh, "base64url"), secret = Buffer.from(auth, "base64url");
  const ecdh = crypto.createECDH("prime256v1");
  const as = ecdh.generateKeys();
  const shared = ecdh.computeSecret(ua);
  const ikm = hmac(hmac(secret, shared), Buffer.concat([Buffer.from("WebPush: info\0"), ua, as, Buffer.from([1])]));
  const salt = crypto.randomBytes(16);
  const prk = hmac(salt, ikm);
  const cek = hmac(prk, Buffer.from("Content-Encoding: aes128gcm\0\x01")).subarray(0, 16);
  const nonce = hmac(prk, Buffer.from("Content-Encoding: nonce\0\x01")).subarray(0, 12);
  const c = crypto.createCipheriv("aes-128-gcm", cek, nonce);
  const body = Buffer.concat([c.update(Buffer.concat([payload, Buffer.from([2])])), c.final(), c.getAuthTag()]);
  const rs = Buffer.alloc(4); rs.writeUInt32BE(4096);
  return Buffer.concat([salt, rs, Buffer.from([as.length]), as, body]);
}

export type Notice = { title: string; body: string; url: string; tag: string; client?: string };
type Sub = { id: string; endpoint: string; p256dh: string; auth: string };

async function deliver(sub: Sub, n: Notice) {
  try {
    const res = await fetch(sub.endpoint, {
      method: "POST",
      headers: { TTL: "86400", Urgency: "normal", "Content-Encoding": "aes128gcm", "Content-Type": "application/octet-stream", Authorization: `vapid t=${jwt(new URL(sub.endpoint).origin)}, k=${vapidPublicKey()}` },
      body: new Uint8Array(encrypt(Buffer.from(JSON.stringify(n)), sub.p256dh, sub.auth)),
      signal: AbortSignal.timeout(15_000),
    });
    // A subscription the browser has dropped is removed.
    if (res.status === 404 || res.status === 410) db().prepare("DELETE FROM push_subs WHERE id = ?").run(sub.id);
  } catch { /* the next notice tries again */ }
}

export function saveSubscription(firmId: string, userId: string, session: string, s: { endpoint?: unknown; keys?: { p256dh?: unknown; auth?: unknown } }) {
  const endpoint = String(s.endpoint ?? ""), p256dh = String(s.keys?.p256dh ?? ""), auth = String(s.keys?.auth ?? "");
  if (!/^https:\/\/[^\s]{10,800}$/.test(endpoint) || !p256dh || !auth) return false;
  const d = db();
  d.prepare("DELETE FROM push_subs WHERE endpoint = ?").run(endpoint);
  d.prepare("INSERT INTO push_subs (id, firm_id, user_id, endpoint, p256dh, auth, session, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(uid(), firmId, userId, endpoint, p256dh, auth, session, new Date().toISOString());
  return true;
}
export const dropSubscription = (userId: string, endpoint: string) => db().prepare("DELETE FROM push_subs WHERE user_id = ? AND endpoint = ?").run(userId, endpoint);

// Presence: the app reports while it is open and visible. Someone seen in the last 45 seconds is in the app.
const g = globalThis as unknown as { lincolnSeen?: Map<string, number>; lincolnQueue?: Map<string, { items: Notice[]; timer: NodeJS.Timeout }> };
const seen = (g.lincolnSeen ??= new Map());
export const markPresence = (userId: string, here: boolean) => (here ? seen.set(userId, Date.now()) : seen.delete(userId));
export const isPresent = (userId: string) => Date.now() - (seen.get(userId) ?? 0) < 45_000;

/**
 * Queues a notice for a person who is not in the app. Notices that arrive close together go out as one, so
 * a case that produces three items for review makes one notification, not three.
 */
export function notify(userId: string, n: Notice, opts: { wait?: number } = {}) {
  if (isPresent(userId)) return;
  const subs = db().prepare("SELECT id, endpoint, p256dh, auth FROM push_subs WHERE user_id = ?").all(userId) as Sub[];
  if (!subs.length) return;
  const queue = (g.lincolnQueue ??= new Map());
  const q = queue.get(userId);
  if (q) { q.items.push(n); return; }
  const entry = { items: [n], timer: setTimeout(() => {
    queue.delete(userId);
    if (isPresent(userId)) return;
    const out = combine(entry.items);
    const now = db().prepare("SELECT id, endpoint, p256dh, auth FROM push_subs WHERE user_id = ?").all(userId) as Sub[];
    for (const s of now) void deliver(s, out);
  }, opts.wait ?? 20_000) };
  queue.set(userId, entry);
}

/** Several notices become one: the same kind keeps its title; mixed kinds read "Ready for review". */
export function combine(items: Notice[]): Notice {
  if (items.length === 1) return items[0];
  const chats = items.filter((i) => i.tag.startsWith("chat:"));
  if (chats.length === items.length) return { ...chats[chats.length - 1], body: `${items.length} replies. ${chats[chats.length - 1].body}` };
  const work = items.filter((i) => !i.tag.startsWith("chat:"));
  const titles = new Set(work.map((i) => i.title));
  const names = [...new Set(work.map((i) => i.client).filter(Boolean))] as string[];
  const who = names.length === 1 ? ` for ${names[0]}` : names.length === 2 ? `: ${names.join(" and ")}` : names.length > 2 ? `: ${names.slice(0, 2).join(", ")} and ${names.length - 2} more` : "";
  const url = names.length === 1 && work[0].url.startsWith("/cases/") ? work[0].url : "/approvals";
  return { title: titles.size === 1 ? [...titles][0] : "Ready for review", body: `${work.length} items${who}.`, url, tag: "review" };
}

/** The notice for an item that has just landed in Review. */
export function reviewNotice(kind: string, title: string, client: string, caseId: string | null): Notice {
  const url = caseId ? `/cases/${caseId}` : "/approvals";
  const tag = `review:${caseId ?? "firm"}`;
  if (kind === "packet") return { title: "Filing packet ready", body: `${client}. Forms filled for review.`, url, tag, client };
  if (kind === "draft_review") return { title: "Draft ready", body: `${client}. ${title.replace(/^Draft for review:\s*/i, "")}`, url, tag, client };
  if (kind === "message") return { title: "Email awaiting approval", body: title, url: "/approvals", tag, client };
  return { title: "Ready for review", body: `${client}. ${title}`, url, tag, client };
}

/** Markdown reduced to one plain line for a notification preview. */
export const preview = (md: string, max = 140) => {
  const t = md.replace(/```[\s\S]*?```/g, " ").replace(/^\s*(#{1,6}|>|[-*+]|\d+[.)])\s+/gm, "").replace(/\*\*|__|`|\|/g, "").replace(/(^|[\s(])[*_]([^*_\n]+)[*_](?=[\s.,;:!?)]|$)/g, "$1$2").replace(/\[([^\]]+)\]\([^)]+\)/g, "$1").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max - 1).replace(/\s+\S*$/, "")}…` : t;
};

let lastScan: string | null = null;
/** Items that landed in Review since the last look, each sent to the person it is assigned to. */
export function scanReview() {
  const d = db();
  const now = new Date().toISOString();
  if (!lastScan) { lastScan = now; return; }
  const rows = d.prepare(`SELECT a.kind, a.title, a.case_id, a.assignee_id, c.client, c.attorney_id
    FROM approvals a LEFT JOIN cases c ON c.id = a.case_id JOIN firms f ON f.id = a.firm_id
    WHERE a.status = 'pending' AND a.created_at > ? AND a.created_at <= ? AND f.demo = 0`).all(lastScan, now) as { kind: string; title: string; case_id: string | null; assignee_id: string | null; client: string | null; attorney_id: string | null }[];
  lastScan = now;
  for (const r of rows) {
    const who = r.assignee_id ?? r.attorney_id;
    if (who) notify(who, reviewNotice(r.kind, r.title, r.client ?? "Firm", r.case_id));
  }
}
