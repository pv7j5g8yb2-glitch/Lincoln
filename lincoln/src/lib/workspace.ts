import { db, uid } from "./db";
import { connectionsOf, findFolders, makeFolder, saveFile, saveInto, settingsOf, type Connection, type FolderHit } from "./integrations";

// Lincoln's work in the firm's own files. Everything approved (letters, translations, the filing packet, marked up
// documents) is saved into the client's folder in the Google Drive or OneDrive of the case's attorney (or, failing
// that, of an admin), so the firm always has it where it keeps its files.
//
// Which folder: the firm's own folder for that client when Lincoln finds exactly one ("Marquez, Sofia" and the
// like); a new folder next to the firm's other client folders, named the same way, when the firm keeps client
// folders but has none for this client yet; Lincoln/Clients/<client> when the firm keeps none Lincoln can see.
// When two or more folders could be the client's, Lincoln asks once in Review and remembers the answer. A file
// saved again gets a new version of the same file, so the drive's own version history shows every change.

const MIME = { docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", pdf: "application/pdf", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } as const;

/** The connection whose files Lincoln writes to for a case: the attorney's, then an admin's, then anyone's. */
export function driveFor(firmId: string, caseId: string): Connection | undefined {
  const d = db();
  const c = d.prepare("SELECT attorney_id FROM cases WHERE firm_id = ? AND id = ?").get(firmId, caseId) as { attorney_id: string } | undefined;
  const all = connectionsOf(firmId).filter((x) => x.provider === "microsoft" || /auth\/drive(\.file)?( |$)/.test(settingsOf(x).granted ?? "") || !settingsOf(x).granted);
  const admins = new Set((d.prepare("SELECT id FROM users WHERE firm_id = ? AND admin = 1").all(firmId) as { id: string }[]).map((x) => x.id));
  return all.find((x) => x.user_id === c?.attorney_id) ?? all.find((x) => admins.has(x.user_id)) ?? all[0];
}

const folderName = (client: string, type: string) => `${client.replace(/[\\/:*?"<>|#%']/g, "").trim().slice(0, 80) || "Client"} (${type.replace(/[\\/:*?"<>|#%']/g, "").slice(0, 30)})`;

const plain = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const words = (s: string) => plain(s).split(/[^a-z0-9]+/).filter((w) => w.length > 1);
/** The client's first and last names as words, e.g. "Lucia Okafor-Reyes" gives lucia and okafor, reyes. */
function nameOf(client: string) {
  const parts = client.trim().split(/\s+/);
  return { first: words(parts[0] ?? ""), last: words(parts.length > 1 ? parts[parts.length - 1] : ""), lastRaw: parts.length > 1 ? parts[parts.length - 1] : "" };
}
/** True when a folder's name holds the client's first and last names, in any order and with any punctuation. */
export function isClientFolder(folderName: string, client: string) {
  const n = nameOf(client);
  if (!n.first.length || !n.last.length) return false;
  const have = new Set(words(folderName));
  return [...n.first, ...n.last].every((w) => have.has(w));
}
type Style = { lastFirst: boolean; comma: boolean; type: boolean };
/** How the firm names its client folders, read from one it already has. */
export function styleOf(folderName: string, client: string): Style {
  const n = nameOf(client);
  const f = plain(folderName).trim();
  const last = plain(n.lastRaw);
  return { lastFirst: f.startsWith(last), comma: f.startsWith(`${last},`), type: /\(.+\)\s*$/.test(folderName) };
}
/** A new client folder named the firm's way. */
export function nameInStyle(st: Style, client: string, type: string) {
  const parts = client.trim().split(/\s+/);
  const last = parts.length > 1 ? parts[parts.length - 1] : "";
  const rest = parts.slice(0, -1).join(" ");
  const base = st.lastFirst && last ? `${last}${st.comma ? "," : ""} ${rest}` : client.trim();
  return `${base}${st.type ? ` (${type})` : ""}`.replace(/[\\/:*?"<>|#%']/g, "").trim().slice(0, 100);
}

const kvGet = <T,>(firmId: string, key: string): T | null => {
  const v = (db().prepare("SELECT value FROM kv WHERE firm_id = ? AND key = ?").get(firmId, key) as { value: string } | undefined)?.value;
  try { return v ? (JSON.parse(v) as T) : null; } catch { return null; }
};
const kvSet = (firmId: string, key: string, v: unknown) => db().prepare("INSERT INTO kv (firm_id, key, value) VALUES (?, ?, ?) ON CONFLICT(firm_id, key) DO UPDATE SET value = excluded.value").run(firmId, key, JSON.stringify(v));

type Choice = { conn: string; id?: string; url?: string; lincoln?: boolean; asked?: boolean };

/** Where a case's files go: the firm's own client folder, or Lincoln's (null). */
async function clientFolder(conn: Connection, firmId: string, caseId: string, c: { client: string; type_code: string }): Promise<{ id: string; url: string } | null> {
  const got = kvGet<Choice>(firmId, `cfolder:${caseId}`);
  if (got && got.conn === conn.id) return got.id && got.url ? { id: got.id, url: got.url } : null;
  const n = nameOf(c.client);
  const word = n.lastRaw.split(/[^\p{L}\p{N}]+/u).filter(Boolean).sort((a, b) => b.length - a.length)[0];
  if (!word) return null;
  let hits: FolderHit[] = [];
  try { hits = (await findFolders(conn, word)).filter((f) => isClientFolder(f.name, c.client)); } catch { return null; }
  hits = hits.filter((h, i) => hits.findIndex((x) => x.id === h.id) === i);
  if (hits.length === 1) {
    const h = hits[0];
    kvSet(firmId, `cfolder:${caseId}`, { conn: conn.id, id: h.id, url: h.url } satisfies Choice);
    if (h.parent) kvSet(firmId, `clientsroot:${conn.id}`, { parent: h.parent, style: styleOf(h.name, c.client) });
    return { id: h.id, url: h.url };
  }
  if (hits.length > 1) {
    askWhichFolder(firmId, caseId, conn, c.client, hits);
    return null;
  }
  const root = kvGet<{ parent: string; style: Style }>(firmId, `clientsroot:${conn.id}`);
  if (!root) return null;
  try {
    const made = await makeFolder(conn, root.parent, nameInStyle(root.style, c.client, c.type_code));
    kvSet(firmId, `cfolder:${caseId}`, { conn: conn.id, id: made.id, url: made.url } satisfies Choice);
    return made;
  } catch { return null; }
}

/** Two or more folders could be this client's: one question in Review, asked once per case. */
function askWhichFolder(firmId: string, caseId: string, conn: Connection, client: string, hits: FolderHit[]) {
  const d = db();
  kvSet(firmId, `cfolder:${caseId}`, { conn: conn.id, asked: true } satisfies Choice);
  const who = d.prepare("SELECT attorney_id FROM cases WHERE firm_id = ? AND id = ?").get(firmId, caseId) as { attorney_id: string } | undefined;
  d.prepare("INSERT INTO approvals (id, firm_id, case_id, kind, title, brief, payload, status, assignee_id, created_at) VALUES (?, ?, ?, 'folder', ?, ?, ?, 'pending', ?, ?)").run(
    uid(), firmId, caseId, `Client folder: ${client}`.slice(0, 160), `${hits.length} folders in ${conn.provider === "google" ? "Google Drive" : "OneDrive"} match this client.`,
    JSON.stringify({ conn: conn.id, options: hits.slice(0, 6).map((h) => ({ id: h.id, name: h.name, url: h.url })) }), who?.attorney_id ?? null, new Date().toISOString());
}

/** The answer to the folder question: one of the folders found, or Lincoln's own (index -1). */
export function setClientFolder(firmId: string, caseId: string, connId: string, pick: { id: string; url: string } | null) {
  kvSet(firmId, `cfolder:${caseId}`, pick ? { conn: connId, id: pick.id, url: pick.url } : { conn: connId, lincoln: true });
}

/** Saves into the client's folder, falling back to Lincoln's folder if the firm's cannot be written to. */
async function put(conn: Connection, firmId: string, caseId: string, c: { client: string; type_code: string }, file: string, mime: string, data: Buffer, as?: string) {
  const target = await clientFolder(conn, firmId, caseId, c);
  if (target) {
    try { return await saveInto(conn, target.id, file, mime, data, as); } catch (e) {
      console.error("Saving to the client's own folder failed:", e instanceof Error ? e.message : "error");
      kvSet(firmId, `cfolder:${caseId}`, { conn: conn.id, lincoln: true } satisfies Choice);
    }
  }
  return saveFile(conn, ["Clients", folderName(c.client, c.type_code)], file, mime, data, as);
}

/** Saves one file into the client's folder. Quietly does nothing when no account is connected. */
export async function saveToFolder(firmId: string, caseId: string, name: string, kind: keyof typeof MIME, data: Buffer | Uint8Array) {
  const conn = driveFor(firmId, caseId);
  if (!conn) return null;
  const d = db();
  const c = d.prepare("SELECT client, type_code FROM cases WHERE firm_id = ? AND id = ?").get(firmId, caseId) as { client: string; type_code: string } | undefined;
  if (!c) return null;
  const file = `${name.replace(/[\\/:*?"<>|#%']/g, "").trim().slice(0, 120) || "Document"}.${kind}`;
  try {
    const r = await put(conn, firmId, caseId, c, file, MIME[kind], Buffer.from(data));
    d.prepare("INSERT INTO kv (firm_id, key, value) VALUES (?, ?, ?) ON CONFLICT(firm_id, key) DO UPDATE SET value = excluded.value").run(firmId, `folder:${caseId}`, JSON.stringify({ url: r.folder, where: conn.provider === "google" ? "Google Drive" : "OneDrive" }));
    d.prepare("INSERT INTO activity (id, firm_id, case_id, at, actor, kind, text, minutes) VALUES (?, ?, ?, ?, 'Lincoln', 'file', ?, 1)").run(uid(), firmId, caseId, new Date().toISOString(), `Saved ${file} to the client's folder in ${conn.provider === "google" ? "Google Drive" : "OneDrive"}.`);
    return r;
  } catch (e) {
    console.error("Saving to the firm's folder failed:", e instanceof Error ? e.message : "error");
    return null;
  }
}

/** The client's folder, once Lincoln has saved something there. */
export function folderOf(firmId: string, caseId: string) {
  const v = (db().prepare("SELECT value FROM kv WHERE firm_id = ? AND key = ?").get(firmId, `folder:${caseId}`) as { value: string } | undefined)?.value;
  try { return v ? (JSON.parse(v) as { url: string; where: string }) : null; } catch { return null; }
}

/** After an approval: the approved work goes into the client's folder. */
/** After the folder question is answered: the case's approved work goes into the chosen folder. */
export async function resaveApproved(firmId: string, caseId: string) {
  const rows = db().prepare("SELECT kind, payload FROM approvals WHERE firm_id = ? AND case_id = ? AND status = 'approved' AND kind IN ('draft_review', 'translation', 'packet', 'redline') ORDER BY decided_at DESC LIMIT 10").all(firmId, caseId) as { kind: string; payload: string }[];
  for (const r of rows) { try { await saveApproved(firmId, caseId, r.kind, JSON.parse(r.payload)); } catch { /* one file failing does not stop the rest */ } }
}

export async function saveApproved(firmId: string, caseId: string, kind: string, payload: { draftId?: string; fileId?: string; docUrl?: string }) {
  if ((kind === "draft_review" || kind === "translation") && payload.draftId) {
    const dr = db().prepare("SELECT title, content FROM drafts WHERE firm_id = ? AND id = ?").get(firmId, payload.draftId) as { title: string; content: string } | undefined;
    if (!dr) return;
    const { draftDocx } = await import("./office");
    await saveToFolder(firmId, caseId, dr.title, "docx", await draftDocx(dr));
  } else if (kind === "packet") {
    const { buildPacket } = await import("./packet");
    await saveToFolder(firmId, caseId, "Filing packet", "pdf", await buildPacket(firmId, caseId));
  } else if (kind === "redline" && payload.fileId && !payload.docUrl) {
    const { redlineFile } = await import("./redline");
    const f = redlineFile(firmId, payload.fileId);
    if (f) await saveToFolder(firmId, caseId, f.name.replace(/\.docx$/i, ""), "docx", f.data);
  }
}

/** Saves a marked up Word file into the client's folder as a Google Doc, so its tracked changes become suggestions. */
export async function saveAsGoogleDoc(firmId: string, caseId: string, conn: Connection, name: string, data: Uint8Array) {
  const c = db().prepare("SELECT client, type_code FROM cases WHERE firm_id = ? AND id = ?").get(firmId, caseId) as { client: string; type_code: string } | undefined;
  if (!c || conn.provider !== "google") return null;
  const r = await put(conn, firmId, caseId, c, name.replace(/[\\/:*?"<>|#%']/g, "").trim().slice(0, 120) || "Document", MIME.docx, Buffer.from(data), "application/vnd.google-apps.document");
  db().prepare("INSERT INTO kv (firm_id, key, value) VALUES (?, ?, ?) ON CONFLICT(firm_id, key) DO UPDATE SET value = excluded.value").run(firmId, `folder:${caseId}`, JSON.stringify({ url: r.folder, where: "Google Drive" }));
  return r.link;
}
