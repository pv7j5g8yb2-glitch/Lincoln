import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

// Passwords: scrypt with a random salt per user. Tokens (sessions, resets) are random 32 bytes;
// only their SHA-256 is stored, so a copy of the database cannot be used to sign in.

export const sha = (s: string) => createHash("sha256").update(s).digest("hex");
export const newToken = () => randomBytes(32).toString("base64url");
const PARAMS = { N: 16384, r: 8, p: 1 };

export function hashPassword(password: string) {
  const salt = randomBytes(16);
  const key = scryptSync(password, salt, 64, PARAMS);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

const DUMMY = hashPassword(randomBytes(12).toString("hex"));

export function verifyPassword(password: string, stored: string | null) {
  // Always do the work, even for unknown users, so timing does not reveal which emails exist.
  const [, saltB64, keyB64] = (stored ?? DUMMY).split("$");
  const key = scryptSync(password, Buffer.from(saltB64, "base64"), 64, PARAMS);
  const want = Buffer.from(keyB64, "base64");
  return Boolean(stored) && want.length === key.length && timingSafeEqual(want, key);
}

