import { Document, HeadingLevel, Packer, Paragraph, TextRun } from "docx";
import ExcelJS from "exceljs";
import PptxGenJS from "pptxgenjs";
import type { LetterContent } from "./letter";
import { caseById, caseDates, cases, criteria, documents, issues } from "./queries";

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

/** A short deck on one case for a team meeting or a client call. */
export async function caseDeck(firmId: string, caseId: string) {
  const c = caseById(firmId, caseId)!;
  const pptx = new PptxGenJS();
  pptx.layout = "LAYOUT_WIDE";
  pptx.author = "Lincoln";
  const ink = "161614", muted = "6B6862";
  const title = (s: PptxGenJS.Slide, t: string) => s.addText(t, { x: 0.6, y: 0.4, w: 12, h: 0.7, fontFace: "Georgia", fontSize: 26, color: ink });
  const bullets = (s: PptxGenJS.Slide, items: string[]) => s.addText(items.length ? items.map((t) => ({ text: t, options: { bullet: true, breakLine: true } })) : [{ text: "None recorded.", options: {} }], { x: 0.6, y: 1.3, w: 12, h: 5.6, fontFace: "Arial", fontSize: 15, color: ink, valign: "top", paraSpaceAfter: 8 });

  const s1 = pptx.addSlide();
  s1.addText(c.client, { x: 0.6, y: 2.4, w: 12, h: 1, fontFace: "Georgia", fontSize: 40, color: ink });
  s1.addText(`${c.type_code} ${c.type_name}${c.counterpart ? ` · ${c.counterpart}` : ""} · ${c.ref}`, { x: 0.6, y: 3.4, w: 12, h: 0.5, fontFace: "Arial", fontSize: 16, color: muted });
  s1.addText("Prepared by Lincoln for attorney review. Not legal advice.", { x: 0.6, y: 6.6, w: 12, h: 0.4, fontFace: "Arial", fontSize: 11, color: muted });

  const s2 = pptx.addSlide();
  title(s2, "Status");
  bullets(s2, [`Stage: ${c.stage}`, c.summary, c.waiting_on ? `Awaiting: ${c.waiting_on}` : ""].filter(Boolean));

  const crit = criteria(firmId, caseId);
  if (crit.length) {
    const s3 = pptx.addSlide();
    title(s3, "Requirements and evidence");
    bullets(s3, crit.slice(0, 10).map((k) => `${k.name}: ${k.recommendation}`));
  }
  const s4 = pptx.addSlide();
  title(s4, "Open issues");
  bullets(s4, issues(firmId, caseId).filter((i) => i.status === "open").slice(0, 9).map((i) => `${i.title}. ${i.detail}`));
  const s5 = pptx.addSlide();
  title(s5, "Dates");
  bullets(s5, caseDates(firmId, caseId).filter((t) => t.date >= new Date().toISOString().slice(0, 10)).slice(0, 10).map((t) => `${t.date}: ${t.label}`));
  return Buffer.from((await pptx.write({ outputType: "nodebuffer" })) as ArrayBuffer);
}
