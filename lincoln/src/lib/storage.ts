import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { dataDir, db } from "./db";
import { open, seal } from "./secret";

// Client files are encrypted at rest with a key that belongs to one firm (AES-256-GCM). The firm key
// is itself encrypted with the server's master key, so a copy of the disk without the master key
// reveals nothing, and one firm's key opens nothing of another's.

const keys = new Map<string, Buffer>();
export function firmKey(firmId: string) {
  const hit = keys.get(firmId);
  if (hit) return hit;
  const d = db();
  const row = d.prepare("SELECT key_enc FROM firms WHERE id = ?").get(firmId) as { key_enc: string | null } | undefined;
  if (!row) throw new Error("Unknown firm");
  let key: Buffer;
  if (row.key_enc) key = Buffer.from(open(row.key_enc), "base64");
  else {
    key = crypto.randomBytes(32);
    d.prepare("UPDATE firms SET key_enc = ? WHERE id = ? AND key_enc IS NULL").run(seal(key.toString("base64")), firmId);
    const again = d.prepare("SELECT key_enc FROM firms WHERE id = ?").get(firmId) as { key_enc: string };
    key = Buffer.from(open(again.key_enc), "base64");
  }
  keys.set(firmId, key);
  return key;
}
export const forgetFirmKey = (firmId: string) => keys.delete(firmId);

export function encrypt(firmId: string, data: Buffer) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", firmKey(firmId), iv);
  const body = Buffer.concat([c.update(data), c.final()]);
  return Buffer.concat([Buffer.from("LNC1"), iv, c.getAuthTag(), body]);
}
export function decrypt(firmId: string, blob: Buffer) {
  if (blob.subarray(0, 4).toString() !== "LNC1") throw new Error("Not an encrypted file");
  const d = crypto.createDecipheriv("aes-256-gcm", firmKey(firmId), blob.subarray(4, 16));
  d.setAuthTag(blob.subarray(16, 32));
  return Buffer.concat([d.update(blob.subarray(32)), d.final()]);
}

export const pagesDir = (caseId: string) => path.join(dataDir(), "pages", caseId.replace(/[^\w-]/g, ""));
const pageName = (n: number) => `p-${String(n).padStart(2, "0")}`;

export function savePage(firmId: string, caseId: string, n: number, jpeg: Buffer) {
  const dir = pagesDir(caseId);
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  fs.writeFileSync(path.join(dir, `${pageName(n)}.lnc`), encrypt(firmId, jpeg), { mode: 0o600 });
}

/** A page image: the firm's encrypted copy, or a made up sample page shipped with the app. */
export function loadPage(firmId: string, caseId: string, n: number): Buffer | null {
  const enc = path.join(pagesDir(caseId), `${pageName(n)}.lnc`);
  if (fs.existsSync(enc)) return decrypt(firmId, fs.readFileSync(enc));
  const legacy = path.join(pagesDir(caseId), `${pageName(n)}.jpg`);
  if (fs.existsSync(legacy)) {
    // Files written before encryption are encrypted on first read.
    const data = fs.readFileSync(legacy);
    savePage(firmId, caseId, n, data);
    fs.unlinkSync(legacy);
    return data;
  }
  const sample = path.join(process.cwd(), "seed", "pages", caseId.replace(/[^\w-]/g, ""), `${pageName(n)}.jpg`);
  return fs.existsSync(sample) ? fs.readFileSync(sample) : null;
}

export function deleteCaseFiles(caseId: string) {
  fs.rmSync(pagesDir(caseId), { recursive: true, force: true });
}

export function removePagesAfter(caseId: string, keep: number) {
  const dir = pagesDir(caseId);
  if (!fs.existsSync(dir)) return;
  for (const f of fs.readdirSync(dir)) {
    const n = Number(/^p-(\d+)\./.exec(f)?.[1] ?? 0);
    if (n > keep) fs.unlinkSync(path.join(dir, f));
  }
}
