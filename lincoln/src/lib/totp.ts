import crypto from "node:crypto";

// Time based one time passwords (RFC 6238): 6 digits, 30 seconds, SHA-1, as every authenticator app expects.
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

export function base32(buf: Buffer) {
  let bits = 0, value = 0, out = "";
  for (const b of buf) {
    value = (value << 8) | b; bits += 8;
    while (bits >= 5) { out += ALPHABET[(value >>> (bits - 5)) & 31]; bits -= 5; }
  }
  if (bits > 0) out += ALPHABET[(value << (5 - bits)) & 31];
  return out;
}
function unbase32(s: string) {
  let bits = 0, value = 0;
  const out: number[] = [];
  for (const ch of s.replace(/=+$/, "").toUpperCase()) {
    const i = ALPHABET.indexOf(ch);
    if (i < 0) continue;
    value = (value << 5) | i; bits += 5;
    if (bits >= 8) { out.push((value >>> (bits - 8)) & 255); bits -= 8; }
  }
  return Buffer.from(out);
}

export const newSecret = () => base32(crypto.randomBytes(20));

export function codeAt(secret: string, step: number) {
  const msg = Buffer.alloc(8);
  msg.writeBigUInt64BE(BigInt(step));
  const h = crypto.createHmac("sha1", unbase32(secret)).update(msg).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

/** Returns the time step that matched (one step either side is accepted), or null. */
export function verify(secret: string, code: string, lastStep: number | null) {
  const clean = code.replace(/\s/g, "");
  if (!/^\d{6}$/.test(clean)) return null;
  const now = Math.floor(Date.now() / 30000);
  for (const step of [now - 1, now, now + 1]) {
    if (lastStep !== null && step <= lastStep) continue; // a code can never be used twice
    const want = codeAt(secret, step);
    if (crypto.timingSafeEqual(Buffer.from(want), Buffer.from(clean))) return step;
  }
  return null;
}

export const otpauth = (secret: string, email: string) => `otpauth://totp/${encodeURIComponent(`Lincoln:${email}`)}?secret=${secret}&issuer=Lincoln&algorithm=SHA1&digits=6&period=30`;
