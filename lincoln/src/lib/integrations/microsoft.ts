import { db } from "../db";
import { open, seal } from "../secret";
import { api, callback, json } from "./http";
import type { Connection, FileHit, Inbound, OfficeKind } from "./types";
import { OFFICE_EXT, OFFICE_MIME, safeAddress, settingsOf } from "./types";
import { sign } from "../secret";
import { appUrl } from "./http";

// One Microsoft sign in covers Outlook mail and calendar, OneDrive, SharePoint, Word, Excel,
// PowerPoint and Teams, all through Microsoft Graph. Word, Excel and PowerPoint files are saved to
// OneDrive and open in Office for the web or the desktop apps.

export const SCOPES = [
  "offline_access", "openid", "email", "User.Read",
  "Mail.ReadWrite", "Mail.Send", "Calendars.ReadWrite",
  "Files.ReadWrite.All", "Sites.Read.All",
  "Team.ReadBasic.All", "Channel.ReadBasic.All", "ChannelMessage.Send",
];
export const configured = () => Boolean(process.env.MICROSOFT_CLIENT_ID && process.env.MICROSOFT_CLIENT_SECRET && process.env.APP_URL);
const LOGIN = "https://login.microsoftonline.com/common/oauth2/v2.0";
const GRAPH = "https://graph.microsoft.com/v1.0";

export function authUrl(state: string, _mode: "auth" | "connect" = "connect") {
  const q = new URLSearchParams({ client_id: process.env.MICROSOFT_CLIENT_ID!, redirect_uri: callback("microsoft"), response_type: "code", response_mode: "query", scope: SCOPES.join(" "), prompt: "select_account", state });
  return api(`${LOGIN}/authorize?${q}`);
}

type Token = { access_token: string; refresh_token?: string; expires_in?: number; id_token?: string };
async function token(body: Record<string, string>) {
  const res = await fetch(api(`${LOGIN}/token`), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.MICROSOFT_CLIENT_ID!, client_secret: process.env.MICROSOFT_CLIENT_SECRET!, scope: SCOPES.join(" "), ...body }) });
  return json<Token>(res, "Microsoft");
}

export async function exchange(code: string) {
  const t = await token({ code, grant_type: "authorization_code", redirect_uri: callback("microsoft") });
  const me = await json<{ id?: string; mail?: string; userPrincipalName?: string; displayName?: string }>(await fetch(api(`${GRAPH}/me?$select=id,mail,userPrincipalName,displayName`), { headers: { Authorization: `Bearer ${t.access_token}` } }), "Microsoft");
  const claims = JSON.parse(Buffer.from((t.id_token ?? "..").split(".")[1] ?? "", "base64url").toString() || "{}") as { tid?: string; oid?: string };
  const upn = (me.userPrincipalName ?? "").toLowerCase();
  // The mail attribute can be set by any tenant administrator, so it never identifies an account (the
  // "nOAuth" problem). The user principal name has to be on a domain the tenant has verified.
  return { email: (me.mail ?? me.userPrincipalName ?? "").toLowerCase(), accountEmail: upn.includes("@") && !upn.includes("#ext#") ? upn : "", subject: claims.oid || me.id ? `${claims.tid ?? "consumer"}:${claims.oid ?? me.id}` : "", name: me.displayName ?? "", granted: scopesOf(t.access_token), refresh: t.refresh_token ?? "", access: t.access_token, expires: Date.now() + (t.expires_in ?? 3000) * 1000 };
}

async function access(c: Connection) {
  if (c.access_enc && c.expires_at && c.expires_at > Date.now() + 60_000) return open(c.access_enc);
  const t = await token({ refresh_token: open(c.refresh_enc), grant_type: "refresh_token" });
  // Microsoft may rotate the refresh token; keep the newest one.
  db().prepare("UPDATE mailboxes SET access_enc = ?, expires_at = ?, refresh_enc = COALESCE(?, refresh_enc) WHERE id = ?").run(seal(t.access_token), Date.now() + (t.expires_in ?? 3000) * 1000, t.refresh_token ? seal(t.refresh_token) : null, c.id);
  return t.access_token;
}

