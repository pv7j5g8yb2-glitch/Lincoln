import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3-multiple-ciphers";
import JSZip from "jszip";
import { dataDir } from "./db";

// The law library: the Immigration and Nationality Act as codified in Title 8 of the US Code, all of 8 CFR, and the
// labor and consular rules immigration lawyers cite every day (20 CFR 655 and 656, 22 CFR 40 to 42). Taken only from
// the official publishers' own downloads: the Office of the Law Revision Counsel's XML release points and the eCFR
// API. Public law, no client data, so it lives in its own database next to the firm data, unencrypted, and is
// refreshed when a new release is published. Each passage keeps its exact citation and a link to the official text.

const UA = { "User-Agent": "Lincoln law library (uselincoln.com)" };
const USC_INDEX = "https://uscode.house.gov/download.html";
const USC_BASE = "https://uscode.house.gov/download/";
const ECFR = "https://www.ecfr.gov/api/versioner/v1";
export const CFR_PARTS: { title: number; part?: number }[] = [{ title: 8 }, { title: 20, part: 655 }, { title: 20, part: 656 }, { title: 22, part: 40 }, { title: 22, part: 41 }, { title: 22, part: 42 }];

// 3 (2026-11-22): CFR labels read italics and colons, so 214.2(h), 204.11 and 1208.18 are labelled right.
const SCHEMA = "3";
let handle: Database.Database | null = null;
function law() {
  if (handle) return handle;
  fs.mkdirSync(dataDir(), { recursive: true });
  const d = new Database(path.join(dataDir(), "law.db"));
  d.pragma("journal_mode = WAL");
  d.exec("CREATE TABLE IF NOT EXISTS meta (key TEXT PRIMARY KEY, value TEXT NOT NULL)");
  // A new layout starts the library again; the next sync fills it.
  if ((d.prepare("SELECT value FROM meta WHERE key = 'schema'").get() as { value: string } | undefined)?.value !== SCHEMA) {
    d.exec("DROP TABLE IF EXISTS law; DELETE FROM meta;");
    d.prepare("INSERT INTO meta (key, value) VALUES ('schema', ?)").run(SCHEMA);
  }
  d.exec("CREATE VIRTUAL TABLE IF NOT EXISTS law USING fts5(cite, alias, heading, text, source UNINDEXED, url UNINDEXED, version UNINDEXED, labels UNINDEXED, tokenize = 'porter unicode61')");
  return (handle = d);
}
const meta = (k: string) => (law().prepare("SELECT value FROM meta WHERE key = ?").get(k) as { value: string } | undefined)?.value ?? null;
const setMeta = (k: string, v: string) => law().prepare("INSERT OR REPLACE INTO meta (key, value) VALUES (?, ?)").run(k, v);

type Row = { cite: string; alias: string; heading: string; text: string; source: string; url: string; version: string; labels: string };

