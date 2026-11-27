// One person and one matter is always one case. When Lincoln could not be sure two cases were the same person, it kept
// them apart; this is where they come together once it is sure (proof arrives, or the attorney says so), and where a
// family's cases, one per person, stay linked so nothing about one of them is filed to another.
import { db, uid } from "./db";
import { loadPage, pagesDir, savePage } from "./storage";
import fs from "node:fs";
import path from "node:path";
import { familyOf, flagSameName, sameName } from "./routing";

export type LinkKind = "family" | "same_person" | "different";
type Case = { id: string; firm_id: string; ref: string; client: string; type_code: string; type_name: string; family: string; stage: string; pages: number; processing: number; opened_at: string; client_email: string | null; receipt: string | null; counterpart: string | null; next_date: string | null; next_date_label: string | null; sensitive: number };

const now = () => new Date().toISOString();
const get = (firmId: string, id: string) => db().prepare("SELECT * FROM cases WHERE firm_id = ? AND id = ?").get(firmId, id) as Case | undefined;

/** Two cases tied together, both ways. "different" records that a person said they are not the same client, so the
 *  question is never asked again. */
export function link(firmId: string, a: string, b: string, kind: LinkKind) {
  if (!a || !b || a === b) return;
  const d = db();
  const ins = d.prepare("INSERT INTO case_links (firm_id, case_id, other_id, kind, at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(firm_id, case_id, other_id) DO UPDATE SET kind = excluded.kind");
  d.transaction(() => { ins.run(firmId, a, b, kind, now()); ins.run(firmId, b, a, kind, now()); })();
}

/** The cases linked to this one, with what ties them: the whole family (however it was linked), and the same client's
 *  other matters. */
export function linksOf(firmId: string, caseId: string) {
  const d = db();
  type L = { id: string; kind: LinkKind; client: string; type_code: string; ref: string; stage: string };
  const row = (id: string, kind: LinkKind) => d.prepare("SELECT id, ? AS kind, client, type_code, ref, stage, opened_at FROM cases WHERE firm_id = ? AND id = ?").get(kind, firmId, id) as (L & { opened_at: string }) | undefined;
  const fam = familyOf(firmId, caseId).filter((id) => id !== caseId).map((id) => row(id, "family"));
  const same = (d.prepare("SELECT other_id FROM case_links WHERE firm_id = ? AND case_id = ? AND kind = 'same_person'").all(firmId, caseId) as { other_id: string }[]).map((r) => row(r.other_id, "same_person"));
  return ([...fam, ...same].filter(Boolean) as (L & { opened_at: string })[]).sort((x, y) => x.opened_at.localeCompare(y.opened_at)).map(({ opened_at: _o, ...l }) => l as L);
}

export { familyOf };

export const markedDifferent = (firmId: string, a: string, b: string) => Boolean(db().prepare("SELECT 1 FROM case_links WHERE firm_id = ? AND case_id = ? AND other_id = ? AND kind = 'different'").get(firmId, a, b));

// Page numbers move by the pages already in the case kept: page fields, lists of pages, and the citations in written
// text, "(p. 4)" and "(pp. 3-5, 7)".
const CITE = /\((?:pp?\.|page)\s?\d[\d,\s\-–and]*\)/g;
export const shiftCites = (text: string, by: number) => by ? text.replace(CITE, (m) => m.replace(/\d+/g, (n) => String(Number(n) + by))) : text;
const PAGE_KEYS = new Set(["page", "pages", "page_from", "page_to"]);
function shiftPages(v: unknown, by: number, isPage: boolean): unknown {
  if (typeof v === "number") return isPage ? v + by : v;
  if (typeof v === "string") return shiftCites(v, by);
  if (Array.isArray(v)) return v.map((x) => shiftPages(x, by, isPage));
  if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).map(([k, x]) => [k, shiftPages(x, by, PAGE_KEYS.has(k))]));
  return v;
}
/** A stored JSON value with its page numbers moved. `pages` says the value itself is a list of pages. */
const shiftJson = (raw: string | null, by: number, pages = false) => {
  if (!raw || !by) return raw;
  try { return JSON.stringify(shiftPages(JSON.parse(raw), by, pages)); } catch { return shiftCites(raw, by); }
};

