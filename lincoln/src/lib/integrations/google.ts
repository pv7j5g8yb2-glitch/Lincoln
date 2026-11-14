import { db } from "../db";
import { open, seal } from "../secret";
import { api, callback, json } from "./http";
import type { Connection, FileHit, Inbound, OfficeKind } from "./types";
import { OFFICE_MIME, safeAddress, settingsOf } from "./types";

// One Google sign in covers Gmail, Drive, Docs, Sheets, Slides and Calendar. Docs, Sheets and Slides
// are created through Drive by converting the Word, Excel and PowerPoint files Lincoln produces.

export const SCOPES = [
  "openid", "email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/drive.readonly",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/calendar.events",
];
export const configured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.APP_URL);

export function authUrl(state: string, mode: "auth" | "connect" = "connect") {
  const q = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: callback("google"), response_type: "code", scope: SCOPES.join(" "), access_type: "offline", prompt: mode === "auth" ? "select_account" : "consent", include_granted_scopes: "true", state });
  return api(`https://accounts.google.com/o/oauth2/v2/auth?${q}`);
}

type Token = { access_token: string; refresh_token?: string; expires_in?: number; id_token?: string; scope?: string };
async function token(body: Record<string, string>) {
  const res = await fetch(api("https://oauth2.googleapis.com/token"), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, client_secret: process.env.GOOGLE_CLIENT_SECRET!, ...body }) });
  return json<Token>(res, "Google");
}

export async function exchange(code: string) {
  const t = await token({ code, grant_type: "authorization_code", redirect_uri: callback("google") });
  const claims = JSON.parse(Buffer.from((t.id_token ?? "..").split(".")[1] ?? "", "base64url").toString() || "{}") as { email?: string; email_verified?: boolean; sub?: string; name?: string };
  const email = (claims.email ?? "").toLowerCase();
  // The id token comes straight from Google's token endpoint over TLS, so its claims are trusted as is.
  return { email, accountEmail: claims.email_verified ? email : "", subject: claims.sub ?? "", name: claims.name ?? "", granted: t.scope ?? "", refresh: t.refresh_token ?? "", access: t.access_token, expires: Date.now() + (t.expires_in ?? 3000) * 1000 };
}

async function access(c: Connection) {
  if (c.access_enc && c.expires_at && c.expires_at > Date.now() + 60_000) return open(c.access_enc);
  const t = await token({ refresh_token: open(c.refresh_enc), grant_type: "refresh_token" });
  db().prepare("UPDATE mailboxes SET access_enc = ?, expires_at = ? WHERE id = ?").run(seal(t.access_token), Date.now() + (t.expires_in ?? 3000) * 1000, c.id);
  return t.access_token;
}

