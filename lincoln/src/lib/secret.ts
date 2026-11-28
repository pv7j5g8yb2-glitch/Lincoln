import crypto from "node:crypto";
import { masterKey } from "./keys";

// Mailbox tokens are encrypted at rest with AES-256-GCM. The key comes from LINCOLN_SECRET, or is
// generated once and kept on the data disk, never in the repository.

const getKey = masterKey;

export function seal(text: string) {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", getKey(), iv);
  const body = Buffer.concat([c.update(text, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), body].map((b) => b.toString("base64url")).join(".");
}

export function open(sealed: string) {
  const [iv, tag, body] = sealed.split(".").map((p) => Buffer.from(p, "base64url"));
  const d = crypto.createDecipheriv("aes-256-gcm", getKey(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(body), d.final()]).toString("utf8");
}

/** HMAC for OAuth state values. */
export const sign = (v: string) => crypto.createHmac("sha256", getKey()).update(v).digest("base64url");