async function call<T>(c: Connection, path: string, init: RequestInit = {}, what = "Microsoft"): Promise<T> {
  const res = await fetch(api(path.startsWith("http") ? path : `${GRAPH}${path}`), { ...init, headers: { Authorization: `Bearer ${await access(c)}`, ...(typeof init.body === "string" ? { "Content-Type": "application/json" } : {}), ...(init.headers ?? {}) } });
  if (res.status === 202 || res.status === 204) return {} as T;
  return json<T>(res, what);
}

// Outlook mail

type Msg = { id: string; conversationId: string; subject: string; from?: { emailAddress?: { address?: string; name?: string } }; body?: { content?: string }; hasAttachments?: boolean; internetMessageHeaders?: { name: string; value: string }[] };
export async function listInbox(c: Connection) {
  const since = new Date(Date.now() - 3 * 86400000).toISOString();
  const r = await call<{ value?: { id: string; from?: Msg["from"] }[] }>(c, `/me/mailFolders/inbox/messages?$top=25&$orderby=receivedDateTime desc&$filter=${encodeURIComponent(`receivedDateTime ge ${since}`)}&$select=id,from`, {}, "Outlook");
  return (r.value ?? []).filter((m) => (m.from?.emailAddress?.address ?? "").toLowerCase() !== c.email).map((m) => m.id);
}

export async function readMessage(c: Connection, id: string): Promise<Inbound> {
  const m = await call<Msg>(c, `/me/messages/${encodeURIComponent(id)}?$select=id,conversationId,subject,from,body,hasAttachments,internetMessageHeaders`, { headers: { Prefer: 'outlook.body-content-type="text"' } }, "Outlook");
  const attachments: Inbound["attachments"] = [];
  if (m.hasAttachments) {
    const a = await call<{ value?: { "@odata.type": string; name: string; contentType: string; contentBytes?: string; size?: number; isInline?: boolean }[] }>(c, `/me/messages/${encodeURIComponent(id)}/attachments`, {}, "Outlook");
    for (const x of a.value ?? []) {
      const ok = /pdf/i.test(x.contentType + x.name) || (/^image\/(jpeg|png|webp|heic|heif)$/i.test(x.contentType) && !x.isInline && (x.size ?? 0) > 60_000);
      if (x["@odata.type"] === "#microsoft.graph.fileAttachment" && ok && x.contentBytes && (x.size ?? 0) < 25 * 1024 * 1024) attachments.push({ name: x.name, type: x.contentType, data: Buffer.from(x.contentBytes, "base64") });
    }
  }
  const from = (m.from?.emailAddress?.address ?? "").toLowerCase();
  // Mail from outside the organisation carries Authentication-Results; mail inside it does not.
  const authn = (m.internetMessageHeaders ?? []).filter((h) => h.name.toLowerCase() === "authentication-results").map((h) => h.value).join(" ");
  const sameOrg = from.split("@")[1] === c.email.split("@")[1];
  const header = (n: string) => (m.internetMessageHeaders ?? []).find((h) => h.name.toLowerCase() === n)?.value ?? "";
  const bulk = Boolean(header("list-unsubscribe")) || /bulk|list|junk/i.test(header("precedence"));
  return { bulk, verified: authn ? /dmarc=pass/i.test(authn) : sameOrg, id, threadId: m.conversationId, from, fromName: m.from?.emailAddress?.name || from, subject: m.subject ?? "", text: (m.body?.content ?? "").slice(0, 20000), attachments };
}

export async function send(c: Connection, to: string, subject: string, body: string) {
  to = safeAddress(to);
  subject = subject.replace(/[\r\n]+/g, " ").slice(0, 300);
  await call(c, "/me/sendMail", { method: "POST", body: JSON.stringify({ message: { subject, body: { contentType: "Text", content: body }, toRecipients: [{ emailAddress: { address: to } }] }, saveToSentItems: true }) }, "Outlook");
}

// Outlook calendar