async function call<T>(c: Connection, url: string, init: RequestInit = {}, what = "Google"): Promise<T> {
  const res = await fetch(api(url), { ...init, headers: { Authorization: `Bearer ${await access(c)}`, ...(init.body && typeof init.body === "string" ? { "Content-Type": "application/json" } : {}), ...(init.headers ?? {}) } });
  return json<T>(res, what);
}
async function raw(c: Connection, url: string) {
  const res = await fetch(api(url), { headers: { Authorization: `Bearer ${await access(c)}` } });
  if (!res.ok) throw new Error(`Google Drive replied ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

// Gmail

const GMAIL = "https://gmail.googleapis.com/gmail/v1/users/me";
export async function listInbox(c: Connection) {
  const r = await call<{ messages?: { id: string }[] }>(c, `${GMAIL}/messages?q=${encodeURIComponent("in:inbox newer_than:3d -from:me -category:promotions -category:social -category:forums")}&maxResults=25`, {}, "Gmail");
  return (r.messages ?? []).map((m) => m.id);
}

type Part = { mimeType: string; filename?: string; headers?: { name: string; value: string }[]; body?: { data?: string; attachmentId?: string; size?: number }; parts?: Part[] };
export async function readMessage(c: Connection, id: string): Promise<Inbound> {
  const m = await call<{ id: string; threadId: string; payload: Part }>(c, `${GMAIL}/messages/${id}?format=full`, {}, "Gmail");
  const h = (n: string) => m.payload.headers?.find((x) => x.name.toLowerCase() === n)?.value ?? "";
  const fromRaw = h("from");
  const email = (/<([^>]+)>/.exec(fromRaw)?.[1] ?? fromRaw).trim().toLowerCase();
  let text = "";
  const attachments: Inbound["attachments"] = [];
  const walk = async (p: Part) => {
    if (p.mimeType === "text/plain" && p.body?.data && !p.filename) text += Buffer.from(p.body.data, "base64url").toString("utf8");
    const isPdf = /pdf$/i.test(p.mimeType + p.filename);
    const isPhoto = /^image\/(jpeg|png|webp|heic|heif)$/i.test(p.mimeType) && (p.body?.size ?? 0) > 60_000;
    if (p.filename && (isPdf || isPhoto) && p.body?.attachmentId && (p.body.size ?? 0) < 25 * 1024 * 1024) {
      const a = await call<{ data: string }>(c, `${GMAIL}/messages/${id}/attachments/${p.body.attachmentId}`, {}, "Gmail");
      attachments.push({ name: p.filename, type: p.mimeType, data: Buffer.from(a.data, "base64url") });
    }
    for (const x of p.parts ?? []) await walk(x);
  };
  await walk(m.payload);
  const authn = m.payload.headers?.filter((x) => x.name.toLowerCase() === "authentication-results").map((x) => x.value).join(" ") ?? "";
  const bulk = Boolean(h("list-unsubscribe")) || /bulk|list|junk/i.test(h("precedence"));
  return { bulk, verified: /dmarc=pass/i.test(authn), id, threadId: m.threadId, from: email, fromName: fromRaw.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || email, subject: h("subject"), text: text.slice(0, 20000), attachments };
}

const header = (v: string) => (/^[\x20-\x7e]*$/.test(v) ? v : `=?UTF-8?B?${Buffer.from(v).toString("base64")}?=`);
export async function send(c: Connection, to: string, subject: string, body: string, threadId?: string | null) {
  to = safeAddress(to);
  subject = subject.replace(/[\r\n]+/g, " ").slice(0, 300);
  const mime = [`From: ${c.email}`, `To: ${to}`, `Subject: ${header(subject)}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", Buffer.from(body).toString("base64")].join("\r\n");
  await call(c, `${GMAIL}/messages/send`, { method: "POST", body: JSON.stringify({ raw: Buffer.from(mime).toString("base64url"), ...(threadId ? { threadId } : {}) }) }, "Gmail");
}

// Calendar

export async function addEvent(c: Connection, e: { title: string; date: string; details: string }) {
  const end = new Date(`${e.date}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  const r = await call<{ id: string }>(c, "https://www.googleapis.com/calendar/v3/calendars/primary/events", { method: "POST", body: JSON.stringify({ summary: e.title, description: e.details, start: { date: e.date }, end: { date: end.toISOString().slice(0, 10) }, reminders: { useDefault: true } }) }, "Google Calendar");
  return r.id;
}

// Drive, Docs, Sheets, Slides

export async function searchFiles(c: Connection, q: string): Promise<FileHit[]> {
  const terms = [`(mimeType = 'application/pdf' or mimeType contains 'image/')`, "trashed = false", ...(q ? [`name contains '${q.replace(/['\\]/g, "")}'`] : [])].join(" and ");
  const r = await call<{ files?: { id: string; name: string; modifiedTime?: string }[] }>(c, `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(terms)}&orderBy=modifiedTime desc&pageSize=25&fields=files(id,name,modifiedTime)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {}, "Google Drive");
  return (r.files ?? []).map((f) => ({ id: f.id, name: f.name, modified: f.modifiedTime ?? null, where: "Google Drive" }));
}

export const download = (c: Connection, id: string) => raw(c, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`);

