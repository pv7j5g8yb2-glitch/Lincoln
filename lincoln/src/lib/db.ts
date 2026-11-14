import Database from "better-sqlite3-multiple-ciphers";
import { derivedKey } from "./keys";
import fs from "node:fs";
import path from "node:path";
import { seed } from "./seed";
import { hashPassword } from "./passwords";

// One SQLite file, encrypted as a whole (SQLite3 Multiple Ciphers, ChaCha20-Poly1305) with a key
// derived from the master key: the file, its journal and any copy of the disk are unreadable without
// it. Every table carries firm_id and every query in queries.ts filters on it.

const SCHEMA = `
CREATE TABLE IF NOT EXISTS firms (id TEXT PRIMARY KEY, name TEXT NOT NULL, demo INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, name TEXT NOT NULL, email TEXT NOT NULL, role TEXT NOT NULL, initials TEXT NOT NULL, password_hash TEXT, created_at TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS u_users_email ON users(email);
CREATE TABLE IF NOT EXISTS password_resets (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL, used_at TEXT);
CREATE TABLE IF NOT EXISTS outbox (id TEXT PRIMARY KEY, recipient TEXT NOT NULL, subject TEXT NOT NULL, body TEXT NOT NULL, at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS sessions (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS cases (
  id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, ref TEXT NOT NULL, client TEXT NOT NULL, counterpart TEXT,
  type_code TEXT NOT NULL, type_name TEXT NOT NULL, family TEXT NOT NULL, stage TEXT NOT NULL, state TEXT NOT NULL,
  waiting_on TEXT, summary TEXT, attorney_id TEXT, paralegal_id TEXT, opened_at TEXT NOT NULL,
  next_date TEXT, next_date_label TEXT, sensitive INTEGER NOT NULL DEFAULT 0, pages INTEGER NOT NULL DEFAULT 0
);
CREATE TABLE IF NOT EXISTS documents (
  id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, case_id TEXT NOT NULL, n INTEGER NOT NULL, title TEXT NOT NULL, kind TEXT NOT NULL,
  page_from INTEGER, page_to INTEGER, doc_date TEXT, source TEXT, language TEXT, is_scan INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL, note TEXT, received_at TEXT
);
CREATE TABLE IF NOT EXISTS criteria (
  id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, case_id TEXT NOT NULL, n INTEGER NOT NULL, code TEXT NOT NULL, name TEXT NOT NULL,
  citation TEXT NOT NULL, recommendation TEXT NOT NULL, strength TEXT NOT NULL, summary TEXT, weakness TEXT, evidence TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS issues (
  id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, case_id TEXT NOT NULL, kind TEXT NOT NULL, severity TEXT NOT NULL, title TEXT NOT NULL,
  detail TEXT, sources TEXT, status TEXT NOT NULL, resolution TEXT, created_at TEXT NOT NULL, resolved_at TEXT
);
CREATE TABLE IF NOT EXISTS dates (id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, case_id TEXT NOT NULL, label TEXT NOT NULL, date TEXT NOT NULL, kind TEXT NOT NULL, source TEXT);
CREATE TABLE IF NOT EXISTS activity (id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, case_id TEXT, at TEXT NOT NULL, actor TEXT NOT NULL, kind TEXT NOT NULL, text TEXT NOT NULL, minutes INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS approvals (
  id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, case_id TEXT NOT NULL, kind TEXT NOT NULL, title TEXT NOT NULL, brief TEXT NOT NULL,
  least_sure TEXT, if_wrong TEXT, payload TEXT NOT NULL, status TEXT NOT NULL, assignee_id TEXT, created_at TEXT NOT NULL,
  decided_at TEXT, decided_by TEXT, due TEXT
);
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, case_id TEXT, direction TEXT NOT NULL, party TEXT NOT NULL, party_role TEXT,
  subject TEXT NOT NULL, body TEXT NOT NULL, at TEXT NOT NULL, state TEXT NOT NULL, lincoln_note TEXT
);
CREATE TABLE IF NOT EXISTS drafts (id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, case_id TEXT NOT NULL, title TEXT NOT NULL, kind TEXT NOT NULL, status TEXT NOT NULL, version INTEGER NOT NULL, content TEXT NOT NULL, updated_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS chat (id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, user_id TEXT NOT NULL, role TEXT NOT NULL, content TEXT NOT NULL, at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS kv (firm_id TEXT NOT NULL, key TEXT NOT NULL, value TEXT NOT NULL, PRIMARY KEY (firm_id, key));
CREATE TABLE IF NOT EXISTS mailboxes (id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, user_id TEXT NOT NULL, provider TEXT NOT NULL, email TEXT NOT NULL, refresh_enc TEXT NOT NULL, access_enc TEXT, expires_at INTEGER, last_check TEXT, last_error TEXT, created_at TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS security_events (id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, user_id TEXT, at TEXT NOT NULL, kind TEXT NOT NULL, detail TEXT, ip TEXT);
CREATE INDEX IF NOT EXISTS i_sec_user ON security_events(user_id, at);
CREATE TABLE IF NOT EXISTS identities (provider TEXT NOT NULL, subject TEXT NOT NULL, user_id TEXT NOT NULL, created_at TEXT NOT NULL, PRIMARY KEY (provider, subject));
CREATE TABLE IF NOT EXISTS login_challenges (token_hash TEXT PRIMARY KEY, user_id TEXT NOT NULL, expires_at TEXT NOT NULL, attempts INTEGER NOT NULL DEFAULT 0);
CREATE TABLE IF NOT EXISTS inbound_seen (mailbox_id TEXT NOT NULL, msg_id TEXT NOT NULL, PRIMARY KEY (mailbox_id, msg_id));
CREATE INDEX IF NOT EXISTS i_cases_firm ON cases(firm_id);
CREATE INDEX IF NOT EXISTS i_docs_case ON documents(firm_id, case_id);
CREATE INDEX IF NOT EXISTS i_act_firm ON activity(firm_id, at);
CREATE INDEX IF NOT EXISTS i_appr_firm ON approvals(firm_id, status);
CREATE INDEX IF NOT EXISTS i_msg_firm ON messages(firm_id, at);
`;

