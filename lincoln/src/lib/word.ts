import crypto from "node:crypto";
import { db } from "./db";
import { sha } from "./passwords";
import type { Firm, User } from "./session";
import type { LetterContent } from "./letter";

// The Word add-in. Word on the web runs add-ins inside a frame where Lincoln's sign in cookie is not sent, so the
// add-in is connected once with a short code made in Lincoln (Integrations, Word), valid for ten minutes and one
// use. The add-in then holds a token of its own: stored here only as a hash, good for 90 days, ended by making a
// new code or by disconnecting.

const CODE_MINUTES = 10;
const TOKEN_DAYS = 90;
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no 0/O or 1/I


/** A one time code for connecting Word, shown once. Any earlier code or connection of this user's ends. */
export function newWordCode(firmId: string, userId: string) {
  const raw = Array.from(crypto.randomBytes(8), (b) => ALPHABET[b % ALPHABET.length]).join("");
  const d = db();
  d.prepare("DELETE FROM addin_codes WHERE user_id = ? OR expires_at < ?").run(userId, new Date().toISOString());
  d.prepare("INSERT INTO addin_codes (hash, firm_id, user_id, expires_at) VALUES (?, ?, ?, ?)").run(sha(raw), firmId, userId, new Date(Date.now() + CODE_MINUTES * 60_000).toISOString());
  return `${raw.slice(0, 4)}-${raw.slice(4)}`;
}

/** Trades a code for the add-in's token. */
export function redeemWordCode(code: string) {
  const d = db();
  const raw = code.toUpperCase().replace(/[^A-Z0-9]/g, "");
  const row = d.prepare("SELECT firm_id, user_id, expires_at FROM addin_codes WHERE hash = ?").get(sha(raw)) as { firm_id: string; user_id: string; expires_at: string } | undefined;
  if (!row) return null;
  d.prepare("DELETE FROM addin_codes WHERE hash = ?").run(sha(raw));
  if (row.expires_at < new Date().toISOString()) return null;
  const token = crypto.randomBytes(32).toString("base64url");
  d.prepare("DELETE FROM addin_tokens WHERE user_id = ?").run(row.user_id);
  d.prepare("INSERT INTO addin_tokens (hash, firm_id, user_id, created_at, expires_at) VALUES (?, ?, ?, ?, ?)").run(sha(token), row.firm_id, row.user_id, new Date().toISOString(), new Date(Date.now() + TOKEN_DAYS * 86400_000).toISOString());
  return token;
}

/** The person behind an add-in request, from its bearer token. The firm's two step rule still applies. */
export function wordUser(req: Request): { user: User; firm: Firm } | null {
  const token = /^Bearer\s+([\w-]{20,100})$/.exec(req.headers.get("authorization") ?? "")?.[1];
  if (!token) return null;
  const d = db();
  const row = d.prepare("SELECT t.hash, u.id, u.firm_id, u.name, u.email, u.role, u.initials, u.avatar, u.admin, u.totp_enc IS NOT NULL AS two FROM addin_tokens t JOIN users u ON u.id = t.user_id AND u.firm_id = t.firm_id WHERE t.hash = ? AND t.expires_at > ?").get(sha(token), new Date().toISOString()) as (User & { hash: string; two: number }) | undefined;
  if (!row) return null;
  const { hash, two, ...user } = row;
  const firm = d.prepare("SELECT id, name, demo, require_2fa FROM firms WHERE id = ?").get(user.firm_id) as Firm;
  if (firm.require_2fa && !two) return null;
  d.prepare("UPDATE addin_tokens SET last_used_at = ? WHERE hash = ?").run(new Date().toISOString(), hash);
  return { user, firm };
}

export function endWord(userId: string) {
  db().prepare("DELETE FROM addin_tokens WHERE user_id = ?").run(userId);
  db().prepare("DELETE FROM addin_codes WHERE user_id = ?").run(userId);
}

export function wordConnected(userId: string) {
  return db().prepare("SELECT last_used_at, created_at FROM addin_tokens WHERE user_id = ? AND expires_at > ?").get(userId, new Date().toISOString()) as { last_used_at: string | null; created_at: string } | undefined;
}

/** A draft as Word blocks, cited the same way as the .docx export: "(Passport, client file p. 3)". */
export function draftBlocks(title: string, content: string) {
  const L = JSON.parse(content) as LetterContent;
  const blocks: { kind: "title" | "heading" | "para" | "note"; text: string }[] = [{ kind: "title", text: title }];
  for (const sec of L.sections ?? []) {
    if (sec.heading) blocks.push({ kind: "heading", text: sec.cite ? `${sec.heading}: ${sec.cite}` : sec.heading });
    for (const p of sec.paras ?? []) {
      const text = p.map((g) => g.k === "note" ? ` [Attorney: ${g.t.trim()}]` : g.k === "fact" && g.doc ? `${g.t} (${g.doc}, client file p. ${g.page})` : g.t).join("");
      for (const line of text.split("\n")) if (line.trim()) blocks.push({ kind: "para", text: line });
    }
  }
  return blocks;
}