export async function addEvent(c: Connection, e: { title: string; date: string; details: string }) {
  const end = new Date(`${e.date}T12:00:00Z`);
  end.setUTCDate(end.getUTCDate() + 1);
  const r = await call<{ id: string }>(c, "/me/events", { method: "POST", body: JSON.stringify({ subject: e.title, body: { contentType: "Text", content: e.details }, isAllDay: true, start: { dateTime: `${e.date}T00:00:00`, timeZone: "UTC" }, end: { dateTime: `${end.toISOString().slice(0, 10)}T00:00:00`, timeZone: "UTC" }, isReminderOn: true, reminderMinutesBeforeStart: 1440 }) }, "Outlook Calendar");
  return r.id;
}

// OneDrive and SharePoint

export async function searchFiles(c: Connection, q: string): Promise<FileHit[]> {
  type Item = { id: string; name: string; lastModifiedDateTime?: string; parentReference?: { driveId?: string }; webUrl?: string };
  try {
    const r = await call<{ value?: { hitsContainers?: { hits?: { resource: Item }[] }[] }[] }>(c, "/search/query", { method: "POST", body: JSON.stringify({ requests: [{ entityTypes: ["driveItem"], query: { queryString: `${q ? `${q} ` : ""}(filetype:pdf OR filetype:jpg OR filetype:jpeg OR filetype:png OR filetype:heic)` }, from: 0, size: 25 }] }) }, "Microsoft Search");
    const hits = r.value?.[0]?.hitsContainers?.[0]?.hits ?? [];
    return hits.map(({ resource: f }) => ({ id: `${f.parentReference?.driveId ?? "me"}::${f.id}`, name: f.name, modified: f.lastModifiedDateTime ?? null, where: /sharepoint\.com\/sites\//i.test(f.webUrl ?? "") ? "SharePoint" : "OneDrive" }));
  } catch {
    // Personal Microsoft accounts have no Search API; fall back to OneDrive search.
    const r = await call<{ value?: Item[] }>(c, `/me/drive/root/search(q='${encodeURIComponent((q || "pdf").replace(/'/g, ""))}')?$top=25`, {}, "OneDrive");
    return (r.value ?? []).filter((f) => /\.(pdf|jpe?g|png|heic|webp)$/i.test(f.name)).map((f) => ({ id: `me::${f.id}`, name: f.name, modified: f.lastModifiedDateTime ?? null, where: "OneDrive" }));
  }
}

export async function download(c: Connection, id: string) {
  const [drive, item] = id.split("::");
  const path = drive === "me" ? `/me/drive/items/${encodeURIComponent(item)}/content` : `/drives/${encodeURIComponent(drive)}/items/${encodeURIComponent(item)}/content`;
  const res = await fetch(api(`${GRAPH}${path}`), { headers: { Authorization: `Bearer ${await access(c)}` } });
  if (!res.ok) throw new Error(`OneDrive replied ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/** Saves a Word, Excel or PowerPoint file to OneDrive, folder Lincoln. Returns the Office link. */
export async function upload(c: Connection, name: string, kind: OfficeKind, data: Buffer) {
  const file = `${name.replace(/[\\/:*?"<>|#%]/g, "").slice(0, 120)}.${OFFICE_EXT[kind]}`;
  const r = await call<{ webUrl: string }>(c, `/me/drive/root:/Lincoln/${encodeURIComponent(file)}:/content?@microsoft.graph.conflictBehavior=rename`, { method: "PUT", headers: { "Content-Type": OFFICE_MIME[kind] }, body: new Uint8Array(data) }, "OneDrive");
  return r.webUrl;
}

// Teams

export async function channels(c: Connection) {
  const teams = await call<{ value?: { id: string; displayName: string }[] }>(c, "/me/joinedTeams?$select=id,displayName", {}, "Teams");
  const out: { teamId: string; channelId: string; name: string }[] = [];
  for (const t of (teams.value ?? []).slice(0, 20)) {
    const ch = await call<{ value?: { id: string; displayName: string }[] }>(c, `/teams/${encodeURIComponent(t.id)}/channels?$select=id,displayName`, {}, "Teams");
    for (const x of ch.value ?? []) out.push({ teamId: t.id, channelId: x.id, name: `${t.displayName} / ${x.displayName}` });
  }
  return out;
}

export async function post(c: Connection, teamId: string, channelId: string, html: string) {
  await call(c, `/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(channelId)}/messages`, { method: "POST", body: JSON.stringify({ body: { contentType: "html", content: html } }) }, "Teams");
}

// Instant delivery: a Graph subscription calls Lincoln when mail lands in the inbox. Mail
// subscriptions last at most a few days; Lincoln renews when less than a day is left.
export const clientState = (c: Connection) => sign(`graph:${c.id}`).slice(0, 64);
export async function subscribe(c: Connection) {
  const s = settingsOf(c);
  if (s.subId && s.subUntil && s.subUntil > Date.now() + 24 * 3600_000) return;
  const until = new Date(Date.now() + 2.5 * 24 * 3600_000).toISOString();
  if (s.subId) {
    try {
      await call(c, `/subscriptions/${encodeURIComponent(s.subId)}`, { method: "PATCH", body: JSON.stringify({ expirationDateTime: until }) }, "Microsoft");
      db().prepare("UPDATE mailboxes SET settings = ? WHERE id = ?").run(JSON.stringify({ ...s, subUntil: Date.parse(until) }), c.id);
      return;
    } catch { /* expired or removed: create a new one */ }
  }
  const r = await call<{ id: string; expirationDateTime: string }>(c, "/subscriptions", { method: "POST", body: JSON.stringify({ changeType: "created", notificationUrl: `${appUrl()}/api/push/microsoft`, resource: "me/mailFolders('Inbox')/messages", expirationDateTime: until, clientState: clientState(c) }) }, "Microsoft");
  db().prepare("UPDATE mailboxes SET settings = ? WHERE id = ?").run(JSON.stringify({ ...s, subId: r.id, subUntil: Date.parse(r.expirationDateTime) }), c.id);
}

/** Graph access tokens list the granted delegated permissions in their scp claim. */
function scopesOf(accessToken: string) {
  try { return String(JSON.parse(Buffer.from(accessToken.split(".")[1] ?? "", "base64url").toString()).scp ?? ""); } catch { return ""; }
}

export type Health = { service: string; ok: boolean; note?: string }[];

export async function health(c: Connection): Promise<Health> {
  const granted = settingsOf(c).granted ?? "";
  const has = (s: string) => !granted || granted.split(/\s+/).some((x) => x.toLowerCase() === s.toLowerCase());
  const probe = async (service: string, path: string, scope: string, personal?: string) => {
    if (!has(scope)) return { service, ok: false, note: "Permission not granted" };
    try { await call(c, path); return { service, ok: true }; } catch (e) {
      const msg = e instanceof Error ? e.message : "Failed";
      return { service, ok: false, note: personal && / 40[0134]/.test(msg) ? personal : msg };
    }
  };
  const out: Health = [
    await probe("Outlook", "/me/mailFolders/inbox?$select=id", "Mail.ReadWrite"),
    { service: "Sending", ok: has("Mail.Send"), note: has("Mail.Send") ? undefined : "Permission not granted" },
    await probe("Calendar", "/me/events?$top=1&$select=id", "Calendars.ReadWrite"),
    await probe("OneDrive, Word, Excel, PowerPoint", "/me/drive?$select=id", "Files.ReadWrite.All"),
    await probe("SharePoint", "/sites?search=*&$top=1&$select=id", "Sites.Read.All", "Work accounts only"),
    await probe("Teams", "/me/joinedTeams?$select=id", "Team.ReadBasic.All", "Work accounts only"),
  ];
  const s = settingsOf(c);
  out.push({ service: "Instant mail", ok: Boolean(s.subId && s.subUntil && s.subUntil > Date.now()), note: s.subId ? undefined : "Not set up yet; mail is checked every 5 minutes" });
  return out;
}