const TABLES = ["forms", "usage", "access_log", "security_events", "mailboxes", "sessions", "kv", "chat", "drafts", "messages", "approvals", "activity", "dates", "issues", "criteria", "documents", "cases", "users", "firms"];

/** Where the database lives. On Render this is the persistent disk (DATA_DIR=/var/data). */
export const dataDir = () => process.env.DATA_DIR || path.join(process.cwd(), "data");

type G = typeof globalThis & { __lincolnDb?: Database.Database };

export function db(): Database.Database {
  const g = globalThis as G;
  if (g.__lincolnDb) return g.__lincolnDb;
  const dir = dataDir();
  fs.mkdirSync(dir, { recursive: true });
  const file = path.join(dir, "lincoln.db");
  const pass = derivedKey("database");
  // A database written before encryption is converted in place, once.
  if (fs.existsSync(file) && fs.readFileSync(file).subarray(0, 15).toString("latin1") === "SQLite format 3") {
    const plain = new Database(file);
    plain.pragma("wal_checkpoint(TRUNCATE)");
    plain.pragma("journal_mode = DELETE");
    plain.pragma(`rekey='${pass}'`);
    plain.close();
  }
  const d = new Database(file);
  d.pragma(`key='${pass}'`);
  d.pragma("journal_mode = WAL");
  d.pragma("foreign_keys = ON");
  d.exec(SCHEMA);
  d.exec("CREATE TABLE IF NOT EXISTS access_log (id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, user_id TEXT, at TEXT NOT NULL, action TEXT NOT NULL, target TEXT, label TEXT, ip TEXT)");
  d.exec("CREATE TABLE IF NOT EXISTS forms (id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, case_id TEXT NOT NULL, code TEXT NOT NULL, title TEXT NOT NULL, status TEXT NOT NULL, fields INTEGER NOT NULL DEFAULT 0, layout TEXT NOT NULL DEFAULT '[]', answers TEXT NOT NULL DEFAULT '[]', updated_at TEXT NOT NULL)");
  d.exec("CREATE TABLE IF NOT EXISTS usage (id TEXT PRIMARY KEY, firm_id TEXT NOT NULL, case_id TEXT, at TEXT NOT NULL, purpose TEXT NOT NULL, model TEXT NOT NULL, input_tokens INTEGER NOT NULL, output_tokens INTEGER NOT NULL, cost REAL NOT NULL)");
  d.exec("CREATE TABLE IF NOT EXISTS known_devices (user_id TEXT NOT NULL, device TEXT NOT NULL, first_seen TEXT NOT NULL, PRIMARY KEY (user_id, device))");
  for (const [table, col, type] of [["users", "avatar", "TEXT"], ["cases", "processing", "INTEGER NOT NULL DEFAULT 0"], ["cases", "note", "TEXT"], ["chat", "case_id", "TEXT"], ["cases", "client_email", "TEXT"], ["messages", "email", "TEXT"], ["messages", "thread_id", "TEXT"], ["messages", "mailbox_id", "TEXT"], ["mailboxes", "settings", "TEXT"], ["users", "totp_enc", "TEXT"], ["users", "totp_pending_enc", "TEXT"], ["users", "totp_last_step", "INTEGER"], ["users", "recovery", "TEXT"], ["sessions", "ip", "TEXT"], ["sessions", "agent", "TEXT"], ["sessions", "last_seen", "TEXT"], ["firms", "key_enc", "TEXT"], ["firms", "require_2fa", "INTEGER NOT NULL DEFAULT 0"], ["issues", "rule", "TEXT"], ["firms", "address", "TEXT"], ["firms", "phone", "TEXT"], ["firms", "email", "TEXT"], ["users", "bar_number", "TEXT"], ["users", "bar_state", "TEXT"], ["cases", "receipt", "TEXT"]]) {
    const cols = d.prepare(`PRAGMA table_info(${table})`).all() as { name: string }[];
    if (!cols.some((c) => c.name === col)) d.exec(`ALTER TABLE ${table} ADD COLUMN ${col} ${type}`);
  }
  // The old outbox kept reset links in readable form; nothing may keep them.
  d.exec("DELETE FROM outbox");
  d.exec(`DELETE FROM sessions WHERE created_at < '${new Date(Date.now() - 24 * 3600_000).toISOString()}'`);
  // A server restart ends any background reading; do not leave cases marked as in progress.
  d.exec("UPDATE cases SET processing = 0, note = 'Reading was interrupted. Upload the file again.' WHERE processing = 1");
  const n = d.prepare("SELECT COUNT(*) AS n FROM firms").get() as { n: number };
  if (n.n === 0) seed(d);
  ensureOwner(d);
  g.__lincolnDb = d;
  return d;
}