async function folder(c: Connection) {
  const s = settingsOf(c);
  if (s.folderId) return s.folderId;
  const r = await call<{ id: string }>(c, "https://www.googleapis.com/drive/v3/files?fields=id", { method: "POST", body: JSON.stringify({ name: "Lincoln", mimeType: "application/vnd.google-apps.folder" }) }, "Google Drive");
  db().prepare("UPDATE mailboxes SET settings = ? WHERE id = ?").run(JSON.stringify({ ...s, folderId: r.id }), c.id);
  return r.id;
}

/** Saves an Office file into the Lincoln folder as a Google Doc, Sheet or Slides file. Returns its link. */
export async function upload(c: Connection, name: string, kind: OfficeKind, data: Buffer) {
  const parent = await folder(c);
  const boundary = `lincoln${Date.now()}`;
  const meta = JSON.stringify({ name, parents: [parent], mimeType: `application/vnd.google-apps.${kind}` });
  const body = Buffer.concat([
    Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${meta}\r\n--${boundary}\r\nContent-Type: ${OFFICE_MIME[kind]}\r\n\r\n`),
    data,
    Buffer.from(`\r\n--${boundary}--`),
  ]);
  const r = await call<{ id: string; webViewLink?: string }>(c, "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink", { method: "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body }, "Google Drive");
  return r.webViewLink ?? `https://drive.google.com/open?id=${r.id}`;
}

// Instant delivery: Gmail tells Google Pub/Sub about new inbox mail, and Pub/Sub calls Lincoln.
// The watch lasts up to 7 days; Lincoln renews it daily.
export const pushConfigured = () => Boolean(process.env.GOOGLE_PUBSUB_TOPIC && process.env.GOOGLE_PUSH_TOKEN);
export async function watch(c: Connection) {
  if (!pushConfigured()) return;
  const s = settingsOf(c);
  if (s.watchUntil && s.watchUntil > Date.now() + 24 * 3600_000 * 5) return;
  const r = await call<{ historyId: string; expiration: string }>(c, `${GMAIL}/watch`, { method: "POST", body: JSON.stringify({ topicName: process.env.GOOGLE_PUBSUB_TOPIC, labelIds: ["INBOX"], labelFilterBehavior: "INCLUDE" }) }, "Gmail");
  db().prepare("UPDATE mailboxes SET settings = ? WHERE id = ?").run(JSON.stringify({ ...s, watchUntil: Number(r.expiration) }), c.id);
}

export type Health = { service: string; ok: boolean; note?: string }[];
const has = (granted: string, scope: string) => granted.split(/\s+/).includes(`https://www.googleapis.com/auth/${scope}`);

/** Calls each service once, read only, and checks the permissions that cannot be tried without side effects. */
export async function health(c: Connection): Promise<Health> {
  const granted = settingsOf(c).granted ?? "";
  const probe = async (service: string, url: string, scope: string) => {
    if (granted && !has(granted, scope)) return { service, ok: false, note: "Permission not granted" };
    try { await call(c, url); return { service, ok: true }; } catch (e) { return { service, ok: false, note: e instanceof Error ? e.message : "Failed" }; }
  };
  const out: Health = [
    await probe("Gmail", `${GMAIL}/profile`, "gmail.readonly"),
    granted ? { service: "Sending", ok: has(granted, "gmail.send"), note: has(granted, "gmail.send") ? undefined : "Permission not granted" } : { service: "Sending", ok: true },
    await probe("Drive", "https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id)", "drive.readonly"),
    granted ? { service: "Docs, Sheets, Slides", ok: has(granted, "drive.file"), note: has(granted, "drive.file") ? undefined : "Permission not granted" } : { service: "Docs, Sheets, Slides", ok: true },
    await probe("Calendar", "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1", "calendar.events"),
  ];
  out.push(pushConfigured() ? { service: "Instant mail", ok: Boolean(settingsOf(c).watchUntil && settingsOf(c).watchUntil! > Date.now()), note: settingsOf(c).watchUntil ? undefined : "Not set up yet; mail is checked every 5 minutes" } : { service: "Instant mail", ok: false, note: "Off; mail is checked every 5 minutes" });
  return out;
}
