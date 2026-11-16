import { db, uid } from "./db";
import { connectionsOf, saveFile, settingsOf, type Connection } from "./integrations";

// Lincoln's work in the firm's own files. Everything approved (letters, translations, the filing packet, marked up
// documents) is saved into the client's folder, Lincoln/Clients/<client>, in the Google Drive or OneDrive of the
// case's attorney (or, failing that, of an admin), so the firm always has it where it keeps its files.

const MIME = { docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", pdf: "application/pdf", xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" } as const;

/** The connection whose files Lincoln writes to for a case: the attorney's, then an admin's, then anyone's. */
export function driveFor(firmId: string, caseId: string): Connection | undefined {
  const d = db();
  const c = d.prepare("SELECT attorney_id FROM cases WHERE firm_id = ? AND id = ?").get(firmId, caseId) as { attorney_id: string } | undefined;
  const all = connectionsOf(firmId).filter((x) => x.provider === "microsoft" || /drive\.file/.test(settingsOf(x).granted ?? "") || !settingsOf(x).granted);
  const admins = new Set((d.prepare("SELECT id FROM users WHERE firm_id = ? AND admin = 1").all(firmId) as { id: string }[]).map((x) => x.id));
  return all.find((x) => x.user_id === c?.attorney_id) ?? all.find((x) => admins.has(x.user_id)) ?? all[0];
}

const folderName = (client: string, type: string) => `${client.replace(/[\\/:*?"<>|#%']/g, "").trim().slice(0, 80) || "Client"} (${type.replace(/[\\/:*?"<>|#%']/g, "").slice(0, 30)})`;

/** Saves one file into the client's folder. Quietly does nothing when no account is connected. */
export async function saveToFolder(firmId: string, caseId: string, name: string, kind: keyof typeof MIME, data: Buffer | Uint8Array) {
  const conn = driveFor(firmId, caseId);
  if (!conn) return null;
  const d = db();
  const c = d.prepare("SELECT client, type_code FROM cases WHERE firm_id = ? AND id = ?").get(firmId, caseId) as { client: string; type_code: string } | undefined;
  if (!c) return null;
  const file = `${name.replace(/[\\/:*?"<>|#%']/g, "").trim().slice(0, 120) || "Document"}.${kind}`;
  try {
    const r = await saveFile(conn, ["Clients", folderName(c.client, c.type_code)], file, MIME[kind], Buffer.from(data));
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
export async function saveApproved(firmId: string, caseId: string, kind: string, payload: { draftId?: string; fileId?: string }) {
  if ((kind === "draft_review" || kind === "translation") && payload.draftId) {
    const dr = db().prepare("SELECT title, content FROM drafts WHERE firm_id = ? AND id = ?").get(firmId, payload.draftId) as { title: string; content: string } | undefined;
    if (!dr) return;
    const { draftDocx } = await import("./office");
    await saveToFolder(firmId, caseId, dr.title, "docx", await draftDocx(dr));
  } else if (kind === "packet") {
    const { buildPacket } = await import("./packet");
    await saveToFolder(firmId, caseId, "Filing packet", "pdf", await buildPacket(firmId, caseId));
  } else if (kind === "redline" && payload.fileId) {
    const { redlineFile } = await import("./redline");
    const f = redlineFile(firmId, payload.fileId);
    if (f) await saveToFolder(firmId, caseId, f.name.replace(/\.docx$/i, ""), "docx", f.data);
  }
}
