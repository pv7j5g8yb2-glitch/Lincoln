import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3-multiple-ciphers";
import { dataDir, db } from "./db";
import { derivedKey } from "./keys";

// Backups. Every six hours the database is copied whole into DATA_DIR/backups, still encrypted with the same key,
// and the copy is opened and checked before it is kept. Render's daily disk snapshots then carry these clean copies
// (a snapshot of a database file in mid write can come back damaged; a finished copy cannot). When an S3 compatible
// bucket is configured (Cloudflare R2, Backblaze B2, AWS S3), each new copy and every new client file also go off
// site. Everything sent is already encrypted: the bucket only ever holds ciphertext.

export const backupDir = () => path.join(dataDir(), "backups");
const statusFile = () => path.join(backupDir(), "status.json");

export type BackupStatus = { at: string; file: string; bytes: number; ok: boolean; error?: string; offsite?: { at: string; ok: boolean; sent: number; error?: string } };

export function backupStatus(): BackupStatus | null {
  try { return JSON.parse(fs.readFileSync(statusFile(), "utf8")) as BackupStatus; } catch { return null; }
}
const writeStatus = (s: BackupStatus) => fs.writeFileSync(statusFile(), JSON.stringify(s, null, 1), { mode: 0o600 });

/** Opens a copy with the database key and checks it is whole. */
export function verifyCopy(file: string) {
  const c = new Database(file, { readonly: true, fileMustExist: true });
  try {
    c.pragma(`key='${derivedKey("database")}'`);
    const check = c.pragma("quick_check", { simple: true });
    if (check !== "ok") throw new Error(`check failed: ${String(check)}`);
    c.prepare("SELECT COUNT(*) AS n FROM firms").get();
  } finally { c.close(); }
}

const stamp = (d = new Date()) => d.toISOString().slice(0, 16).replace(/[-:]/g, "").replace("T", "-");

/** Makes, checks and keeps one copy of the database, then sends it off site if a bucket is set. */
export async function backupNow(): Promise<BackupStatus> {
  const dir = backupDir();
  fs.mkdirSync(dir, { recursive: true, mode: 0o700 });
  const name = `lincoln-${stamp()}.db`;
  const tmp = path.join(dir, `${name}.part`), final = path.join(dir, name);
  let status: BackupStatus;
  try {
    fs.rmSync(tmp, { force: true });
    db().exec(`VACUUM INTO '${tmp.replace(/'/g, "''")}'`);
    verifyCopy(tmp);
    fs.renameSync(tmp, final);
    fs.chmodSync(final, 0o600);
    status = { at: new Date().toISOString(), file: name, bytes: fs.statSync(final).size, ok: true };
    prune();
  } catch (e) {
    fs.rmSync(tmp, { force: true });
    status = { at: new Date().toISOString(), file: name, bytes: 0, ok: false, error: e instanceof Error ? e.message.slice(0, 200) : "failed" };
    console.error("Backup failed:", status.error);
  }
  if (status.ok && offsiteConfigured()) {
    try { status.offsite = { at: new Date().toISOString(), ok: true, sent: await sendOffsite(path.join(dir, status.file)) }; }
    catch (e) { status.offsite = { at: new Date().toISOString(), ok: false, sent: 0, error: e instanceof Error ? e.message.slice(0, 200) : "failed" }; console.error("Off site backup failed:", status.offsite.error); }
  }
  writeStatus(status);
  return status;
}

/** Keeps every copy of the last 7 days, then one a day for 30 days. */
function prune() {
  const files = fs.readdirSync(backupDir()).filter((f) => /^lincoln-\d{8}-\d{4}\.db$/.test(f)).sort().reverse();
  const now = Date.now(), days = new Set<string>();
  for (const f of files) {
    const d = f.slice(8, 16);
    const at = Date.UTC(+d.slice(0, 4), +d.slice(4, 6) - 1, +d.slice(6, 8));
    const age = (now - at) / 86400_000;
    if (age <= 7) continue;
    if (age <= 30 && !days.has(d)) { days.add(d); continue; }
    fs.rmSync(path.join(backupDir(), f), { force: true });
  }
}

