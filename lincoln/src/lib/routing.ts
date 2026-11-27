import { db, uid } from "./db";

// Which case something belongs to. Every way into Lincoln (an email, a reply, an agency notice, a forwarded message, an
// instruction typed by the firm, a client's intake link) goes through here before anything is opened or filed, so the
// same person is never given a second case for the same matter, and replies, notices and documents land where they
// belong however many cases the firm has.
//
// Three levels:
//   sure    the same email thread, a USCIS receipt number or an A-Number already on exactly one case: filed there.
//   likely  an address, phone, or name and date of birth already on exactly one case: offered first, the model decides
//           whether it is that matter or a new one for the same person.
//   related more than one case, or a name alone: offered to the model, never filed or merged on their own.
// Every case of the firm is searched, not only the most recent ones.

export type Kind = "email" | "phone" | "receipt" | "anumber" | "person" | "file";
export type Route = { sure: { caseId: string; why: string } | null; likely: { caseId: string; why: string } | null; related: string[] };

/** Mail services people use personally: an address on one of these says nothing about an employer. */
const FREE = new Set(["gmail.com", "googlemail.com", "outlook.com", "hotmail.com", "live.com", "msn.com", "yahoo.com", "ymail.com", "icloud.com", "me.com", "mac.com", "aol.com", "proton.me", "protonmail.com", "pm.me", "gmx.com", "gmx.net", "gmx.de", "mail.com", "yandex.com", "yandex.ru", "zoho.com", "qq.com", "163.com", "126.com", "naver.com", "hanmail.net", "rediffmail.com", "web.de", "libero.it", "orange.fr", "laposte.net", "comcast.net", "att.net", "verizon.net", "sbcglobal.net"]);

/** One address for one mailbox: lower case, no "+tag", and no dots in a Gmail name (Gmail ignores them). */
export function normEmail(e: string | null | undefined) {
  const s = String(e ?? "").trim().toLowerCase().replace(/^mailto:/, "");
  const at = s.lastIndexOf("@");
  if (at < 1 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s)) return "";
  let local = s.slice(0, at).split("+")[0];
  const domain = s.slice(at + 1);
  if (domain === "gmail.com" || domain === "googlemail.com") return `${local.replace(/\./g, "")}@gmail.com`;
  return `${local}@${domain}`;
}

/** Addresses that are not a person's own: automated senders and government mail (one agency address writes about
 *  every case, so it never identifies one). */
export function personalAddress(e: string) {
  const [local, domain = ""] = e.split("@");
  if (!local || /\.(gov|mil)$/.test(domain)) return false;
  return !/^(no-?reply|do-?not-?reply|donotreply|mailer-daemon|postmaster|notifications?|alerts?|bounce[s]?|info|support|hello|contact|admin|office)$/.test(local);
}

export const domainOf = (e: string) => e.split("@")[1] ?? "";
export const isFree = (domain: string) => FREE.has(domain);

/** A phone number as its last ten digits, enough to match +1 (555) 010-0199 with 5550100199. */
export function normPhone(p: string | null | undefined) {
  const digits = String(p ?? "").replace(/\D/g, "");
  return digits.length >= 7 ? digits.slice(-10) : "";
}

/** USCIS receipt numbers: three letters for the office, ten digits (EAC2612345678, IOE0912345678, a field office Z..). */
export function receiptsIn(text: string) {
  const out = new Set<string>();
  for (const m of String(text ?? "").toUpperCase().matchAll(/\b(EAC|WAC|LIN|SRC|NBC|MSC|IOE|YSC|TSC|VSC|CSC|NSC|Z[A-Z]{2})[\s-]?(\d{10})\b/g)) out.add(m[1] + m[2]);
  return [...out];
}

