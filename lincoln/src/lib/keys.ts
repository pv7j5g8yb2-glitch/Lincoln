import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";

// The server's master key. It comes from LINCOLN_SECRET, or is generated once and kept on the data
// disk (never in the repository). Every other key is derived from it or sealed with it.

let master: Buffer | null = null;
export function masterKey() {
  if (master) return master;
  const env = process.env.LINCOLN_SECRET;
  if (env) return (master = crypto.createHash("sha256").update(env).digest());
  const dir = process.env.DATA_DIR || path.join(process.cwd(), "data");
  const file = path.join(dir, "secret.key");
  if (!fs.existsSync(file)) {
    fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(file, crypto.randomBytes(32).toString("hex"), { mode: 0o600 });
  }
  return (master = Buffer.from(fs.readFileSync(file, "utf8").trim(), "hex"));
}

/** A key for one purpose, derived from the master key, so no two uses share a key. */
export const derivedKey = (purpose: string) => crypto.createHmac("sha256", masterKey()).update(`lincoln:${purpose}`).digest("hex");
