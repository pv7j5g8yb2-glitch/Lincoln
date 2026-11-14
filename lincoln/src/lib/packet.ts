import fs from "node:fs";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";
import { db } from "./db";
import { fillPdf, hasTemplate, templatePath, titleOf } from "./forms";
import { loadPage } from "./storage";

// The filing packet: one PDF in the order an attorney files it. Cover letter, the filled forms,
// the letters, an exhibit index, then each exhibit behind its own tab page. Nothing is filed by Lincoln.

const W = 612, H = 792, M = 72;
const USABLE = new Set(["ok", "weak", "needs_translation"]);

type Doc = { n: number; title: string; page_from: number | null; page_to: number | null; status: string };
type Seg = { t: string };
type Content = { sections?: { heading?: string; paras?: (Seg & { k?: string })[][] }[] };

/** Open points left for the attorney in a letter: marked notes and "[Attorney: ...]" in its text. */
const notesIn = (c: Content) => (c.sections ?? []).flatMap((s) => s.paras ?? []).flat().reduce((n, g) => n + (g.k === "note" ? 1 : 0) + (g.t.match(/\[Attorney:/g) ?? []).length, 0);

export type PacketPlan = {
  forms: { code: string; title: string; answered: number; fields: number; ready: boolean }[];
  letters: { title: string; notes: number; status: string }[];
  exhibits: { n: number; title: string; pages: number }[];
  issues: string[];
};

/** What the packet will hold, and what still needs the attorney before it is filed. */
export function packetPlan(firmId: string, caseId: string): PacketPlan {
  const d = db();
  const forms = (d.prepare("SELECT code, title, status, fields, answers FROM forms WHERE firm_id = ? AND case_id = ? ORDER BY CASE code WHEN 'G-28' THEN 0 ELSE 1 END, rowid").all(firmId, caseId) as { code: string; title: string; status: string; fields: number; answers: string }[])
    .map((f) => ({ code: f.code, title: f.title, answered: (JSON.parse(f.answers) as unknown[]).length, fields: f.fields, ready: f.status === "ready" && hasTemplate(f.code) }));
  const letters = (d.prepare("SELECT title, status, content FROM drafts WHERE firm_id = ? AND case_id = ? AND status IN ('approved', 'for_review') ORDER BY updated_at").all(firmId, caseId) as { title: string; status: string; content: string }[])
    .map((x) => ({ title: x.title, status: x.status, notes: notesIn(JSON.parse(x.content) as Content) }));
  const exhibits = (d.prepare("SELECT n, title, page_from, page_to, status FROM documents WHERE firm_id = ? AND case_id = ? ORDER BY n").all(firmId, caseId) as Doc[])
    .filter((x) => USABLE.has(x.status) && x.page_from)
    .map((x, i) => ({ n: i + 1, title: x.title, pages: (x.page_to ?? x.page_from!) - x.page_from! + 1 }));
  const issues = (d.prepare("SELECT title FROM issues WHERE firm_id = ? AND case_id = ? AND status = 'open' AND severity = 'high'").all(firmId, caseId) as { title: string }[]).map((x) => x.title);
  return { forms, letters, exhibits, issues };
}

/** Text the standard PDF fonts cannot draw is replaced by its plain letter (ő becomes o), never dropped silently. */
function safe(font: PDFFont, s: string) {
  let out = "";
  for (const ch of s.replace(/\t/g, "    ")) {
    try { font.encodeText(ch); out += ch; } catch { out += ch.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^\x20-\x7e]/g, "?"); }
  }
  return out;
}

class Writer {
  page!: PDFPage;
  y = 0;
  constructor(private pdf: PDFDocument, private font: PDFFont, private bold: PDFFont) { this.newPage(); }
  newPage() { this.page = this.pdf.addPage([W, H]); this.y = H - M; }
  line(text: string, size = 11, opts: { bold?: boolean; gap?: number } = {}) {
    const f = opts.bold ? this.bold : this.font;
    const words = safe(f, text).split(/\s+/);
    let cur = "";
    const flush = () => {
      if (this.y < M + size) this.newPage();
      this.page.drawText(cur, { x: M, y: this.y, size, font: f, color: rgb(0.08, 0.08, 0.08) });
      this.y -= size * 1.45;
      cur = "";
    };
    for (const w of words) {
      const next = cur ? `${cur} ${w}` : w;
      if (f.widthOfTextAtSize(next, size) > W - 2 * M && cur) { flush(); cur = w; } else cur = next;
    }
    if (cur || !text) flush();
    this.y -= opts.gap ?? 0;
  }
  space(n = 10) { this.y -= n; }
}

const usDate = (d = new Date()) => d.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