/** A-Numbers, as nine digits: "A 123 456 789", "A-12345678", "A#123456789", "A-Number: 123-456-789". */
export function aNumbersIn(text: string) {
  const out = new Set<string>();
  const s = String(text ?? "");
  for (const m of s.matchAll(/\bA(?:lien)?[\s#.-]*(?:number|no\.?|num\.?)?[\s:#.-]*(\d{3}[\s-]?\d{3}[\s-]?\d{2,3})\b/gi)) {
    const d = m[1].replace(/\D/g, "");
    if (d.length === 8 || d.length === 9) out.add(d.padStart(9, "0"));
  }
  return [...out];
}

/** A name for comparing: no accents, titles, punctuation or case. "Dr. Réka Halász" and "reka halasz" are equal. */
const normed = new Map<string, string>();
export function normName(s: string | null | undefined) {
  const key = String(s ?? "");
  let v = normed.get(key);
  if (v === undefined) {
    // A pure function over names, called for every client on every email: kept, so thousands of cases cost a lookup each.
    if (normed.size > 200_000) normed.clear();
    v = normalise(key);
    normed.set(key, v);
  }
  return v;
}
function normalise(s: string) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase()
    .replace(/[^a-z\s'-]/g, " ").replace(/['-]/g, " ")
    .split(/\s+/).filter((w) => w && !["dr", "mr", "mrs", "ms", "miss", "esq", "jr", "sr", "ii", "iii", "the", "and"].includes(w)).join(" ");
}

/** The same person's name written two ways: the same words, or one name inside the other with at least a first and a
 *  last name (a second surname or a middle name added: "Maria Garcia" and "Maria Elena Garcia Lopez"). */
export function sameName(a: string, b: string) {
  const x = normName(a).split(" ").filter(Boolean), y = normName(b).split(" ").filter(Boolean);
  if (x.length < 2 || y.length < 2) return false;
  const [small, big] = x.length <= y.length ? [x, y] : [y, x];
  if (!small.every((w) => big.includes(w))) return false;
  // First names must agree, so "Ana Ortiz" is not taken for "Daniel Ana Ortiz".
  return small[0] === big[0];
}

/** Records something that identifies a case: an address, a phone, a receipt number, an A-Number, a person (name and
 *  date of birth) or a file already read. */
export function learn(firmId: string, caseId: string, kind: Kind, raw: string | null | undefined) {
  const value = kind === "email" ? normEmail(raw) : kind === "phone" ? normPhone(raw) : String(raw ?? "").trim();
  if (!value || (kind === "email" && !personalAddress(value))) return;
  db().prepare("INSERT OR IGNORE INTO case_keys (firm_id, case_id, kind, value, at) VALUES (?, ?, ?, ?, ?)").run(firmId, caseId, kind, value, new Date().toISOString());
}

/** Name and date of birth together: the person, whichever address or phone they write from. */
export const personKey = (name: string, dob: string) => (normName(name) && /^\d{4}-\d{2}-\d{2}$/.test(dob) ? `${normName(name)}|${dob}` : "");

/** Everything learned from a message filed to a case: the sender's address, receipt numbers and A-Numbers in it. */
export function learnFrom(firmId: string, caseId: string, m: { from?: string | null; text?: string; subject?: string }) {
  if (m.from && !firmAddress(firmId, normEmail(m.from))) learn(firmId, caseId, "email", m.from);
  const text = `${m.subject ?? ""}\n${m.text ?? ""}`;
  for (const r of receiptsIn(text)) learn(firmId, caseId, "receipt", r);
  for (const a of aNumbersIn(text)) learn(firmId, caseId, "anumber", a);
}

/** An address belonging to someone at the firm (their mail is an instruction, never a client's). */
export function firmAddress(firmId: string, email: string) {
  return Boolean(email) && Boolean(db().prepare("SELECT 1 FROM users WHERE firm_id = ? AND lower(email) = ?").get(firmId, email));
}

const casesFor = (firmId: string, kind: Kind, values: string[]) => {
  if (!values.length) return [] as string[];
  const marks = values.map(() => "?").join(", ");
  const rows = db().prepare(`SELECT DISTINCT k.case_id FROM case_keys k JOIN cases c ON c.id = k.case_id WHERE k.firm_id = ? AND k.kind = ? AND k.value IN (${marks})`).all(firmId, kind, ...values) as { case_id: string }[];
  return rows.map((r) => r.case_id);
};

/** Cases an address has written about or been written to from: recorded keys, the case's client address and every
 *  message filed with that address. */
function casesForEmail(firmId: string, email: string) {
  if (!email || !personalAddress(email)) return [] as string[];
  const d = db();
  const set = new Set(casesFor(firmId, "email", [email]));
  for (const r of d.prepare("SELECT id FROM cases WHERE firm_id = ? AND client_email IS NOT NULL AND lower(client_email) = ?").all(firmId, email) as { id: string }[]) set.add(r.id);
  for (const r of d.prepare("SELECT DISTINCT case_id FROM messages WHERE firm_id = ? AND case_id IS NOT NULL AND email IS NOT NULL AND lower(email) = ?").all(firmId, email) as { case_id: string }[]) set.add(r.case_id);
  return [...set];
}

/** Cases whose client has this name, among all of the firm's cases. */
export function casesForName(firmId: string, name: string) {
  if (normName(name).split(" ").length < 2) return [] as string[];
  const rows = db().prepare("SELECT id, client FROM cases WHERE firm_id = ?").all(firmId) as { id: string; client: string }[];
  return rows.filter((r) => sameName(r.client, name)).map((r) => r.id);
}

/** Works out which case a message, an upload or an instruction belongs to. */
export function route(firmId: string, m: { from?: string | null; fromName?: string | null; threadId?: string | null; subject?: string; text?: string; phone?: string | null; person?: string; names?: string[] }): Route {
  const d = db();
  const text = `${m.subject ?? ""}\n${m.text ?? ""}`;
  const related = new Set<string>();
  const one = (ids: string[], why: string) => { ids.forEach((x) => related.add(x)); return ids.length === 1 ? { caseId: ids[0], why } : null; };

  // Sure: the same thread, then numbers only one case has.
  let sure: Route["sure"] = null;
  if (m.threadId) {
    const ids = (d.prepare("SELECT DISTINCT case_id FROM messages WHERE firm_id = ? AND thread_id = ? AND case_id IS NOT NULL").all(firmId, m.threadId) as { case_id: string }[]).map((r) => r.case_id);
    sure = one(ids, "a reply in the same email thread");
  }
  const receipts = receiptsIn(text);
  if (receipts.length) {
    const marks = receipts.map(() => "?").join(", ");
    const ids = new Set([...casesFor(firmId, "receipt", receipts), ...(d.prepare(`SELECT id FROM cases WHERE firm_id = ? AND upper(replace(receipt, ' ', '')) IN (${marks})`).all(firmId, ...receipts) as { id: string }[]).map((r) => r.id)]);
    sure ??= one([...ids], "the USCIS receipt number");
  }
  const anums = aNumbersIn(text);
  sure ??= one(casesFor(firmId, "anumber", anums), "the A-Number");

  // Likely: who it is from.
  let likely: Route["likely"] = null;
  const email = normEmail(m.from);
  if (email && !firmAddress(firmId, email)) likely = one(casesForEmail(firmId, email), "the sender's address, already on the case");
  if (m.person) likely ??= one(casesFor(firmId, "person", [m.person]), "the same name and date of birth");
  const phone = normPhone(m.phone);
  if (phone) likely ??= one(casesFor(firmId, "phone", [phone]), "the same phone number");

  // Related: the same employer's address, and the client's name in the sender or the text.
  if (email && personalAddress(email) && !isFree(domainOf(email)) && !firmAddress(firmId, email)) {
    const dom = `%@${domainOf(email)}`;
    for (const r of d.prepare("SELECT DISTINCT case_id FROM case_keys WHERE firm_id = ? AND kind = 'email' AND value LIKE ? LIMIT 20").all(firmId, dom) as { case_id: string }[]) related.add(r.case_id);
  }
  for (const n of [m.fromName ?? "", ...(m.names ?? [])]) for (const id of casesForName(firmId, n)) related.add(id);
  // Names in the subject: one pass over the firm's clients (cheap even at thousands of cases).
  const subj = ` ${normName(m.subject)} `;
  if (subj.trim()) {
    for (const r of d.prepare("SELECT id, client FROM cases WHERE firm_id = ?").all(firmId) as { id: string; client: string }[]) {
      const n = normName(r.client);
      if (n.split(" ").length >= 2 && subj.includes(` ${n} `)) related.add(r.id);
    }
  }
  if (sure) related.delete(sure.caseId);
  if (likely) related.delete(likely.caseId);
  return { sure, likely, related: [...related].slice(0, 30) };
}

type Row = { id: string; ref: string; client: string; client_email: string | null; counterpart: string | null; type_code: string; stage: string; opened_at: string };

/** The cases to show the model when it decides where something goes: what routing found first, then the most recent,
 *  so a client from years ago is found as surely as one from last week. */
export function candidates(firmId: string, r: Route, recent = 120): Row[] {
  const d = db();
  const first = [r.sure?.caseId, r.likely?.caseId, ...r.related].filter(Boolean) as string[];
  const byId = (id: string) => d.prepare("SELECT id, ref, client, client_email, counterpart, type_code, stage, opened_at FROM cases WHERE firm_id = ? AND id = ?").get(firmId, id) as Row | undefined;
  const out: Row[] = first.map(byId).filter(Boolean) as Row[];
  const seen = new Set(out.map((c) => c.id));
  for (const c of d.prepare("SELECT id, ref, client, client_email, counterpart, type_code, stage, opened_at FROM cases WHERE firm_id = ? ORDER BY opened_at DESC LIMIT ?").all(firmId, recent) as Row[]) if (!seen.has(c.id)) out.push(c);
  return out;
}

/** Before a new case is opened: is this person already a client with this matter? Returns the case to add to, or the
 *  person's other cases (a new matter for an existing client), or cases with the same name only (possibly a different
 *  person, never merged by Lincoln on its own). */
export function existingClient(firmId: string, p: { name?: string | null; email?: string | null; phone?: string | null; dob?: string | null; anumber?: string | null; typeCode: string }) {
  const d = db();
  const email = normEmail(p.email);
  const strongIds = new Set<string>([
    ...(email && !firmAddress(firmId, email) ? casesForEmail(firmId, email) : []),
    ...casesFor(firmId, "phone", [normPhone(p.phone)].filter(Boolean)),
    ...casesFor(firmId, "anumber", [String(p.anumber ?? "").replace(/\D/g, "")].filter((x) => x.length >= 8).map((x) => x.padStart(9, "0"))),
    ...(p.name && p.dob ? casesFor(firmId, "person", [personKey(p.name, p.dob)].filter(Boolean)) : []),
  ]);
  const nameIds = p.name ? casesForName(firmId, p.name).filter((id) => !strongIds.has(id)) : [];
  const info = (id: string) => d.prepare("SELECT id, client, type_code, stage FROM cases WHERE firm_id = ? AND id = ?").get(firmId, id) as { id: string; client: string; type_code: string; stage: string } | undefined;
  const mine = [...strongIds].map(info).filter(Boolean) as { id: string; client: string; type_code: string; stage: string }[];
  // The same matter, still open: the work goes on in that case. A consultation or an unsorted intake becomes the matter.
  const open = (s: string) => !["Approved", "Denied", "Closed", "Decision"].includes(s);
  const general = (code: string) => ["OTHER", "CONSULTATION", "UNKNOWN", "UNSPECIFIED", "INTAKE", "CLIENT INTAKE"].includes(code.trim().toUpperCase());
  const sameMatter = mine.find((c) => open(c.stage) && (c.type_code === p.typeCode || general(c.type_code) || general(p.typeCode)));
  return { addTo: sameMatter?.id ?? null, sameClient: mine.filter((c) => c.id !== sameMatter?.id).map((c) => c.id), sameNameOnly: nameIds };
}

/** A possible duplicate is raised once, as a quiet issue on the newer case, for a person to look at. */
export function flagSameName(firmId: string, caseId: string, others: string[]) {
  const d = db();
  if (!others.length) return;
  const names = others.map((id) => d.prepare("SELECT client, type_code, ref FROM cases WHERE firm_id = ? AND id = ?").get(firmId, id) as { client: string; type_code: string; ref: string } | undefined).filter(Boolean) as { client: string; type_code: string; ref: string }[];
  if (!names.length) return;
  const list = names.map((n) => `${n.client} (${n.type_code}, ${n.ref})`).join("; ");
  d.prepare("INSERT INTO issues (id, firm_id, case_id, kind, severity, title, detail, sources, status, created_at) VALUES (?, ?, ?, 'review', 'low', 'Same name as another client', ?, '[]', 'open', ?)").run(uid(), firmId, caseId, `Possibly the same person as ${list}. Different contact details, so the cases were kept apart.`, new Date().toISOString());
}
