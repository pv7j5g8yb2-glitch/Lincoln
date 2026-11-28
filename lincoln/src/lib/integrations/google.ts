import { db } from "../db";
import { open, seal } from "../secret";
import { api, callback, json } from "./http";
import type { Connection, FileHit, FolderHit, Inbound, OfficeKind } from "./types";
import { OFFICE_MIME, keepAttachment, safeAddress, settingsOf, automatic, messageIdOf } from "./types";

// One Google sign in covers Gmail, Drive, Docs, Sheets, Slides and Calendar. Docs, Sheets and Slides
// are created through Drive by converting the Word, Excel and PowerPoint files Lincoln produces.

export const SCOPES = [
  "openid", "email",
  "https://www.googleapis.com/auth/gmail.readonly",
  "https://www.googleapis.com/auth/gmail.send",
  "https://www.googleapis.com/auth/gmail.compose",
  // Full Drive: read the firm's files and save into its own client folders, not only folders Lincoln made. Like
  // gmail.readonly it is a restricted scope, covered by the same CASA assessment.
  "https://www.googleapis.com/auth/drive",
  "https://www.googleapis.com/auth/calendar.events",
];
export const configured = () => Boolean(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET && process.env.APP_URL);

/** Reading and answering in the firm's Lincoln space in Google Chat, asked for only when the firm turns it on. */
export const CHAT_SCOPES = ["https://www.googleapis.com/auth/chat.spaces.readonly", "https://www.googleapis.com/auth/chat.messages.readonly", "https://www.googleapis.com/auth/chat.messages.create"];
export function authUrl(state: string, mode: "auth" | "connect" = "connect", chat = false) {
  const q = new URLSearchParams({ client_id: process.env.GOOGLE_CLIENT_ID!, redirect_uri: callback("google"), response_type: "code", scope: [...SCOPES, ...(chat ? CHAT_SCOPES : [])].join(" "), access_type: "offline", prompt: mode === "auth" ? "select_account" : "consent", include_granted_scopes: "true", state });
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
    // An inline part (a logo in a signature) has a Content-ID and no attachment disposition.
    const inline = Boolean(p.headers?.some((x) => x.name.toLowerCase() === "content-id")) && !p.headers?.some((x) => x.name.toLowerCase() === "content-disposition" && /attachment/i.test(x.value));
    if (p.filename && p.body?.attachmentId && attachments.length < 30 && keepAttachment(p.filename, p.mimeType, p.body.size ?? 0, inline)) {
      const a = await call<{ data: string }>(c, `${GMAIL}/messages/${id}/attachments/${p.body.attachmentId}`, {}, "Gmail");
      attachments.push({ name: p.filename, type: p.mimeType, data: Buffer.from(a.data, "base64url") });
      // A forwarded email attached whole is read as the email it is; its own parts are not walked twice.
      if (/^message\/rfc822$/i.test(p.mimeType)) return;
    }
    for (const x of p.parts ?? []) await walk(x);
  };
  await walk(m.payload);
  const authn = m.payload.headers?.filter((x) => x.name.toLowerCase() === "authentication-results").map((x) => x.value).join(" ") ?? "";
  const bulk = Boolean(h("list-unsubscribe")) || /bulk|list|junk/i.test(h("precedence"));
  return { messageId: messageIdOf(h("message-id")) || undefined, auto: automatic(h, h("subject"), email), bulk, verified: /dmarc=pass/i.test(authn), id, threadId: m.threadId, from: email, fromName: fromRaw.replace(/<[^>]+>/, "").replace(/"/g, "").trim() || email, subject: h("subject"), text: text.slice(0, 20000), attachments };
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
  const kinds = ["application/pdf", "application/msword", "application/rtf", "text/plain", "text/csv", "application/zip", "message/rfc822", "application/vnd.ms-outlook", "application/vnd.google-apps.document", "application/vnd.google-apps.spreadsheet", "application/vnd.google-apps.presentation", OFFICE_MIME.document, OFFICE_MIME.spreadsheet, OFFICE_MIME.presentation, "application/vnd.ms-powerpoint", "application/vnd.ms-excel", "application/vnd.oasis.opendocument.text", "application/vnd.oasis.opendocument.spreadsheet", "application/vnd.oasis.opendocument.presentation", "application/vnd.wordperfect", "text/html"];
  const terms = [`(mimeType contains 'image/' or ${kinds.map((k) => `mimeType = '${k}'`).join(" or ")})`, "trashed = false", ...(q ? [`name contains '${q.replace(/['\\]/g, "")}'`] : [])].join(" and ");
  const r = await call<{ files?: { id: string; name: string; mimeType?: string; modifiedTime?: string }[] }>(c, `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(terms)}&orderBy=modifiedTime desc&pageSize=25&fields=files(id,name,mimeType,modifiedTime)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {}, "Google Drive");
  // A Google Doc or Sheet has no file of its own; it is downloaded as Word or Excel, marked in its id.
  const tag = (m?: string) => (m === "application/vnd.google-apps.document" ? "gdoc:" : m === "application/vnd.google-apps.spreadsheet" ? "gsheet:" : m === "application/vnd.google-apps.presentation" ? "gslides:" : "");
  return (r.files ?? []).map((f) => ({ id: `${tag(f.mimeType)}${f.id}`, name: f.name, modified: f.modifiedTime ?? null, where: "Google Drive" }));
}

export const download = (c: Connection, id: string) => {
  const [, kind, file] = /^(gdoc:|gsheet:|gslides:)?(.+)$/.exec(id)!;
  if (kind) return raw(c, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file)}/export?mimeType=${encodeURIComponent(kind === "gdoc:" ? OFFICE_MIME.document : kind === "gsheet:" ? OFFICE_MIME.spreadsheet : OFFICE_MIME.presentation)}`);
  return raw(c, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(file)}?alt=media&supportsAllDrives=true`);
};

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
    await probe("Drive", "https://www.googleapis.com/drive/v3/files?pageSize=1&fields=files(id)", "drive"),
    granted ? { service: "Drafts", ok: has(granted, "gmail.compose"), note: has(granted, "gmail.compose") ? undefined : "Permission not granted" } : { service: "Drafts", ok: true },
    granted ? { service: "Docs, Sheets, Slides", ok: has(granted, "drive"), note: has(granted, "drive") ? undefined : "Permission not granted" } : { service: "Docs, Sheets, Slides", ok: true },
    await probe("Calendar", "https://www.googleapis.com/calendar/v3/calendars/primary/events?maxResults=1", "calendar.events"),
  ];
  out.push(pushConfigured() ? { service: "Instant mail", ok: Boolean(settingsOf(c).watchUntil && settingsOf(c).watchUntil! > Date.now()), note: settingsOf(c).watchUntil ? undefined : "Not set up yet; mail is checked every 5 minutes" } : { service: "Instant mail", ok: false, note: "Off; mail is checked every 5 minutes" });
  return out;
}

// Drafts in the lawyer's own Gmail. Every email Lincoln prepares is also a Gmail draft, so it can be read, changed
// and sent from Gmail itself; Lincoln keeps its copy in step and notices when it has been sent.

const mimeOf = (c: Connection, m: { to: string; subject: string; body: string }) => Buffer.from([`From: ${c.email}`, `To: ${safeAddress(m.to)}`, `Subject: ${header(m.subject.replace(/[\r\n]+/g, " ").slice(0, 300))}`, "MIME-Version: 1.0", "Content-Type: text/plain; charset=UTF-8", "Content-Transfer-Encoding: base64", "", Buffer.from(m.body).toString("base64")].join("\r\n")).toString("base64url");
const isMissing = (e: unknown) => /replied 404/.test(e instanceof Error ? e.message : "");

export async function createDraft(c: Connection, m: { to: string; subject: string; body: string; threadId?: string | null }) {
  const r = await call<{ id: string }>(c, `${GMAIL}/drafts`, { method: "POST", body: JSON.stringify({ message: { raw: mimeOf(c, m), ...(m.threadId ? { threadId: m.threadId } : {}) } }) }, "Gmail");
  return r.id;
}
export async function updateDraft(c: Connection, id: string, m: { to: string; subject: string; body: string; threadId?: string | null }) {
  await call(c, `${GMAIL}/drafts/${encodeURIComponent(id)}`, { method: "PUT", body: JSON.stringify({ id, message: { raw: mimeOf(c, m), ...(m.threadId ? { threadId: m.threadId } : {}) } }) }, "Gmail");
}
export async function sendDraft(c: Connection, id: string) {
  await call(c, `${GMAIL}/drafts/send`, { method: "POST", body: JSON.stringify({ id }) }, "Gmail");
}
export async function deleteDraft(c: Connection, id: string) {
  const res = await fetch(api(`${GMAIL}/drafts/${encodeURIComponent(id)}`), { method: "DELETE", headers: { Authorization: `Bearer ${await access(c)}` } });
  if (!res.ok && res.status !== 404) throw new Error(`Gmail replied ${res.status}`);
}
/** Where a draft stands: still a draft (with its text as the lawyer left it), sent from Gmail, or deleted. */
export async function readDraft(c: Connection, id: string, m: { to: string; subject: string; threadId?: string | null; since: string }): Promise<{ state: "open"; subject: string; body: string } | { state: "sent" | "gone" }> {
  try {
    const d = await call<{ message: { payload: Part } }>(c, `${GMAIL}/drafts/${encodeURIComponent(id)}?format=full`, {}, "Gmail");
    const h = (n: string) => d.message.payload.headers?.find((x) => x.name.toLowerCase() === n)?.value ?? "";
    let body = "";
    const walk = (p: Part) => { if (p.mimeType === "text/plain" && p.body?.data && !p.filename) body += Buffer.from(p.body.data, "base64url").toString("utf8"); for (const x of p.parts ?? []) walk(x); };
    walk(d.message.payload);
    return { state: "open", subject: h("subject"), body };
  } catch (e) {
    if (!isMissing(e)) throw e;
  }
  const after = Math.floor(Date.parse(m.since) / 1000);
  const q = `in:sent to:${safeAddress(m.to)} after:${after}`;
  const r = await call<{ messages?: { id: string; threadId: string }[] }>(c, `${GMAIL}/messages?q=${encodeURIComponent(q)}&maxResults=10`, {}, "Gmail");
  return (r.messages ?? []).some((x) => !m.threadId || x.threadId === m.threadId) ? { state: "sent" } : { state: "gone" };
}

/** Message ids from the lawyer's mail matching a Gmail search, newest first. */
export async function searchMail(c: Connection, q: string, max = 20) {
  const r = await call<{ messages?: { id: string }[] }>(c, `${GMAIL}/messages?q=${encodeURIComponent(q)}&maxResults=${max}`, {}, "Gmail");
  return (r.messages ?? []).map((m) => m.id);
}

// Lincoln's own folder, Lincoln/Clients/<client>, used when the firm keeps no client folders Lincoln can find.

async function childFolder(c: Connection, parent: string, name: string) {
  const safe = name.replace(/['\\]/g, "").slice(0, 120);
  const q = `name = '${safe}' and '${parent}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`;
  const r = await call<{ files?: { id: string }[] }>(c, `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {}, "Google Drive");
  if (r.files?.[0]) return r.files[0].id;
  const made = await call<{ id: string }>(c, "https://www.googleapis.com/drive/v3/files?fields=id&supportsAllDrives=true", { method: "POST", body: JSON.stringify({ name: safe, mimeType: "application/vnd.google-apps.folder", parents: [parent] }) }, "Google Drive");
  return made.id;
}

/** Saves a file into Lincoln/<path...>, replacing an earlier version of the same name. Returns the file's and folder's links. */
export async function saveFile(c: Connection, path: string[], name: string, mime: string, data: Buffer, as?: string) {
  let parent = await folder(c);
  for (const p of path) parent = await childFolder(c, parent, p);
  return saveInto(c, parent, name, mime, data, as);
}

/** Saves a file into a given folder; a file of the same name there gets a new version, so Drive keeps its history. */
export async function saveInto(c: Connection, parent: string, name: string, mime: string, data: Buffer, as?: string) {
  const safe = name.replace(/['\\]/g, "").slice(0, 150);
  const found = await call<{ files?: { id: string }[] }>(c, `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name = '${safe}' and '${parent}' in parents and trashed = false`)}&fields=files(id)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {}, "Google Drive");
  let r: { id: string; webViewLink?: string };
  if (found.files?.[0]) {
    r = await call(c, `https://www.googleapis.com/upload/drive/v3/files/${encodeURIComponent(found.files[0].id)}?uploadType=media&fields=id,webViewLink&supportsAllDrives=true`, { method: "PATCH", headers: { "Content-Type": mime }, body: new Uint8Array(data) }, "Google Drive");
  } else {
    const boundary = `lincoln${Date.now()}`;
    const body = Buffer.concat([Buffer.from(`--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${JSON.stringify({ name: safe, parents: [parent], ...(as ? { mimeType: as } : {}) })}\r\n--${boundary}\r\nContent-Type: ${mime}\r\n\r\n`), data, Buffer.from(`\r\n--${boundary}--`)]);
    r = await call(c, "https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,webViewLink&supportsAllDrives=true", { method: "POST", headers: { "Content-Type": `multipart/related; boundary=${boundary}` }, body }, "Google Drive");
  }
  return { link: r.webViewLink ?? `https://drive.google.com/open?id=${r.id}`, folder: `https://drive.google.com/drive/folders/${parent}` };
}

/** Folders in the firm's Drive whose name contains a word, leaving out the ones Lincoln made for itself. */
export async function findFolders(c: Connection, word: string): Promise<FolderHit[]> {
  const q = `mimeType = 'application/vnd.google-apps.folder' and name contains '${word.replace(/['\\]/g, "")}' and trashed = false`;
  const r = await call<{ files?: { id: string; name: string; parents?: string[] }[] }>(c, `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(q)}&pageSize=50&fields=files(id,name,parents)&supportsAllDrives=true&includeItemsFromAllDrives=true`, {}, "Google Drive");
  const s = settingsOf(c);
  let own: string | null = null;
  if (s.folderId) {
    const cl = await call<{ files?: { id: string }[] }>(c, `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(`name = 'Clients' and '${s.folderId}' in parents and trashed = false`)}&fields=files(id)`, {}, "Google Drive");
    own = cl.files?.[0]?.id ?? null;
  }
  return (r.files ?? []).filter((f) => !f.parents?.some((p) => p === own || p === s.folderId)).map((f) => ({ id: f.id, name: f.name, parent: f.parents?.[0] ?? null, url: `https://drive.google.com/drive/folders/${f.id}` }));
}

/** A folder of this name inside a parent, made if it is not there. */
export async function makeFolder(c: Connection, parent: string, name: string) {
  const id = await childFolder(c, parent, name);
  return { id, url: `https://drive.google.com/drive/folders/${id}` };
}

/** A Google Doc as a Word file (tracked changes made to it come back as suggestions when it is saved as a Doc again). */
export async function docAsWord(c: Connection, id: string) {
  const meta = await call<{ name: string; mimeType: string }>(c, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?fields=name,mimeType&supportsAllDrives=true`, {}, "Google Drive");
  const docx = OFFICE_MIME.document;
  const data = meta.mimeType === "application/vnd.google-apps.document"
    ? await raw(c, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}/export?mimeType=${encodeURIComponent(docx)}`)
    : meta.mimeType === docx ? await raw(c, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(id)}?alt=media&supportsAllDrives=true`) : null;
  return data ? { name: `${meta.name.replace(/\.docx$/i, "")}.docx`, data } : null;
}

// Google Chat: requests posted in the firm's Lincoln space, and items for review posted there.

const CHAT = "https://chat.googleapis.com/v1";
export async function chatSpaces(c: Connection) {
  const r = await call<{ spaces?: { name: string; displayName?: string }[] }>(c, `${CHAT}/spaces?pageSize=100&filter=${encodeURIComponent('spaceType = "SPACE"')}`, {}, "Google Chat");
  return (r.spaces ?? []).map((x) => ({ space: x.name, name: x.displayName ?? x.name }));
}
export type ChatFile = { name: string; drive?: string; media?: string };
export type ChatMessage = { id: string; at: string; fromId: string; fromName: string; text: string; thread: string; files: ChatFile[] };
export async function chatMessages(c: Connection, space: string, since: string): Promise<ChatMessage[]> {
  type M = { name: string; createTime: string; text?: string; argumentText?: string; sender?: { name?: string; displayName?: string; type?: string }; thread?: { name?: string }; deleteTime?: string; attachment?: { contentName?: string; attachmentDataRef?: { resourceName?: string }; driveDataRef?: { driveFileId?: string } }[] };
  const r = await call<{ messages?: M[] }>(c, `${CHAT}/${space}/messages?pageSize=50&filter=${encodeURIComponent(`createTime > "${new Date(since).toISOString()}"`)}`, {}, "Google Chat");
  return (r.messages ?? []).filter((m) => !m.deleteTime && m.sender?.type !== "BOT" && m.sender?.name).map((m) => ({
    id: m.name, at: m.createTime, fromId: m.sender!.name!.replace(/^users\//, ""), fromName: m.sender!.displayName ?? "",
    text: (m.argumentText ?? m.text ?? "").trim(), thread: m.thread?.name ?? "",
    files: (m.attachment ?? []).map((a) => ({ name: a.contentName ?? "file", drive: a.driveDataRef?.driveFileId, media: a.attachmentDataRef?.resourceName })).filter((a) => a.drive || a.media),
  }));
}
export async function chatPost(c: Connection, space: string, text: string, thread?: string) {
  const r = await call<{ name?: string }>(c, `${CHAT}/${space}/messages${thread ? "?messageReplyOption=REPLY_MESSAGE_FALLBACK_TO_NEW_THREAD" : ""}`, { method: "POST", body: JSON.stringify({ text, ...(thread ? { thread: { name: thread } } : {}) }) }, "Google Chat");
  return r.name ?? "";
}
/** A file posted in Google Chat: a Google Doc or Word file comes as Word, anything else as it is. */
export async function chatFile(c: Connection, f: ChatFile) {
  if (f.drive) {
    const w = await docAsWord(c, f.drive).catch(() => null);
    if (w) return w;
    return { name: f.name, data: await raw(c, `https://www.googleapis.com/drive/v3/files/${encodeURIComponent(f.drive)}?alt=media&supportsAllDrives=true`) };
  }
  return { name: f.name, data: await raw(c, `${CHAT}/media/${f.media}?alt=media`) };
}
