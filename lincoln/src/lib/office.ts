import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import ExcelJS from "exceljs";
import PptxGenJS from "pptxgenjs";
import type { LetterContent } from "./letter";
import { longDate } from "./format";
import { caseById, caseDates, cases, criteria, documents, issues, rfePoints } from "./queries";

// The files Lincoln hands to Word, Excel and PowerPoint, or to Docs, Sheets and Slides.

export async function draftDocx(dr: { title: string; content: string }) {
  const L = JSON.parse(dr.content) as LetterContent;
  const font = "Times New Roman";
  const children: Paragraph[] = [
    new Paragraph({ heading: HeadingLevel.TITLE, children: [new TextRun({ text: dr.title, font, size: 32, bold: true })] }),
    new Paragraph({ spacing: { after: 240 }, children: [new TextRun({ text: "[Attorney: draft prepared by Lincoln for review. Citations are to the client file by document and page. Notes in square brackets are to be removed before filing.]", font, size: 20, italics: true })] }),
  ];
  for (const sec of L.sections) {
    if (sec.heading) children.push(new Paragraph({ heading: HeadingLevel.HEADING_2, spacing: { before: 280, after: 80 }, children: [new TextRun({ text: sec.cite ? `${sec.heading}: ${sec.cite}` : sec.heading, font, size: 26, bold: true })] }));
    for (const p of sec.paras) {
      children.push(new Paragraph({
        spacing: { after: 160, line: 320 },
        children: p.flatMap((g) => g.k === "note"
          ? [new TextRun({ text: ` [Attorney: ${g.t.trim()}]`, font, size: 22, italics: true })]
          : g.t.split("\n").map((line, i) => new TextRun({ text: g.k === "fact" && g.doc ? `${line} (${g.doc}, client file p. ${g.page})` : line, font, size: 24, break: i > 0 ? 1 : 0 }))),
      }));
    }
  }
  return Buffer.from(await Packer.toBuffer(new Document({ sections: [{ children }] })));
}

function sheet(wb: ExcelJS.Workbook, name: string, header: string[], rows: (string | number | null)[][], widths: number[]) {
  const ws = wb.addWorksheet(name, { views: [{ state: "frozen", ySplit: 1 }] });
  ws.addRow(header).font = { bold: true };
  for (const r of rows) ws.addRow(r);
  widths.forEach((w, i) => (ws.getColumn(i + 1).width = w));
  ws.autoFilter = { from: { row: 1, column: 1 }, to: { row: 1, column: header.length } };
  return ws;
}