const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s: string) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e: string) => e[0] === "#" ? String.fromCodePoint(e[1] === "x" || e[1] === "X" ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10)) : ENT[e.toLowerCase()] ?? m);
// Inline markup (italics, links, dates) goes without a trace, so "(<I>1</I>)" stays "(1)"; block markup becomes a space.
const INLINE = /<\/?(?:I|E|B|SU|FR|AC|ref|date|i|b|inline|sup|sub|term|shortTitle|span)\b[^>]*>/g;
const plain = (xml: string) => decode(xml.replace(INLINE, "").replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").replace(/\s+([,.;:)])/g, "$1").replace(/\(\s+/g, "(").trim();

/** Passages of a section: a new one at each top level subdivision, or when one grows past about 3,500 characters. */
function chunk(parts: { label: string; level: number; text: string }[], max = 3500) {
  // Each passage records every provision in it, so a citation finds the passage that holds it.
  const out: { label: string; labels: string[]; text: string }[] = [];
  for (const p of parts) {
    if (!p.text) continue;
    const cur = out[out.length - 1];
    if (cur && (p.level > 1 || p.level === 0) && cur.text.length + p.text.length < max) { cur.text += `\n${p.text}`; if (p.label && !cur.labels.includes(p.label)) cur.labels.push(p.label); continue; }
    // A single subdivision longer than a passage is split at sentence ends, keeping its citation.
    let rest = p.text;
    while (rest.length > max * 1.4) {
      const cut = rest.lastIndexOf(". ", max);
      const at = cut > max / 2 ? cut + 1 : max;
      out.push({ label: p.label, labels: [p.label], text: rest.slice(0, at).trim() });
      rest = rest.slice(at).trim();
    }
    out.push({ label: p.label, labels: [p.label], text: rest });
  }
  return out;
}

/* Title 8 of the US Code, USLM XML from the Office of the Law Revision Counsel. */

export function parseUsc(xml: string, version: string): Row[] {
  const rows: Row[] = [];
  const starts = [...xml.matchAll(/<section\b[^>]*identifier="\/us\/usc\/t8\/s([^"/]+)"[^>]*>/g)];
  starts.forEach((m, i) => {
    const sec = m[1];
    let body = xml.slice(m.index!, i + 1 < starts.length ? starts[i + 1].index : xml.length);
    const end = body.lastIndexOf("</section>");
    if (end > 0) body = body.slice(0, end);
    const credit = plain(/<sourceCredit\b[^>]*>([\s\S]*?)<\/sourceCredit>/.exec(body)?.[1] ?? "");
    body = body.replace(/<notes\b[\s\S]*?<\/notes>/g, "").replace(/<note\b[\s\S]*?<\/note>/g, "").replace(/<ref class="footnoteRef"[\s\S]*?<\/ref>/g, "").replace(/<sourceCredit\b[\s\S]*?<\/sourceCredit>/g, "");
    const heading = plain(/<heading\b[^>]*>([\s\S]*?)<\/heading>/.exec(body)?.[1] ?? "");
    // The INA section the provision comes from, as its source credit gives it: "June 27, 1952, ch. 477, title II, ch. 2, § 212".
    const ina = /June 27, 1952, ch\. 477, title [IVX]+(?:, ch\. \d+)?, §\s*(\d+[A-Z]?)/.exec(credit)?.[1] ?? null;
    const marks = [...body.matchAll(new RegExp(`<(?:subsection|paragraph|subparagraph|clause|subclause|item|subitem)\\b[^>]*identifier="/us/usc/t8/s${sec.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/([^"]+)"`, "g"))];
    const parts: { label: string; level: number; text: string }[] = [];
    const head = body.slice(0, marks[0]?.index ?? body.length).replace(/<num\b[\s\S]*?<\/num>/, "").replace(/<heading\b[\s\S]*?<\/heading>/, "");
    parts.push({ label: "", level: 0, text: plain(head) });
    marks.forEach((k, j) => {
      const segs = k[1].split("/");
      parts.push({ label: segs.map((x) => `(${x})`).join(""), level: segs.length, text: plain(body.slice(k.index!, j + 1 < marks.length ? marks[j + 1].index : body.length)) });
    });
    const text = parts.map((p) => p.text).join(" ");
    if (/^(Repealed|Omitted|Transferred|Renumbered)/i.test(heading) || /^\[?(Repealed|Omitted|Transferred)/i.test(text) || text.length < 40) return;
    const url = `https://uscode.house.gov/view.xhtml?req=granuleid:USC-prelim-title8-section${sec}&num=0&edition=prelim`;
    for (const c of chunk(parts)) {
      rows.push({ cite: `8 U.S.C. § ${sec}${c.label}`, alias: ina ? `INA § ${ina}${c.label}` : "", heading, text: c.text, source: "INA", url, version, labels: c.labels.join(" ") });
    }
  });
  return rows;
}

async function syncUsc(force: boolean) {
  const page = await (await fetch(USC_INDEX, { headers: UA })).text();
  const href = /releasepoints\/[^"']*xml_usc08@[^"']+\.zip/.exec(page)?.[0];
  if (!href) throw new Error("Title 8 download not found");
  const release = /@([\w-]+)\.zip$/.exec(href)![1];
  if (!force && meta("usc") === release) return 0;
  const zip = await JSZip.loadAsync(Buffer.from(await (await fetch(USC_BASE + href, { headers: UA })).arrayBuffer()));
  const file = Object.values(zip.files).find((f) => f.name.endsWith(".xml"));
  if (!file) throw new Error("Title 8 XML not in the download");
  const rows = parseUsc(await file.async("string"), `Public Law ${release.replace(/not\d+$/, "")}`);
  if (rows.length < 300) throw new Error(`Title 8 parsed to only ${rows.length} passages`);
  replace("INA", rows);
  setMeta("usc", release);
  return rows.length;
}

/* The Code of Federal Regulations, from the eCFR API. */

const ROMAN = /^(?:x{0,3})(?:ix|iv|v?i{0,3})$/;
const romanValue = (s: string) => { const v: Record<string, number> = { i: 1, v: 5, x: 10, l: 50 }; let n = 0; for (let i = 0; i < s.length; i++) { const a = v[s[i]], b = v[s[i + 1]] ?? 0; n += a < b ? -a : a; } return n; };

type Lv = { lv: number; label: string };
const nextLetter = (s: string) => String.fromCharCode(s.charCodeAt(0) + 1);

/** The level of a CFR paragraph label, from the labels before it: (a) letters, (1) numbers, (i) roman, (A) capitals, then italic (1) and (i). */
function level(label: string, path: Lv[]): number {
  const at = (k: number) => path.find((p) => p.lv === k)?.label;
  const depth = path.length ? path[path.length - 1].lv : 0;
  if (/^\d+$/.test(label)) return depth >= 4 && (label === "1" || (at(5) && Number(label) === Number(at(5)) + 1)) ? 5 : 2;
  if (/^[A-Z]+$/.test(label)) return 4;
  if (ROMAN.test(label)) {
    if (depth >= 5 && ((label === "i" && !at(6)) || (at(6) && romanValue(label) === romanValue(at(6)!) + 1))) return 6;
    if (at(3) && romanValue(label) === romanValue(at(3)!) + 1) return 3;
    // A roman list starts again under each new number; an "(i)" after "(ii)" is the letter after "(h)".
    if (label === "i" && depth >= 2 && !at(3)) return 3;
    if (at(1) && nextLetter(at(1)!) === label) return 1;
    // Letters never skip, and double letters come only after (z), so a roman label that is not the next letter is a roman item.
    if (at(1) && at(1)!.length === 1) return 3;
    return depth >= 2 ? 3 : 1;
  }
  return 1;
}

/** The labels a paragraph opens with, including ones after a short heading: "(o) Aliens of extraordinary ability—(1) Classifications—(i) General." A heading may hold a citation or plural, "order(s)" or "1208.16(c)", but never a label after a space. */
function openingLabels(text: string) {
  const labels: string[] = [];
  let rest = text;
  let m = /^\(([a-zA-Z0-9]{1,5})\)\s*/.exec(rest);
  while (m) {
    labels.push(m[1]);
    rest = rest.slice(m[0].length);
    m = /^\(([a-zA-Z0-9]{1,5})\)\s*/.exec(rest) ?? /^(?:[^()]|(?<=[^\s(—])\([a-zA-Z0-9]{1,5}\)){1,140}?(?:—|\.\s)\s*\(([a-zA-Z0-9]{1,5})\)\s*/.exec(rest);
  }
  return labels;
}

export function parseCfr(xml: string, title: number, version: string): Row[] {
  const rows: Row[] = [];
  for (const m of xml.matchAll(/<DIV8\b[^>]*\bN="([^"]+)"[^>]*TYPE="SECTION"[^>]*>([\s\S]*?)<\/DIV8>/g)) {
    const sec = m[1].replace(/^§\s*/, "");
    const head = plain(/<HEAD>([\s\S]*?)<\/HEAD>/.exec(m[2])?.[1] ?? "");
    const heading = head.replace(/^§+\s*[\d.a-zA-Z-]+\s*/, "").replace(/\.$/, "");
    if (/\[Reserved\]/i.test(head)) continue;
    const parts: { label: string; level: number; text: string }[] = [];
    let path: Lv[] = [];
    for (const p of m[2].matchAll(/<(P|FP)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
      const text = plain(p[2]);
      if (!text) continue;
      const prev = parts[parts.length - 1]?.text ?? "";
      const labels = openingLabels(text);
      // The eCFR sets the two deepest levels in italics, "(<I>1</I>)" and "(<I>i</I>)", so an italic label is never a letter.
      const italic = /^\s*\(<I>([a-z0-9]+)<\/I>\)/.exec(p[2])?.[1];
      let first = 0;
      labels.forEach((l, k) => {
        let lv = k === 0 && italic === l ? (/^\d+$/.test(l) ? 5 : 6) : level(l, path);
        // Under a roman item come capitals, never numbers: "(i) Outstanding professors. (1)" is the letter after (h).
        if (!(k === 0 && italic === l) && (lv === 3 || lv === 6) && /^\d+$/.test(labels[k + 1] ?? "")) lv = 1;
        // After a line ending in a colon comes a list, never the next lettered paragraph: "...must show that: (i) Is admissible;".
        else if (k === 0 && lv === 1 && l === "i" && /[:\u2014]\s*$/.test(prev)) lv = path.length && path[path.length - 1].lv >= 4 ? 6 : 3;
        if (k === 0) first = lv;
        path = [...path.filter((x) => x.lv < lv), { lv, label: l }];
      });
      parts.push({ label: labels.length ? path.map((x) => `(${x.label})`).join("") : (parts[parts.length - 1]?.label ?? ""), level: labels.length ? first : 2, text });
    }
    if (!parts.length) continue;
    const url = `https://www.ecfr.gov/current/title-${title}/section-${sec}`;
    for (const c of chunk(parts)) rows.push({ cite: `${title} CFR ${sec}${c.label}`, alias: "", heading, text: c.text, source: `${title} CFR`, url, version, labels: c.labels.join(" ") });
  }
  return rows;
}

async function syncCfr(force: boolean) {
  const titles = (await (await fetch(`${ECFR}/titles.json`, { headers: UA })).json()) as { titles: { number: number; up_to_date_as_of: string }[] };
  let n = 0;
  for (const t of [...new Set(CFR_PARTS.map((x) => x.title))]) {
    const date = titles.titles.find((x) => x.number === t)?.up_to_date_as_of;
    if (!date) continue;
    if (!force && meta(`cfr${t}`) === date) continue;
    const rows: Row[] = [];
    for (const target of CFR_PARTS.filter((x) => x.title === t)) {
      const res = await fetch(`${ECFR}/full/${date}/title-${t}.xml${target.part ? `?part=${target.part}` : ""}`, { headers: { ...UA, "Accept-Encoding": "gzip" } });
      if (!res.ok) throw new Error(`eCFR replied ${res.status} for title ${t}${target.part ? ` part ${target.part}` : ""}`);
      rows.push(...parseCfr(await res.text(), t, `eCFR, current as of ${date}`));
    }
    if (rows.length < (t === 8 ? 800 : 20)) throw new Error(`${t} CFR parsed to only ${rows.length} passages`);
    replace(`${t} CFR`, rows);
    setMeta(`cfr${t}`, date);
    n += rows.length;
  }
  return n;
}

function replace(source: string, rows: Row[]) {
  const d = law();
  d.transaction(() => {
    d.prepare("DELETE FROM law WHERE source = ?").run(source);
    const ins = d.prepare("INSERT INTO law (cite, alias, heading, text, source, url, version, labels) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
    for (const r of rows) ins.run(r.cite, r.alias, r.heading, r.text, r.source, r.url, r.version, r.labels);
  })();
}

/** Brings the library up to date with the latest official releases. Sources already current are not downloaded. */
export async function syncLaw(force = false) {
  const errors: string[] = [];
  let added = 0;
  for (const [name, run] of [["US Code", syncUsc], ["CFR", syncCfr]] as const) {
    try { added += await run(force); } catch (e) { errors.push(`${name}: ${e instanceof Error ? e.message : "failed"}`); }
  }
  setMeta("checked", new Date().toISOString());
  if (errors.length) { setMeta("error", errors.join("; ").slice(0, 300)); console.error("Law library:", errors.join("; ")); } else law().prepare("DELETE FROM meta WHERE key = 'error'").run();
  return { added, errors };
}

export function lawStatus() {
  const counts = law().prepare("SELECT source, COUNT(*) AS n, MAX(version) AS version FROM law GROUP BY source ORDER BY source").all() as { source: string; n: number; version: string }[];
  return { counts, checked: meta("checked"), error: meta("error") };
}

/* Search. */

export type Hit = Row & { snippet: string };
const STOP = new Set("a an and are as at be by for from has have in is it of on or that the this to under what when where which who with does do can may must shall".split(" "));

/** Passages by citation, when the query is one: "8 CFR 214.2(o)(3)", "INA 212(a)(9)(B)", "8 USC 1182(h)". */
function byCite(q: string, limit: number): Hit[] | null {
  const norm = q.replace(/\s+/g, " ").trim();
  let base: string, sub: string, ina = false;
  let m: RegExpExecArray | null;
  if ((m = /^(\d+)\s*C\.?\s?F\.?\s?R\.?\s*(?:§+\s*|part\s+)?(\d+(?:\.\d+[a-z]?)?)\s*((?:\([a-zA-Z0-9]+\))*)$/i.exec(norm))) { base = `${m[1]} CFR ${m[2]}`; sub = m[3]; }
  else if ((m = /^8\s*U\.?\s?S\.?\s?C\.?\s*(?:§+\s*)?(\d+[a-z]*(?:-\d+)?)\s*((?:\([a-zA-Z0-9]+\))*)$/i.exec(norm))) { base = `8 U.S.C. § ${m[1]}`; sub = m[2]; }
  else if ((m = /^(?:INA|section|sec\.?)\s*(?:§+\s*)?(\d+[A-Z]?)\s*((?:\([a-zA-Z0-9]+\))*)$/i.exec(norm))) { base = `INA § ${m[1].toUpperCase()}`; sub = m[2]; ina = true; }
  else return null;
  const column = ina ? "alias" : "cite";
  const whole = /^\d+ CFR \d+$/.test(base); // a whole part: 8 CFR 214
  const rows = law().prepare(`SELECT cite, alias, heading, text, source, url, version, labels FROM law WHERE ${column} = ? OR ${column} LIKE ? ORDER BY rowid LIMIT 2000`).all(base, whole ? `${base}.%` : `${base}(%`) as Row[];
  if (!rows.length) return [];
  const has = (r: Row, f: (l: string) => boolean) => r.labels.split(" ").some(f);
  const picked = sub
    ? rows.filter((r) => has(r, (l) => l === sub || l.startsWith(sub)))
    : rows;
  // When the exact provision is not a passage of its own (a quoted list, a table), its nearest parent stands in.
  const out = picked.length ? picked : (() => { let s2 = sub; while (s2) { s2 = s2.replace(/\([^()]+\)$/, ""); const hit = rows.filter((r) => has(r, (l) => l === s2)); if (hit.length) return hit; } return rows; })();
  const strip = (c: string) => c.replace(/(?:\([^()]+\))+$/, "");
  const cut = (t: string) => (t.length > 280 ? `${t.slice(0, 280).replace(/\s+\S*$/, "")} …` : t);
  return out.slice(0, limit).map((r) => {
    if (!sub || !r.labels.split(" ").includes(sub)) return { ...r, snippet: cut(r.text) };
    // The passage holds the provision asked for: it is named by that citation, and the excerpt starts there.
    const last = /\([^()]+\)$/.exec(sub)![0];
    const at = Math.max(0, r.text.indexOf(last));
    return { ...r, cite: strip(r.cite) + sub, alias: r.alias ? strip(r.alias) + sub : "", snippet: cut(r.text.slice(at)) };
  });
}

export function searchLaw(query: string, limit = 8): Hit[] {
  const q = query.trim().slice(0, 300);
  if (!q) return [];
  const cited = byCite(q, limit);
  if (cited) return cited;
  const words = (q.toLowerCase().match(/[a-z0-9]+(?:-[a-z0-9]+)?/g) ?? []).filter((w) => !STOP.has(w)).slice(0, 12);
  if (!words.length) return [];
  const run = (expr: string) => law().prepare(`SELECT cite, alias, heading, text, source, url, version, snippet(law, 3, char(2), char(3), ' … ', 28) AS snippet
    FROM law WHERE law MATCH ? ORDER BY bm25(law, 4.0, 4.0, 6.0, 1.0) LIMIT ?`).all(expr, limit) as Hit[];
  const quoted = words.map((w) => `"${w.replace(/"/g, "")}"`);
  try {
    const all = run(quoted.join(" "));
    return all.length >= Math.min(3, limit) ? all : [...all, ...run(quoted.join(" OR ")).filter((h) => !all.some((a) => a.cite === h.cite))].slice(0, limit);
  } catch { return []; }
}

/** Search results as text for the model, each with its exact citation. */
export function lawForModel(query: string) {
  const hits = searchLaw(query, 6);
  if (!hits.length) return "Nothing in the library matches. The library holds the INA (8 U.S.C.), 8 CFR, 20 CFR 655 and 656, and 22 CFR 40 to 42.";
  return hits.map((h) => `${h.cite}${h.alias ? ` (${h.alias})` : ""}: ${h.heading} [${h.version}; ${h.url}]\n${h.text.slice(0, 3000)}`).join("\n\n---\n\n");
}

/** Whether a citation exists in the current official text: "ok", "missing" (no such section or subdivision), or
 *  null when it is outside what the library holds. */
export function checkCite(cite: string): "ok" | "missing" | null {
  const c = cite.replace(/\s+/g, " ").trim();
  const cfr = /^(\d+) C\.?\s?F\.?\s?R\.? (\d+)\.\d+/i.exec(c);
  if (cfr && !CFR_PARTS.some((p) => p.title === Number(cfr[1]) && (!p.part || p.part === Number(cfr[2])))) return null;
  if (!cfr && !/^(INA|8 U\.?\s?S\.?\s?C)/i.test(c)) return null;
  if (!lawStatus().counts.length) return null;
  const sub = /((?:\([a-zA-Z0-9]+\))*)$/.exec(c)?.[1] ?? "";
  const hits = byCite(c, 1) ?? [];
  if (!hits.length) return "missing";
  if (sub && !hits[0].labels.split(" ").some((l) => l === sub || l.startsWith(sub))) return "missing";
  return "ok";
}

const CITATION = /\b\d+\s*C\.?\s?F\.?\s?R\.?\s*§*\s*\d+\.\d+[a-z]?(?:\([a-zA-Z0-9]+\))*|\bINA\s*(?:§+|section|sec\.)?\s*\d+[A-Z]?(?:\([a-zA-Z0-9]+\))*|\b8\s*U\.?\s?S\.?\s?C\.?\s*§*\s*\d+[a-z]*(?:\([a-zA-Z0-9]+\))*/g;
const tidy = (c: string) => c.replace(/\s+/g, " ").replace(/§\s*/g, "").replace(/\b(section|sec\.)\s*/i, "").trim();

/** Citations written in free text: "8 CFR 214.2(o)(3)(iii)", "INA § 212(a)(9)(B)", "8 U.S.C. 1182(h)". */
export function citationsIn(text: string) {
  return [...new Set((text.match(CITATION) ?? []).map(tidy))];
}

/** Each citation as written (to find it in a document) and as read. */
export function citationMatches(text: string) {
  return [...new Map((text.match(CITATION) ?? []).map((raw) => [raw, { raw, cite: tidy(raw) }])).values()];
}

/** The official text of each provision cited, for a draft to quote and cite exactly. Empty when the library is not loaded. */
/** Where the cited provision starts in its passage, so "INA 212(a)(9)(B)" opens at (9)(B), not at the (8)(B) before it. */
function startOf(hit: Hit, cite: string) {
  const sub = /((?:\([a-zA-Z0-9]+\))*)$/.exec(cite.replace(/\s+/g, ""))?.[1] ?? "";
  if (!sub || !hit.labels.split(" ").includes(sub)) return 0;
  // The passage may begin below the top of the citation, so take the longest tail of it whose labels all appear in order.
  const segs = sub.match(/\([^()]+\)/g) ?? [];
  for (let from = 0; from < segs.length; from++) {
    let pos = 0, found = true;
    for (const seg of segs.slice(from)) {
      const re = new RegExp(`(?:^|\\n|—\\s*|\\.\\s)${seg.replace(/[()]/g, "\\$&")}`, "g");
      re.lastIndex = pos;
      const m = re.exec(hit.text);
      if (!m) { found = false; break; }
      pos = m.index + m[0].indexOf("(");
    }
    if (found) return pos;
  }
  return 0;
}

export function lawText(cites: string[], max = 16000) {
  const seen = new Set<string>();
  const parts: string[] = [];
  let size = 0;
  for (const c of cites) {
    let hit: Hit | undefined;
    try { hit = byCite(c, 1)?.[0]; } catch { hit = undefined; }
    if (!hit) continue;
    const key = `${hit.url}#${hit.labels.split(" ")[0]}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const block = `${hit.cite}${hit.alias ? ` (${hit.alias})` : ""}, ${hit.heading} [${hit.version}]\n${hit.text.slice(startOf(hit, c))}`;
    // A passage that does not fit is skipped, so shorter ones after it still get in.
    if (size + block.length > max) continue;
    parts.push(block); size += block.length;
  }
  return parts.join("\n\n---\n\n");
}
