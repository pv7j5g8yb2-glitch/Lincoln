import { db } from "../db";
import { open, seal } from "../secret";
import { api, callback, json } from "./http";
import type { FolderHit, Connection, FileHit, Inbound, OfficeKind } from "./types";
import { OFFICE_EXT, OFFICE_MIME, keepAttachment, safeAddress, settingsOf } from "./types";
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

/** With teams, the sign in also asks for reading the firm's Lincoln channel (a Microsoft 365 admin approves it once). */
export function authUrl(state: string, _mode: "auth" | "connect" = "connect", teams = false) {
  const q = new URLSearchParams({ client_id: process.env.MICROSOFT_CLIENT_ID!, redirect_uri: callback("microsoft"), response_type: "code", response_mode: "query", scope: [...SCOPES, ...(teams ? ["ChannelMessage.Read.All"] : [])].join(" "), prompt: "select_account", state });
  return api(`${LOGIN}/authorize?${q}`);
}

type Token = { access_token: string; refresh_token?: string; expires_in?: number; id_token?: string };
async function token(body: Record<string, string>, teams = false) {
  const res = await fetch(api(`${LOGIN}/token`), { method: "POST", headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: new URLSearchParams({ client_id: process.env.MICROSOFT_CLIENT_ID!, client_secret: process.env.MICROSOFT_CLIENT_SECRET!, scope: [...SCOPES, ...(teams ? ["ChannelMessage.Read.All"] : [])].join(" "), ...body }) });
  return json<Token>(res, "Microsoft");
}

export async function exchange(code: string, teams = false) {
  const t = await token({ code, grant_type: "authorization_code", redirect_uri: callback("microsoft") }, teams);
  const me = await json<{ id?: string; mail?: string; userPrincipalName?: string; displayName?: string }>(await fetch(api(`${GRAPH}/me?$select=id,mail,userPrincipalName,displayName`), { headers: { Authorization: `Bearer ${t.access_token}` } }), "Microsoft");
  const claims = JSON.parse(Buffer.from((t.id_token ?? "..").split(".")[1] ?? "", "base64url").toString() || "{}") as { tid?: string; oid?: string };
  const upn = (me.userPrincipalName ?? "").toLowerCase();
  // The mail attribute can be set by any tenant administrator, so it never identifies an account (the
  // "nOAuth" problem). The user principal name has to be on a domain the tenant has verified.
  return { email: (me.mail ?? me.userPrincipalName ?? "").toLowerCase(), accountEmail: upn.includes("@") && !upn.includes("#ext#") ? upn : "", subject: claims.oid || me.id ? `${claims.tid ?? "consumer"}:${claims.oid ?? me.id}` : "", name: me.displayName ?? "", granted: scopesOf(t.access_token), refresh: t.refresh_token ?? "", access: t.access_token, expires: Date.now() + (t.expires_in ?? 3000) * 1000 };
}