export async function buildPacket(firmId: string, caseId: string): Promise<Uint8Array> {
  const d = db();
  const c = d.prepare("SELECT c.client, c.counterpart, c.type_code, c.type_name, f.name AS firm, f.address, f.phone, f.email, u.name AS attorney FROM cases c JOIN firms f ON f.id = c.firm_id LEFT JOIN users u ON u.id = c.attorney_id WHERE c.firm_id = ? AND c.id = ?").get(firmId, caseId) as { client: string; counterpart: string | null; type_code: string; type_name: string; firm: string; address: string | null; phone: string | null; email: string | null; attorney: string | null };
  const plan = packetPlan(firmId, caseId);
  const pdf = await PDFDocument.create();
  pdf.setTitle(`Filing packet: ${c.client} (${c.type_code})`);
  const font = await pdf.embedFont(StandardFonts.TimesRoman);
  const bold = await pdf.embedFont(StandardFonts.TimesRomanBold);

  // Cover letter
  const w = new Writer(pdf, font, bold);
  w.line(c.firm, 13, { bold: true });
  for (const l of [c.address, [c.phone, c.email].filter(Boolean).join("  |  ")].filter(Boolean)) w.line(l!, 10);
  w.space(24);
  w.line(usDate());
  w.space(14);
  w.line("U.S. Citizenship and Immigration Services");
  w.line("[Attorney: filing address for this form]");
  w.space(14);
  const main = plan.forms.find((f) => f.code !== "G-28");
  w.line(`Re: ${main ? `Form ${main.code}, ${titleOf(main.code)}` : c.type_name} (${c.type_code}) on behalf of ${c.client}${c.counterpart ? `, filed by ${c.counterpart}` : ""}`, 11, { bold: true });
  w.space(10);
  w.line("Dear Sir or Madam:", 11, { gap: 6 });
  w.line(`Please find enclosed the ${c.type_code} filing for ${c.client}. The enclosures are listed below.`, 11, { gap: 8 });
  let k = 1;
  for (const f of plan.forms.filter((x) => x.ready)) w.line(`${k++}. Form ${f.code}, ${f.title}`);
  for (const l of plan.letters) w.line(`${k++}. ${l.title}`);
  if (plan.exhibits.length) w.line(`${k++}. Exhibits 1 to ${plan.exhibits.length}, with an index`);
  w.space(12);
  w.line("Please contact our office with any questions about this filing.", 11, { gap: 14 });
  w.line("Sincerely,", 11, { gap: 30 });
  w.line(c.attorney ?? "[Attorney]");
  w.line(c.firm);

  // Forms, filled
  for (const f of plan.forms.filter((x) => x.ready)) {
    const row = d.prepare("SELECT answers FROM forms WHERE firm_id = ? AND case_id = ? AND code = ?").get(firmId, caseId, f.code) as { answers: string };
    const filled = await PDFDocument.load(await fillPdf(new Uint8Array(fs.readFileSync(templatePath(f.code))), JSON.parse(row.answers)));
    for (const p of await pdf.copyPages(filled, filled.getPageIndices())) pdf.addPage(p);
  }

  // Letters
  for (const x of d.prepare("SELECT title, content FROM drafts WHERE firm_id = ? AND case_id = ? AND status IN ('approved', 'for_review') ORDER BY updated_at").all(firmId, caseId) as { title: string; content: string }[]) {
    const lw = new Writer(pdf, font, bold);
    lw.line(x.title, 14, { bold: true, gap: 10 });
    for (const s of (JSON.parse(x.content) as Content).sections ?? []) {
      if (s.heading) lw.line(s.heading, 12, { bold: true, gap: 4 });
      for (const p of s.paras ?? []) lw.line(p.map((g) => (g.k === "note" ? ` [Attorney: ${g.t.trim()}]` : g.t)).join(""), 11, { gap: 8 });
    }
  }

  // Exhibit index and exhibits
  if (plan.exhibits.length) {
    const iw = new Writer(pdf, font, bold);
    iw.line("Index of Exhibits", 14, { bold: true, gap: 12 });
    for (const e of plan.exhibits) iw.line(`Exhibit ${e.n}. ${e.title} (${e.pages} ${e.pages === 1 ? "page" : "pages"})`, 11, { gap: 2 });
    const docs = (d.prepare("SELECT n, title, page_from, page_to, status FROM documents WHERE firm_id = ? AND case_id = ? ORDER BY n").all(firmId, caseId) as Doc[]).filter((x) => USABLE.has(x.status) && x.page_from);
    for (const [i, doc] of docs.entries()) {
      const tab = pdf.addPage([W, H]);
      const label = `Exhibit ${i + 1}`;
      tab.drawText(label, { x: (W - bold.widthOfTextAtSize(label, 30)) / 2, y: H / 2 + 20, size: 30, font: bold });
      const t = safe(font, doc.title);
      tab.drawText(t, { x: Math.max(M, (W - font.widthOfTextAtSize(t, 13)) / 2), y: H / 2 - 14, size: 13, font, maxWidth: W - 2 * M });
      for (let n = doc.page_from!; n <= (doc.page_to ?? doc.page_from!); n++) {
        const jpeg = loadPage(firmId, caseId, n);
        if (!jpeg) continue;
        const img = await pdf.embedJpg(jpeg);
        const scale = Math.min((W - 36) / img.width, (H - 36) / img.height);
        const pg = pdf.addPage([W, H]);
        pg.drawImage(img, { x: (W - img.width * scale) / 2, y: (H - img.height * scale) / 2, width: img.width * scale, height: img.height * scale });
      }
    }
  }
  return pdf.save();
}