/* Off site copies through the S3 API, signed with AWS Signature Version 4 (no SDK needed). */
const S3 = () => ({ endpoint: (process.env.BACKUP_S3_ENDPOINT ?? "").replace(/\/$/, ""), bucket: process.env.BACKUP_S3_BUCKET ?? "", id: process.env.BACKUP_S3_KEY_ID ?? "", secret: process.env.BACKUP_S3_SECRET ?? "", region: process.env.BACKUP_S3_REGION || "auto" });
export const offsiteConfigured = () => { const c = S3(); return Boolean(c.endpoint && c.bucket && c.id && c.secret); };

const sha256 = (data: Buffer | string) => crypto.createHash("sha256").update(data).digest("hex");
const hmac = (key: Buffer | string, data: string) => crypto.createHmac("sha256", key).update(data).digest();
const encodeKey = (key: string) => key.split("/").map((s) => encodeURIComponent(s).replace(/[!'()*]/g, (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`)).join("/");

/** The signed headers for one PUT of an object, path style. Exported for the test. */
export function signPut(key: string, body: Buffer, now = new Date(), c = S3()) {
  const url = new URL(`${c.endpoint}/${c.bucket}/${encodeKey(key)}`);
  const amzDate = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const day = amzDate.slice(0, 8);
  const payload = sha256(body);
  const headers: Record<string, string> = { host: url.host, "x-amz-content-sha256": payload, "x-amz-date": amzDate };
  const signed = Object.keys(headers).sort();
  const canonical = ["PUT", url.pathname, "", ...signed.map((h) => `${h}:${headers[h]}`), "", signed.join(";"), payload].join("\n");
  const scope = `${day}/${c.region}/s3/aws4_request`;
  const toSign = ["AWS4-HMAC-SHA256", amzDate, scope, sha256(canonical)].join("\n");
  const kSign = hmac(hmac(hmac(hmac(`AWS4${c.secret}`, day), c.region), "s3"), "aws4_request");
  const signature = crypto.createHmac("sha256", kSign).update(toSign).digest("hex");
  return { url: url.toString(), headers: { ...headers, authorization: `AWS4-HMAC-SHA256 Credential=${c.id}/${scope}, SignedHeaders=${signed.join(";")}, Signature=${signature}` } };
}

async function put(key: string, body: Buffer) {
  const { url, headers } = signPut(key, body);
  // fetch sets the Host header itself; the rest go as signed.
  const send: Record<string, string> = { ...headers };
  delete send.host;
  const res = await fetch(url, { method: "PUT", headers: send, body: new Uint8Array(body) });
  if (!res.ok) throw new Error(`bucket replied ${res.status} for ${key}`);
}

/** Sends the database copy, then every client file not sent before. Returns how many objects were sent. */
async function sendOffsite(copy: string) {
  await put(`db/${path.basename(copy)}`, fs.readFileSync(copy));
  let sent = 1;
  const manifest = path.join(backupDir(), "offsite.json");
  const done = new Set<string>(fs.existsSync(manifest) ? JSON.parse(fs.readFileSync(manifest, "utf8")) as string[] : []);
  const pages = path.join(dataDir(), "pages");
  if (fs.existsSync(pages)) {
    for (const c of fs.readdirSync(pages)) {
      const dir = path.join(pages, c);
      if (!fs.statSync(dir).isDirectory()) continue;
      for (const f of fs.readdirSync(dir)) {
        if (!f.endsWith(".lnc")) continue;
        const key = `pages/${c}/${f}`;
        if (done.has(key)) continue;
        await put(key, fs.readFileSync(path.join(dir, f)));
        done.add(key); sent++;
        if (sent % 50 === 0) fs.writeFileSync(manifest, JSON.stringify([...done]));
      }
    }
  }
  fs.writeFileSync(manifest, JSON.stringify([...done]));
  return sent;
}