/** Every open case with its stage, status and next date. */
export async function casesXlsx(firmId: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Lincoln";
  sheet(wb, "Cases", ["Reference", "Client", "Petitioner", "Type", "Stage", "Awaiting", "Next date", "Date", "Status"],
    cases(firmId).map((c) => [c.ref, c.client, c.counterpart, `${c.type_code} ${c.type_name}`, c.stage, c.waiting_on, c.next_date_label, c.next_date, c.summary]), [12, 26, 24, 26, 12, 24, 20, 12, 70]);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** The exhibit index for one case: documents with pages, then issues and dates. */
export async function caseXlsx(firmId: string, caseId: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Lincoln";
  sheet(wb, "Documents", ["No.", "Document", "Pages", "Date", "Source", "Language", "Assessment", "Note"],
    documents(firmId, caseId).map((d) => [d.n, d.title, d.page_from ? (d.page_to && d.page_to !== d.page_from ? `${d.page_from} to ${d.page_to}` : String(d.page_from)) : null, d.doc_date, d.source, d.language, d.status, d.note]), [6, 44, 10, 12, 22, 12, 16, 60]);
  sheet(wb, "Issues", ["Issue", "Kind", "Severity", "Detail", "Pages", "Status", "Resolution"],
    issues(firmId, caseId).map((i) => [i.title, i.kind, i.severity, i.detail, (JSON.parse(i.sources) as number[]).join(", "), i.status, i.resolution]), [36, 10, 10, 70, 12, 10, 40]);
  sheet(wb, "Dates", ["Date", "Event", "Source"], caseDates(firmId, caseId).map((t) => [t.date, t.label, t.source]), [12, 40, 36]);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

const GRADE = ["Excluded", "In the file", "Relevant", "Supports the fact", "Meets the standard", "Approved by attorney"];
const STATUS: Record<string, string> = { claim: "Claim", more: "More evidence required", no: "Do not claim", met: "Met", partial: "Partial", missing: "Missing" };

/** The evidence grid: every requirement and every point an agency raised, one row per piece of evidence, with
 *  its document, page and grade, so a team can sort and filter it in Excel. */
export async function evidenceXlsx(firmId: string, caseId: string) {
  const wb = new ExcelJS.Workbook();
  wb.creator = "Lincoln";
  const docs = documents(firmId, caseId);
  const rows = (items: { label: string; cite: string; status: string; gap: string | null; ev: { doc: number; page: number; grade: number; note?: string }[] }[]) =>
    items.flatMap((k) => (k.ev.length ? k.ev : [null]).map((e) => [k.label, k.cite, STATUS[k.status] ?? k.status, e ? (docs.find((d) => d.n === e.doc)?.title ?? "") : "", e?.page ?? null, e ? GRADE[e.grade] ?? "" : "", e?.note ?? "", k.gap ?? ""]));
  const rfe = rfePoints(firmId, caseId);
  for (const notice of [...new Set(rfe.map((p) => p.notice))]) {
    const short = notice.replace("Request for Evidence", "RFE").replace("Notice of Intent to Deny", "NOID").replace("Notice of Intent to Revoke", "NOIR").replace(" of ", " ");
    sheet(wb, short.slice(0, 31).replace(/[\\/?*[\]:]/g, ""), ["Point", "No.", "Status", "Document", "Page", "Grade", "Shows", "Still needed"],
      rows(rfe.filter((p) => p.notice === notice).map((p) => ({ label: p.point, cite: String(p.n), status: p.status, gap: p.gap, ev: JSON.parse(p.evidence) }))), [60, 6, 12, 36, 7, 18, 40, 50]);
  }
  const crit = criteria(firmId, caseId);
  if (crit.length || !rfe.length) sheet(wb, "Requirements", ["Requirement", "Citation", "Status", "Document", "Page", "Grade", "Shows", "Gap"],
    rows(crit.map((k) => ({ label: k.name, cite: k.citation, status: k.recommendation, gap: k.weakness || null, ev: JSON.parse(k.evidence) }))), [40, 22, 18, 36, 7, 18, 40, 50]);
  return Buffer.from(await wb.xlsx.writeBuffer());
}

/** A short deck on one case for a team meeting or a client call, in Lincoln's own look. */
export async function caseDeck(firmId: string, caseId: string) {
  const c = caseById(firmId, caseId)!;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Lincoln";
  pptx.title = `${c.client}: case summary`;
  const ink = "000000", muted = "666666", faint = "A3A3A3", line = "E5E5E5", paper = "F5F5F5";
  const serif = "Georgia", sans = "Arial";
  let page = 0;
  // Every slide: paper background, the case in the footer, a page number.
  const slide = (heading?: string) => {
    const s = pptx.addSlide();
    s.background = { color: paper };
    page++;
    if (heading) {
      s.addText(heading, { x: 0.7, y: 0.5, w: 11.9, h: 0.7, fontFace: serif, fontSize: 28, color: ink });
      s.addShape(pptx.ShapeType.line, { x: 0.7, y: 1.3, w: 11.9, h: 0, line: { color: line, width: 1 } });
    }
    s.addText(`${c.client} · ${c.type_code}`, { x: 0.7, y: 7.0, w: 9, h: 0.3, fontFace: sans, fontSize: 9, color: faint });
    s.addText(String(page), { x: 11.6, y: 7.0, w: 1, h: 0.3, fontFace: sans, fontSize: 9, color: faint, align: "right" });
    return s;
  };
  type Row = PptxGenJS.TableRow;
  const rule: [PptxGenJS.BorderProps, PptxGenJS.BorderProps, PptxGenJS.BorderProps, PptxGenJS.BorderProps] = [{ type: "none" }, { type: "none" }, { pt: 0.75, color: line }, { type: "none" }];
  const cell = (text: string, o: PptxGenJS.TableCellProps = {}): PptxGenJS.TableCell => ({ text, options: { fontFace: sans, fontSize: 16, color: ink, valign: "top", margin: [6, 0, 6, 0], border: rule, ...o } });
  const table = (s: PptxGenJS.Slide, rows: Row[], colW: number[], y = 1.6) => s.addTable(rows, { x: 0.7, y, w: 11.9, colW, autoPage: false });
  const label = (t: string) => cell(t, { color: muted, fontSize: 14 });

  const s1 = slide();
  s1.addText(c.client, { x: 0.7, y: 2.5, w: 11.9, h: 1, fontFace: serif, fontSize: 44, color: ink });
  s1.addText(`${c.type_code} · ${c.type_name}${c.counterpart ? ` · ${c.counterpart}` : ""}`, { x: 0.7, y: 3.55, w: 11.9, h: 0.5, fontFace: sans, fontSize: 18, color: muted });
  s1.addText(`Case ${c.ref} · ${longDate(new Date().toISOString().slice(0, 10))}`, { x: 0.7, y: 4.1, w: 11.9, h: 0.4, fontFace: sans, fontSize: 13, color: faint });
  s1.addText("Prepared by Lincoln for attorney review. Not legal advice.", { x: 0.7, y: 6.55, w: 11.9, h: 0.3, fontFace: sans, fontSize: 10, color: faint });

  const s2 = slide("Status");
  table(s2, [[label("Stage"), cell(c.stage)], [label("Summary"), cell(c.summary || "None recorded.")], ...(c.waiting_on ? [[label("Awaiting"), cell(c.waiting_on)]] : [])], [2.4, 9.5]);

  const crit = criteria(firmId, caseId);
  if (crit.length) {
    const word: Record<string, string> = { claim: "Claim", more: "Needs more evidence", no: "Not claimed" };
    const s3 = slide("Criteria");
    table(s3, [[label("Criterion"), label("Recommendation")], ...crit.slice(0, 10).map((k) => [cell(k.name), cell(word[k.recommendation] ?? k.recommendation, { color: k.recommendation === "claim" ? ink : muted })])], [7.9, 4.0]);
  }

  // Open issues, four to a slide so each one stays readable.
  const open = issues(firmId, caseId).filter((i) => i.status === "open").slice(0, 12);
  for (let i = 0; i < open.length; i += 4) {
    const s = slide(open.length > 4 ? `Open issues (${Math.floor(i / 4) + 1} of ${Math.ceil(open.length / 4)})` : "Open issues");
    s.addText(open.slice(i, i + 4).flatMap((x, k) => [
      { text: x.title, options: { fontFace: sans, fontSize: 17, bold: true, color: ink, breakLine: true, paraSpaceBefore: k ? 16 : 0 } },
      { text: x.detail, options: { fontFace: sans, fontSize: 14, color: muted, breakLine: true } },
    ]), { x: 0.7, y: 1.6, w: 11.9, h: 5.2, valign: "top" });
  }
  if (!open.length) slide("Open issues").addText("None open.", { x: 0.7, y: 1.6, w: 11.9, h: 0.5, fontFace: sans, fontSize: 15, color: muted });

  const dates = caseDates(firmId, caseId).filter((t) => t.date >= new Date().toISOString().slice(0, 10)).slice(0, 10);
  if (dates.length) {
    const s5 = slide("Dates");
    table(s5, dates.map((t) => [cell(longDate(t.date), { color: muted }), cell(t.label)]), [3.4, 8.5]);
  }
  return Buffer.from((await pptx.write({ outputType: "nodebuffer" })) as ArrayBuffer);
}