const GENERAL = ["OTHER", "CONSULTATION", "UNKNOWN", "UNSPECIFIED", "INTAKE", "CLIENT INTAKE"];
export const general = (code: string) => GENERAL.includes(code.trim().toUpperCase());
export const isOpen = (stage: string) => !["Approved", "Denied", "Closed", "Decision"].includes(stage);
/** The same matter: the same form, or one of them still a consultation or an unsorted intake. */
export const sameMatter = (a: { type_code: string }, b: { type_code: string }) => a.type_code === b.type_code || general(a.type_code) || general(b.type_code);
const REC: Record<string, number> = { claim: 3, more: 2, no: 1 };
const STR: Record<string, number> = { Strong: 3, Moderate: 2, Weak: 1 };

/**
 * Moves one case into the other: every page, document, piece of evidence, draft, email, date, issue, approval, form,
 * chat and identifier. The older case is kept, so its reference stays. Page numbers of the case moved in follow the
 * pages already there, and every citation to them is renumbered. Returns the case kept, or null when either case is
 * still reading files (Lincoln tries again once the reading is done).
 */
export function mergeCases(firmId: string, aId: string, bId: string, why: string, actor = "Lincoln") {
  const d = db();
  const a = get(firmId, aId), b = get(firmId, bId);
  if (!a || !b || a.id === b.id) return null;
  if (a.processing || b.processing || d.prepare("SELECT 1 FROM read_jobs WHERE case_id IN (?, ?)").get(a.id, b.id) || d.prepare("SELECT 1 FROM drafts WHERE case_id IN (?, ?) AND status = 'drafting'").get(a.id, b.id)) {
    d.prepare("INSERT INTO kv (firm_id, key, value) VALUES (?, ?, ?) ON CONFLICT(firm_id, key) DO UPDATE SET value = excluded.value").run(firmId, `merge:${[a.id, b.id].sort().join(":")}`, JSON.stringify({ a: a.id, b: b.id, why, actor }));
    return null;
  }
  const [keep, drop] = a.opened_at <= b.opened_at ? [a, b] : [b, a];
  const P = keep.pages;
  const N = (d.prepare("SELECT COALESCE(MAX(n), 0) AS n FROM documents WHERE firm_id = ? AND case_id = ?").get(firmId, keep.id) as { n: number }).n;

  // Files first, copied, so a stop half way loses nothing: the copies past the kept case's page count are ignored.
  for (let n = 1; n <= drop.pages; n++) {
    const page = loadPage(firmId, drop.id, n);
    if (page) savePage(firmId, keep.id, P + n, page);
  }
  const from = pagesDir(drop.id), to = pagesDir(keep.id);
  if (fs.existsSync(from)) for (const f of fs.readdirSync(from)) if (f.startsWith("redline-")) { fs.mkdirSync(to, { recursive: true, mode: 0o700 }); fs.copyFileSync(path.join(from, f), path.join(to, f)); }

  d.transaction(() => {
    const move = (table: string) => d.prepare(`UPDATE ${table} SET case_id = ? WHERE firm_id = ? AND case_id = ?`).run(keep.id, firmId, drop.id);
    d.prepare("UPDATE documents SET case_id = ?, n = n + ?, page_from = page_from + ?, page_to = page_to + ? WHERE firm_id = ? AND case_id = ?").run(keep.id, N, P, P, firmId, drop.id);
    for (const i of d.prepare("SELECT id, sources, detail FROM issues WHERE firm_id = ? AND case_id = ?").all(firmId, drop.id) as { id: string; sources: string | null; detail: string | null }[])
      d.prepare("UPDATE issues SET sources = ?, detail = ? WHERE id = ?").run(shiftJson(i.sources, P, true), i.detail ? i.detail.replace(/\bpp?\. (\d+)/g, (m, x) => m.replace(x, String(Number(x) + P))) : i.detail, i.id);
    for (const r of d.prepare("SELECT id, evidence FROM rfe_points WHERE firm_id = ? AND case_id = ?").all(firmId, drop.id) as { id: string; evidence: string }[]) d.prepare("UPDATE rfe_points SET evidence = ? WHERE id = ?").run(shiftJson(r.evidence, P), r.id);
    for (const r of d.prepare("SELECT id, content FROM drafts WHERE firm_id = ? AND case_id = ?").all(firmId, drop.id) as { id: string; content: string }[]) d.prepare("UPDATE drafts SET content = ? WHERE id = ?").run(shiftJson(r.content, P), r.id);
    // Evidence for the same requirement becomes one row, graded by the stronger of the two.
    const kept = d.prepare("SELECT id, name, recommendation, strength, evidence FROM criteria WHERE firm_id = ? AND case_id = ?").all(firmId, keep.id) as { id: string; name: string; recommendation: string; strength: string; evidence: string }[];
    let n = (d.prepare("SELECT COALESCE(MAX(n), 0) AS n FROM criteria WHERE firm_id = ? AND case_id = ?").get(firmId, keep.id) as { n: number }).n;
    for (const c of d.prepare("SELECT * FROM criteria WHERE firm_id = ? AND case_id = ?").all(firmId, drop.id) as { id: string; name: string; recommendation: string; strength: string; summary: string; weakness: string; evidence: string }[]) {
      const ev = shiftJson(c.evidence, P) ?? "[]";
      const same = kept.find((k) => k.name.trim().toLowerCase() === c.name.trim().toLowerCase());
      if (!same) { d.prepare("UPDATE criteria SET case_id = ?, n = ?, evidence = ? WHERE id = ?").run(keep.id, ++n, ev, c.id); continue; }
      const both = [...JSON.parse(same.evidence || "[]"), ...JSON.parse(ev)];
      const better = (REC[c.recommendation] ?? 0) > (REC[same.recommendation] ?? 0) || (STR[c.strength] ?? 0) > (STR[same.strength] ?? 0);
      d.prepare(`UPDATE criteria SET evidence = ?${better ? ", recommendation = ?, strength = ?, summary = ?, weakness = ?" : ""} WHERE id = ?`).run(...(better ? [JSON.stringify(both), c.recommendation, c.strength, c.summary, c.weakness, same.id] : [JSON.stringify(both), same.id]));
      d.prepare("DELETE FROM criteria WHERE id = ?").run(c.id);
    }
    for (const t of ["rfe_points", "issues", "dates", "activity", "approvals", "messages", "drafts", "forms", "redlines", "chat_threads", "usage", "intake_links", "intake_sessions"]) move(t);
    d.prepare("INSERT OR IGNORE INTO case_keys (firm_id, case_id, kind, value, at) SELECT firm_id, ?, kind, value, at FROM case_keys WHERE firm_id = ? AND case_id = ?").run(keep.id, firmId, drop.id);
    d.prepare("DELETE FROM case_keys WHERE firm_id = ? AND case_id = ?").run(firmId, drop.id);
    if (d.prepare("SELECT 1 FROM case_status WHERE case_id = ?").get(keep.id)) d.prepare("DELETE FROM case_status WHERE case_id = ?").run(drop.id);
    else d.prepare("UPDATE case_status SET case_id = ? WHERE case_id = ?").run(keep.id, drop.id);
    // Links follow the person; the two never link to each other.
    for (const l of d.prepare("SELECT other_id, kind FROM case_links WHERE firm_id = ? AND case_id = ? AND other_id != ?").all(firmId, drop.id, keep.id) as { other_id: string; kind: LinkKind }[]) {
      d.prepare("INSERT OR IGNORE INTO case_links (firm_id, case_id, other_id, kind, at) VALUES (?, ?, ?, ?, ?), (?, ?, ?, ?, ?)").run(firmId, keep.id, l.other_id, l.kind, now(), firmId, l.other_id, keep.id, l.kind, now());
    }
    d.prepare("DELETE FROM case_links WHERE firm_id = ? AND (case_id = ? OR other_id = ?)").run(firmId, drop.id, drop.id);
    // The question that led here is answered.
    d.prepare("UPDATE issues SET status = 'resolved', resolution = 'Merged.', resolved_at = ? WHERE firm_id = ? AND case_id = ? AND title = 'Same name as another client' AND status = 'open'").run(now(), firmId, keep.id);
    for (const q of d.prepare("SELECT id, case_id, payload FROM approvals WHERE firm_id = ? AND kind = 'same_person' AND status = 'pending'").all(firmId) as { id: string; case_id: string; payload: string }[]) {
      const other = (JSON.parse(q.payload) as { otherId?: string }).otherId;
      if (other !== drop.id && other !== keep.id) continue;
      if (q.case_id === keep.id) d.prepare("UPDATE approvals SET status = 'approved', decided_at = ? WHERE id = ?").run(now(), q.id);
      else d.prepare("UPDATE approvals SET payload = ? WHERE id = ?").run(q.payload.replace(`"otherId":"${drop.id}"`, `"otherId":"${keep.id}"`), q.id);
    }
    const better = general(keep.type_code) && !general(drop.type_code);
    d.prepare(`UPDATE cases SET pages = ?, client_email = COALESCE(client_email, ?), receipt = COALESCE(receipt, ?), counterpart = COALESCE(counterpart, ?), sensitive = MAX(sensitive, ?),
      next_date = CASE WHEN next_date IS NULL OR (? IS NOT NULL AND ? < next_date) THEN ? ELSE next_date END,
      next_date_label = CASE WHEN next_date IS NULL OR (? IS NOT NULL AND ? < next_date) THEN ? ELSE next_date_label END${better ? ", type_code = ?, type_name = ?, family = ?" : ""} WHERE firm_id = ? AND id = ?`)
      .run(P + drop.pages, drop.client_email, drop.receipt, drop.counterpart, drop.sensitive, drop.next_date, drop.next_date, drop.next_date, drop.next_date, drop.next_date, drop.next_date_label, ...(better ? [drop.type_code, drop.type_name, drop.family] : []), firmId, keep.id);
    d.prepare("DELETE FROM cases WHERE firm_id = ? AND id = ?").run(firmId, drop.id);
    d.prepare("INSERT INTO activity (id, firm_id, case_id, at, actor, kind, text, minutes) VALUES (?, ?, ?, ?, ?, 'file', ?, 0)").run(uid(), firmId, keep.id, now(), actor, `Merged with ${drop.ref}: ${why}.`);
    d.prepare("DELETE FROM kv WHERE firm_id = ? AND key = ?").run(firmId, `merge:${[a.id, b.id].sort().join(":")}`);
  })();
  fs.rmSync(from, { recursive: true, force: true });
  return keep.id;
}