async function access(c: Connection) {
  if (c.access_enc && c.expires_at && c.expires_at > Date.now() + 60_000) return open(c.access_enc);
  // A connection that was granted the Teams channel permission keeps it on every refresh.
  const t = await token({ refresh_token: open(c.refresh_enc), grant_type: "refresh_token" }, /ChannelMessage\.Read\.All/i.test(settingsOf(c).granted ?? ""));
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
    const a = await call<{ value?: { id: string; "@odata.type": string; name: string; contentType: string; contentBytes?: string; size?: number; isInline?: boolean }[] }>(c, `/me/messages/${encodeURIComponent(id)}/attachments`, {}, "Outlook");
    for (const x of (a.value ?? []).slice(0, 30)) {
      if (!keepAttachment(x.name ?? "", x.contentType ?? "", x.size ?? 0, x.isInline)) continue;
      if (x["@odata.type"] === "#microsoft.graph.fileAttachment" && x.contentBytes) attachments.push({ name: x.name, type: x.contentType, data: Buffer.from(x.contentBytes, "base64") });
      // An email attached to an email (forwarded as an attachment) comes as its MIME text, read like a saved email.
      else if (x["@odata.type"] === "#microsoft.graph.itemAttachment") {
        const raw = await fetch(api(`${GRAPH}/me/messages/${encodeURIComponent(id)}/attachments/${encodeURIComponent(x.id)}/$value`), { headers: { Authorization: `Bearer ${await access(c)}` } }).catch(() => null);
        if (raw?.ok) attachments.push({ name: `${x.name || "Attached email"}.eml`, type: "message/rfc822", data: Buffer.from(await raw.arrayBuffer()) });
      }
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
    const r = await call<{ value?: { hitsContainers?: { hits?: { resource: Item }[] }[] }[] }>(c, "/search/query", { method: "POST", body: JSON.stringify({ requests: [{ entityTypes: ["driveItem"], query: { queryString: `${q ? `${q} ` : ""}(filetype:pdf OR filetype:jpg OR filetype:jpeg OR filetype:png OR filetype:heic OR filetype:tif OR filetype:tiff OR filetype:docx OR filetype:doc OR filetype:xlsx OR filetype:csv OR filetype:txt OR filetype:rtf OR filetype:msg OR filetype:eml OR filetype:zip OR filetype:pptx OR filetype:ppt OR filetype:xls OR filetype:odt OR filetype:wpd OR filetype:pages)` }, from: 0, size: 25 }] }) }, "Microsoft Search");
    const hits = r.value?.[0]?.hitsContainers?.[0]?.hits ?? [];
    return hits.map(({ resource: f }) => ({ id: `${f.parentReference?.driveId ?? "me"}::${f.id}`, name: f.name, modified: f.lastModifiedDateTime ?? null, where: /sharepoint\.com\/sites\//i.test(f.webUrl ?? "") ? "SharePoint" : "OneDrive" }));
  } catch {
    // Personal Microsoft accounts have no Search API; fall back to OneDrive search.
    const r = await call<{ value?: Item[] }>(c, `/me/drive/root/search(q='${encodeURIComponent((q || "pdf").replace(/'/g, ""))}')?$top=25`, {}, "OneDrive");
    return (r.value ?? []).filter((f) => /\.(pdf|jpe?g|png|heic|webp|gif|bmp|tiff?|docx?|xlsx?|pptx?|od[tsp]|pages|key|numbers|wpd?|csv|txt|rtf|html?|msg|eml|zip)$/i.test(f.name)).map((f) => ({ id: `me::${f.id}`, name: f.name, modified: f.lastModifiedDateTime ?? null, where: "OneDrive" }));
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
  const r = await call<{ id?: string }>(c, `/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(channelId)}/messages`, { method: "POST", body: JSON.stringify({ body: { contentType: "html", content: html } }) }, "Teams");
  return r?.id ?? "";
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

// Drafts in the lawyer's own Outlook, kept in step with Lincoln (see google.ts for the same on Gmail).

const isMissing = (e: unknown) => /replied 404/.test(e instanceof Error ? e.message : "");
const draftBody = (m: { to: string; subject: string; body: string }) => ({ subject: m.subject.replace(/[\r\n]+/g, " ").slice(0, 300), body: { contentType: "Text", content: m.body }, toRecipients: [{ emailAddress: { address: safeAddress(m.to) } }] });

/** A new draft, or a reply in the thread when the email it answers is known. */
export async function createDraft(c: Connection, m: { to: string; subject: string; body: string; replyTo?: string | null }) {
  if (m.replyTo) {
    try {
      const r = await call<{ id: string }>(c, `/me/messages/${encodeURIComponent(m.replyTo)}/createReply`, { method: "POST", body: "{}" }, "Outlook");
      await call(c, `/me/messages/${encodeURIComponent(r.id)}`, { method: "PATCH", body: JSON.stringify(draftBody(m)) }, "Outlook");
      return r.id;
    } catch { /* the original is gone: a new draft instead */ }
  }
  const r = await call<{ id: string }>(c, "/me/messages", { method: "POST", body: JSON.stringify(draftBody(m)) }, "Outlook");
  return r.id;
}
export async function updateDraft(c: Connection, id: string, m: { to: string; subject: string; body: string }) {
  await call(c, `/me/messages/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(draftBody(m)) }, "Outlook");
}
export async function sendDraft(c: Connection, id: string) {
  await call(c, `/me/messages/${encodeURIComponent(id)}/send`, { method: "POST" }, "Outlook");
}
export async function deleteDraft(c: Connection, id: string) {
  try { await call(c, `/me/messages/${encodeURIComponent(id)}`, { method: "DELETE" }, "Outlook"); } catch (e) { if (!isMissing(e)) throw e; }
}
export async function readDraft(c: Connection, id: string, m: { to: string; subject: string; since: string }): Promise<{ state: "open"; subject: string; body: string } | { state: "sent" | "gone" }> {
  try {
    const d = await call<{ isDraft?: boolean; subject?: string; body?: { content?: string } }>(c, `/me/messages/${encodeURIComponent(id)}?$select=isDraft,subject,body`, { headers: { Prefer: 'outlook.body-content-type="text"' } }, "Outlook");
    if (d.isDraft !== false) return { state: "open", subject: d.subject ?? "", body: d.body?.content ?? "" };
    return { state: "sent" };
  } catch (e) {
    if (!isMissing(e)) throw e;
  }
  // A sent draft moves to Sent Items under a new id.
  const r = await call<{ value?: { subject?: string; toRecipients?: { emailAddress?: { address?: string } }[] }[] }>(c, `/me/mailFolders/sentitems/messages?$top=25&$select=subject,toRecipients&$filter=${encodeURIComponent(`sentDateTime ge ${new Date(m.since).toISOString()}`)}`, {}, "Outlook");
  const to = m.to.toLowerCase();
  return (r.value ?? []).some((x) => (x.toRecipients ?? []).some((t) => t.emailAddress?.address?.toLowerCase() === to)) ? { state: "sent" } : { state: "gone" };
}

/** Message ids from the lawyer's mail matching an Outlook search, newest first. */
export async function searchMail(c: Connection, q: string, max = 20) {
  const r = await call<{ value?: { id: string }[] }>(c, `/me/messages?$search=${encodeURIComponent(`"${q.replace(/"/g, "")}"`)}&$top=${max}&$select=id`, {}, "Outlook");
  return (r.value ?? []).map((m) => m.id);
}

const seg = (s: string) => encodeURIComponent(s.replace(/[\\/:*?"<>|#%]/g, "").trim().slice(0, 120) || "File");

/** Saves a file into OneDrive, Lincoln/<path...>, replacing an earlier version. Returns the file's and folder's links. */
export async function saveFile(c: Connection, path: string[], name: string, mime: string, data: Buffer) {
  const p = ["Lincoln", ...path, name].map(seg).join("/");
  const r = await call<{ webUrl: string; parentReference?: { id?: string; driveId?: string } }>(c, `/me/drive/root:/${p}:/content?@microsoft.graph.conflictBehavior=replace`, { method: "PUT", headers: { "Content-Type": mime }, body: new Uint8Array(data) }, "OneDrive");
  let folderUrl = r.webUrl.replace(/\/[^/]*$/, "");
  try { if (r.parentReference?.id) folderUrl = (await call<{ webUrl: string }>(c, `/me/drive/items/${encodeURIComponent(r.parentReference.id)}?$select=webUrl`, {}, "OneDrive")).webUrl; } catch { /* the file link is enough */ }
  return { link: r.webUrl, folder: folderUrl };
}

/** Saves a file into a given OneDrive folder; a file of the same name gets a new version, so OneDrive keeps its history. */
export async function saveInto(c: Connection, folderId: string, name: string, mime: string, data: Buffer) {
  const r = await call<{ webUrl: string }>(c, `/me/drive/items/${encodeURIComponent(folderId)}:/${seg(name)}:/content?@microsoft.graph.conflictBehavior=replace`, { method: "PUT", headers: { "Content-Type": mime }, body: new Uint8Array(data) }, "OneDrive");
  let folderUrl = r.webUrl.replace(/\/[^/]*$/, "");
  try { folderUrl = (await call<{ webUrl: string }>(c, `/me/drive/items/${encodeURIComponent(folderId)}?$select=webUrl`, {}, "OneDrive")).webUrl; } catch { /* the file link is enough */ }
  return { link: r.webUrl, folder: folderUrl };
}

/** Folders in the firm's OneDrive whose name contains a word, leaving out the ones Lincoln made for itself. */
export async function findFolders(c: Connection, word: string): Promise<FolderHit[]> {
  const r = await call<{ value?: { id: string; name: string; webUrl: string; folder?: object; parentReference?: { id?: string; path?: string } }[] }>(c, `/me/drive/root/search(q='${encodeURIComponent(word.replace(/'/g, ""))}')?$select=id,name,webUrl,folder,parentReference&$top=50`, {}, "OneDrive");
  return (r.value ?? []).filter((x) => x.folder && !/\/root:\/Lincoln(\/|$)/i.test(x.parentReference?.path ?? "")).map((x) => ({ id: x.id, name: x.name, parent: x.parentReference?.id ?? null, url: x.webUrl }));
}

/** A folder of this name inside a parent, made if it is not there. */
export async function makeFolder(c: Connection, parent: string, name: string) {
  try {
    const r = await call<{ id: string; webUrl: string }>(c, `/me/drive/items/${encodeURIComponent(parent)}/children`, { method: "POST", body: JSON.stringify({ name: decodeURIComponent(seg(name)), folder: {}, "@microsoft.graph.conflictBehavior": "fail" }) }, "OneDrive");
    return { id: r.id, url: r.webUrl };
  } catch {
    const r = await call<{ id: string; webUrl: string }>(c, `/me/drive/items/${encodeURIComponent(parent)}:/${seg(name)}`, {}, "OneDrive");
    return { id: r.id, url: r.webUrl };
  }
}

// Requests posted in the firm's Lincoln channel in Teams. Reading channel messages needs ChannelMessage.Read.All,
// which a Microsoft 365 admin grants once; until then Lincoln only posts to the channel.

export const TEAMS_READ = "ChannelMessage.Read.All";
export type ChannelMessage = { id: string; at: string; fromId: string; fromName: string; text: string; files: { name: string; url: string }[] };
export async function channelMessages(c: Connection, teamId: string, channelId: string): Promise<ChannelMessage[]> {
  type M = { id: string; createdDateTime: string; messageType?: string; deletedDateTime?: string | null; from?: { user?: { id?: string; displayName?: string } }; body?: { content?: string }; attachments?: { contentType?: string; contentUrl?: string; name?: string }[] };
  const r = await call<{ value?: M[] }>(c, `/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(channelId)}/messages?$top=20`, {}, "Teams");
  return (r.value ?? []).filter((m) => (m.messageType ?? "message") === "message" && !m.deletedDateTime && m.from?.user).map((m) => ({
    id: m.id, at: m.createdDateTime, fromId: m.from!.user!.id ?? "", fromName: m.from!.user!.displayName ?? "",
    text: (m.body?.content ?? "").replace(/<at[^>]*>([^<]*)<\/at>/g, "$1").replace(/<br\s*\/?>|<\/p>/gi, "\n").replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").trim(),
    files: (m.attachments ?? []).filter((a) => a.contentType === "reference" && a.contentUrl).map((a) => ({ name: a.name ?? "file", url: a.contentUrl! })),
  }));
}
export async function replyInChannel(c: Connection, teamId: string, channelId: string, messageId: string, html: string) {
  const r = await call<{ id: string }>(c, `/teams/${encodeURIComponent(teamId)}/channels/${encodeURIComponent(channelId)}/messages/${encodeURIComponent(messageId)}/replies`, { method: "POST", body: JSON.stringify({ body: { contentType: "html", content: html } }) }, "Teams");
  return r.id;
}
/** A file shared in Teams (it lives in SharePoint), by its link. */
export async function downloadShared(c: Connection, url: string) {
  const res = await fetch(api(`${GRAPH}/shares/u!${Buffer.from(url).toString("base64url")}/driveItem/content`), { headers: { Authorization: `Bearer ${await access(c)}` } });
  if (!res.ok) throw new Error(`SharePoint replied ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}
