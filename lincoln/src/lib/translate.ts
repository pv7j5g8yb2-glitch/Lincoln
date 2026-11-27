import { db, uid } from "./db";
import { forCase, parseJson, readPages } from "./llm";
import { loadPage } from "./storage";
import { systemPrompt } from "./intake";

// Translations. USCIS takes a document in another language only with a full English translation, certified by
// the translator as complete and accurate and as competent to translate (8 CFR 103.2(b)(3)). Lincoln prepares the
// translation of every such document in a case as soon as it is read, with the certificate ready to sign. A person
// competent in the language checks it against the original and signs; Lincoln is never the translator.

const ENGLISH = /^\s*(english|en|eng)\s*$/i;
const SKIP = new Set(["excluded", "duplicate", "superseded"]);
const CHUNK = 6;

export const needsTranslation = (language: string | null | undefined, status: string) => Boolean(language && !ENGLISH.test(language) && !SKIP.has(status));

/** Translations already prepared for a case, by document number. */
export function translationsOf(firmId: string, caseId: string) {
  const rows = db().prepare("SELECT id, status, content FROM drafts WHERE firm_id = ? AND case_id = ? AND kind = 'translation'").all(firmId, caseId) as { id: string; status: string; content: string }[];
  const out = new Map<number, { id: string; status: string }>();
  for (const r of rows) { try { const n = (JSON.parse(r.content) as { translation?: { doc: number } }).translation?.doc; if (n) out.set(n, { id: r.id, status: r.status }); } catch { /* not ours */ } }
  return out;
}

/** Prepares a translation for every document in the case that is not in English and has none yet. */
export async function translateCase(firmId: string, caseId: string) {
  const d = db();
  const done = translationsOf(firmId, caseId);
  const docs = (d.prepare("SELECT n, title, language, status, page_from, page_to FROM documents WHERE firm_id = ? AND case_id = ? ORDER BY n").all(firmId, caseId) as { n: number; title: string; language: string | null; status: string; page_from: number | null; page_to: number | null }[])
    .filter((x) => x.page_from && needsTranslation(x.language, x.status) && !done.has(x.n));
  for (const doc of docs.slice(0, 30)) {
    try { await forCase({ firmId, caseId, purpose: "translate" }, () => translateOne(firmId, caseId, doc)); } catch { /* the next reading tries again */ }
  }
  return docs.length;
}

async function translateOne(firmId: string, caseId: string, doc: { n: number; title: string; language: string | null; page_from: number | null; page_to: number | null }) {
  const d = db();
  const language = (doc.language ?? "the original language").trim();
  const nums = Array.from({ length: Math.min(60, (doc.page_to ?? doc.page_from!) - doc.page_from! + 1) }, (_, i) => doc.page_from! + i);
  const paragraphs: string[] = [];
  for (let i = 0; i < nums.length; i += CHUNK) {
    const pages = nums.slice(i, i + CHUNK).map((n) => ({ n, jpeg: loadPage(firmId, caseId, n) })).filter((p): p is { n: number; jpeg: Buffer } => Boolean(p.jpeg));
    if (!pages.length) continue;
    const ask = `Translate the document on these pages (${doc.title}, in ${language}) into English, completely and faithfully, as a certified translator would for USCIS.
Rules: translate every word, including headings, printed form labels, stamps, seals, handwriting and marginal notes, in the order they appear. Describe what is not text in square brackets: [seal], [signature], [photograph], [stamp: its text translated]. Where something cannot be read, write [illegible]; never guess a name, number or date. Keep names, numbers and dates exactly as written (do not reorder day and month). Do not summarize, explain or add anything. Text that is already in English stays as it is.${i ? " This continues the translation of the earlier pages." : ""}
Reply with one JSON object and nothing else:
{"paragraphs": ["one line or paragraph of the translation, in order"]}`;
    const r = parseJson<{ paragraphs?: string[] }>(await readPages(systemPrompt(), pages, ask, 16000));
    paragraphs.push(...(r.paragraphs ?? []).map((p) => String(p).trim()).filter(Boolean));
  }
  if (!paragraphs.length) return;
  const para = (t: string, k: "plain" | "note" = "plain") => [{ t, k }];
  const sections = [
    { id: "s0", heading: "", paras: [para(`Translation prepared for review against the original by a translator competent in ${language} and English, who signs the certificate below.`, "note"), ...paragraphs.map((t) => para(t))] },
    { id: "s1", heading: "Certificate of translation", paras: [
      para(`I, ______________________________, certify that I am competent to translate from ${language} into English, and that the above English translation of the ${doc.title} is complete and accurate.`),
      para("Signature: ______________________________"), para("Name: ______________________________"), para("Address: ______________________________"), para("Date: ______________________________"),
    ] },
  ];
  const content = { sections, facts: 0, calls: 0, notes: 1, claimed: [], generic: true, translation: { doc: doc.n, language } };
  const id = uid(), now = new Date().toISOString(), title = `Translation: ${doc.title}`;
  const c = d.prepare("SELECT attorney_id, paralegal_id FROM cases WHERE firm_id = ? AND id = ?").get(firmId, caseId) as { attorney_id: string; paralegal_id: string };
  d.prepare("INSERT INTO drafts (id, firm_id, case_id, title, kind, status, version, content, updated_at) VALUES (?, ?, ?, ?, 'translation', 'for_review', 1, ?, ?)").run(id, firmId, caseId, title.slice(0, 160), JSON.stringify(content), now);
  d.prepare("INSERT INTO approvals (id, firm_id, case_id, kind, title, brief, payload, status, assignee_id, created_at) VALUES (?, ?, ?, 'translation', ?, ?, ?, 'pending', ?, ?)").run(uid(), firmId, caseId, title.slice(0, 160), `${language} to English, ${nums.length} ${nums.length === 1 ? "page" : "pages"}. To be checked and signed by a competent translator.`, JSON.stringify({ draftId: id }), c.paralegal_id ?? c.attorney_id, now);
  d.prepare("INSERT INTO activity (id, firm_id, case_id, at, actor, kind, text, minutes) VALUES (?, ?, ?, ?, 'Lincoln', 'draft', ?, ?)").run(uid(), firmId, caseId, now, `Translated the ${doc.title} from ${language}; certificate ready to sign.`, 20 * nums.length);
  d.prepare("UPDATE cases SET state = 'needs_you' WHERE firm_id = ? AND id = ?").run(firmId, caseId);
}