/**
 * Places documents of one family member's case in another's: the pages are added after the pages already there and
 * each document is listed with its own number. A case still reading files gets them once the reading is done.
 */
export function copyDocuments(firmId: string, fromId: string, toId: string, ns: number[]) {
  const d = db();
  const to = get(firmId, toId), from = get(firmId, fromId);
  if (!to || !from || !ns.length) return;
  if (to.processing || d.prepare("SELECT 1 FROM read_jobs WHERE case_id = ?").get(to.id)) {
    const key = `share:${fromId}:${toId}`;
    const was = (d.prepare("SELECT value FROM kv WHERE firm_id = ? AND key = ?").get(firmId, key) as { value: string } | undefined)?.value;
    d.prepare("INSERT INTO kv (firm_id, key, value) VALUES (?, ?, ?) ON CONFLICT(firm_id, key) DO UPDATE SET value = excluded.value").run(firmId, key, JSON.stringify([...new Set([...(was ? JSON.parse(was) as number[] : []), ...ns])]));
    return;
  }
  const docs = d.prepare(`SELECT * FROM documents WHERE firm_id = ? AND case_id = ? AND n IN (${ns.map(() => "?").join(", ")}) ORDER BY n`).all(firmId, fromId, ...ns) as { title: string; kind: string; page_from: number | null; page_to: number | null; doc_date: string | null; source: string | null; language: string | null; is_scan: number; status: string; note: string | null }[];
  let pages = to.pages;
  let n = (d.prepare("SELECT COALESCE(MAX(n), 0) AS n FROM documents WHERE firm_id = ? AND case_id = ?").get(firmId, toId) as { n: number }).n;
  const added: string[] = [];
  for (const x of docs) {
    // The same document placed twice (a second email with it) is not added again.
    if (d.prepare("SELECT 1 FROM documents WHERE firm_id = ? AND case_id = ? AND title = ? AND COALESCE(doc_date, '') = COALESCE(?, '')").get(firmId, toId, x.title, x.doc_date)) continue;
    const start = pages + 1;
    for (let p = x.page_from ?? 0; x.page_from && p <= (x.page_to ?? x.page_from); p++) {
      const img = loadPage(firmId, fromId, p);
      if (img) savePage(firmId, toId, ++pages, img);
    }
    d.prepare("INSERT INTO documents (id, firm_id, case_id, n, title, kind, page_from, page_to, doc_date, source, language, is_scan, status, note, received_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)")
      .run(uid(), firmId, toId, ++n, x.title, x.kind, pages >= start ? start : null, pages >= start ? pages : null, x.doc_date, x.source, x.language, x.is_scan, x.status, x.note, now());
    added.push(x.title);
  }
  d.prepare("UPDATE cases SET pages = ? WHERE firm_id = ? AND id = ?").run(pages, firmId, toId);
  if (added.length) d.prepare("INSERT INTO activity (id, firm_id, case_id, at, actor, kind, text, minutes) VALUES (?, ?, ?, ?, 'Lincoln', 'file', ?, 0)").run(uid(), firmId, toId, now(), `Placed from ${from.client}'s case: ${added.join(", ")}.`.slice(0, 600));
}