/** Wipes the demo firm and seeds it again. Only ever touches a firm marked demo. */
export function resetDemo(firmId: string) {
  const d = db();
  const firm = d.prepare("SELECT demo FROM firms WHERE id = ?").get(firmId) as { demo: number } | undefined;
  if (!firm || firm.demo !== 1) throw new Error("Only the demo workspace can be reset");
  const tx = d.transaction(() => {
    for (const t of TABLES) {
      if (t === "sessions") d.prepare("DELETE FROM sessions WHERE user_id IN (SELECT id FROM users WHERE firm_id = ?)").run(firmId);
      else if (t === "firms") d.prepare("DELETE FROM firms WHERE id = ?").run(firmId);
      else d.prepare(`DELETE FROM ${t} WHERE firm_id = ?`).run(firmId);
    }
    seed(d);
  });
  tx();
}

/**
 * A personal account from SEED_USER_EMAIL and SEED_USER_PASSWORD, in its own empty firm like any new
 * sign up. Nothing personal is written into the repository.
 */
function ensureOwner(d: Database.Database) {
  const email = (process.env.SEED_USER_EMAIL ?? "").trim().toLowerCase();
  const pass = process.env.SEED_USER_PASSWORD ?? "";
  if (!email || pass.length < 10) return;
  const existing = d.prepare("SELECT id, firm_id FROM users WHERE email = ?").get(email) as { id: string; firm_id: string } | undefined;
  if (existing && existing.firm_id !== "f_demo") return;
  const name = (process.env.SEED_USER_NAME ?? "").trim() || "Administrator";
  const initials = name.split(/\s+/).map((w) => w[0]?.toUpperCase() ?? "").slice(0, 2).join("") || "A";
  d.transaction(() => {
    if (existing) d.prepare("DELETE FROM users WHERE id = ?").run(existing.id);
    d.prepare("INSERT OR IGNORE INTO firms (id, name, demo) VALUES ('f_owner', ?, 0)").run((process.env.SEED_USER_FIRM ?? "").trim() || "New firm");
    d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, password_hash, created_at) VALUES ('u_owner', 'f_owner', ?, ?, 'Administrator', ?, ?, ?)").run(name, email, initials, hashPassword(pass), new Date().toISOString());
  })();
}

export const uid = () => crypto.randomUUID().replace(/-/g, "").slice(0, 16);