/** Merges that waited for a reading to finish. Run by the background sweep. */
export function finishMerges() {
  for (const r of db().prepare("SELECT firm_id, key, value FROM kv WHERE key LIKE 'share:%'").all() as { firm_id: string; key: string; value: string }[]) {
    const [, from, to] = r.key.split(":");
    const c = get(r.firm_id, to);
    if (c && !c.processing) { db().prepare("DELETE FROM kv WHERE firm_id = ? AND key = ?").run(r.firm_id, r.key); try { copyDocuments(r.firm_id, from, to, JSON.parse(r.value)); } catch { /* the documents stay in the first case */ } }
    else if (!c) db().prepare("DELETE FROM kv WHERE firm_id = ? AND key = ?").run(r.firm_id, r.key);
  }
  for (const r of db().prepare("SELECT firm_id, value FROM kv WHERE key LIKE 'merge:%'").all() as { firm_id: string; value: string }[]) {
    // Not while either case is still being worked on (forms filled after a reading, a reply being written).
    const busy = (id: string) => db().prepare("SELECT 1 FROM activity WHERE case_id = ? AND at > ?").get(id, new Date(Date.now() - 120_000).toISOString());
    try { const m = JSON.parse(r.value) as { a: string; b: string; why: string; actor: string }; if (busy(m.a) || busy(m.b)) continue; if (!get(r.firm_id, m.a) || !get(r.firm_id, m.b)) db().prepare("DELETE FROM kv WHERE firm_id = ? AND value = ?").run(r.firm_id, r.value); else mergeCases(r.firm_id, m.a, m.b, m.why, m.actor); } catch { /* next round */ }
  }
}

/**
 * Called whenever something that identifies a person is learned on a case (an A-Number, a name with date of birth, a
 * receipt number). Another case with the same proof and the same name is the same person: the same matter is merged,
 * another matter is linked as the same client. Proof that is shared in families (an address, a phone) never merges.
 */
export function reconcile(firmId: string, caseId: string) {
  const d = db();
  const c = get(firmId, caseId);
  if (!c) return caseId;
  const hits = d.prepare(`SELECT DISTINCT o.case_id AS id, o.kind FROM case_keys k JOIN case_keys o ON o.firm_id = k.firm_id AND o.kind = k.kind AND o.value = k.value AND o.case_id != k.case_id
    WHERE k.firm_id = ? AND k.case_id = ? AND k.kind IN ('anumber', 'person', 'receipt')`).all(firmId, caseId) as { id: string; kind: string }[];
  let at = caseId;
  for (const h of hits) {
    const o = get(firmId, h.id);
    const here = get(firmId, at);
    if (!o || !here || markedDifferent(firmId, here.id, o.id)) continue;
    // The same proof and the same name: one person. A number with a different name is a relative's, mentioned in the
    // family's mail, and never merges anything.
    if (!sameName(here.client, o.client)) {
      // One A-Number is one person, so another name is probably the same person under a married or other name.
      if (h.kind === "anumber") flagSameName(firmId, here.id, [o.id], "Same A-Number, different name.");
      continue;
    }
    if (sameMatter(here, o) && isOpen(here.stage) && isOpen(o.stage)) {
      const why = h.kind === "receipt" ? "the same USCIS receipt number" : h.kind === "anumber" ? "the same A-Number" : "the same name and date of birth";
      at = mergeCases(firmId, here.id, o.id, why) ?? at;
    } else {
      link(firmId, here.id, o.id, "same_person");
    }
  }
  return at;
}
