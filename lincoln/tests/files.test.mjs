// File reading: run with npm test. Every file a firm or client sends is either read or named as not read, never dropped.
import assert from "node:assert";
import JSZip from "jszip";
import { fileKind, docxText, xlsxText, plainText, renderFiles, unreadable } from "../src/lib/pdf.ts";

const docx = async (body) => { const z = new JSZip(); z.file("[Content_Types].xml", "<Types/>"); z.file("word/document.xml", `<w:document xmlns:w="x"><w:body>${body}</w:body></w:document>`); return z.generateAsync({ type: "uint8array" }); };
const p = (t) => `<w:p><w:r><w:t>${t}</w:t></w:r></w:p>`;
const word = await docx(`${p("Consultation notes")}${p("Won the 2024 award &amp; judged papers")}<w:tbl><w:tr><w:tc>${p("Award")}</w:tc><w:tc>${p("Year")}</w:tc></w:tr></w:tbl>`);
assert.equal(fileKind(word), "docx");
const t = await docxText(word);
assert.ok(t.includes("Won the 2024 award & judged papers") && t.includes("Award | Year"), t);

const x = new JSZip();
x.file("xl/workbook.xml", `<workbook><sheets><sheet name="Payroll" sheetId="1"/></sheets></workbook>`);
x.file("xl/sharedStrings.xml", `<sst><si><t>Name</t></si><si><t>Maria</t></si></sst>`);
x.file("xl/worksheets/sheet1.xml", `<worksheet><sheetData><row><c t="s"><v>0</v></c><c><v>1</v></c></row><row><c t="s"><v>1</v></c><c><v>145000</v></c></row></sheetData></worksheet>`);
const xlsx = new Uint8Array(await x.generateAsync({ type: "uint8array" }));
assert.equal(fileKind(xlsx), "xlsx");
assert.ok((await xlsxText(xlsx)).includes("Sheet: Payroll\nName | 1\nMaria | 145000"));
const g = new JSZip();
g.file("xl/workbook.xml", `<workbook><sheets><sheet name="Gaps" sheetId="1"/></sheets></workbook>`);
g.file("xl/worksheets/sheet1.xml", `<worksheet><sheetData><row r="1"><c r="A1" t="inlineStr"><is><t>Name</t></is></c><c r="C1" t="inlineStr"><is><t>Salary</t></is></c></row></sheetData></worksheet>`);
assert.equal(await xlsxText(new Uint8Array(await g.generateAsync({ type: "uint8array" }))), "Sheet: Gaps\nName |  | Salary", "a blank column keeps the others in line");

const s = new JSZip(); s.file("a.docx", await docx(p("one"))); s.file("b.docx", await docx(p("two")));
assert.equal(fileKind(new Uint8Array(await s.generateAsync({ type: "uint8array", compression: "STORE" }))), "zip", "a stored zip of Word files is a zip");

const rtf = new TextEncoder().encode("{\\rtf1{\\fonttbl\\f0 Arial;}\\f0 Expert letter\\par Top of the field.\\par}");
assert.equal(fileKind(rtf), "text");
assert.equal(plainText(rtf), "Expert letter\nTop of the field.");
assert.equal(fileKind(new TextEncoder().encode("BEGIN:VCALENDAR\nEND:VCALENDAR")), null, "invites are not evidence");
const doc = new Uint8Array([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1, 0, 0]);
assert.deepEqual(unreadable([{ name: "letter.doc", data: doc }, { name: "invite.ics", data: doc }, { name: "cv.docx", data: word }]), ["letter.doc"]);

const z = new JSZip(); z.file("cv.docx", word); z.file("notes.txt", "three publications"); z.file("__MACOSX/._notes.txt", "x");
const inner = new JSZip(); inner.file("deep.txt", "nested"); z.file("more.zip", await inner.generateAsync({ type: "uint8array" }));
const pages = [];
const n = await renderFiles([new Uint8Array(await z.generateAsync({ type: "uint8array", compression: "DEFLATE" }))], (k, jpeg) => pages.push([k, jpeg.length]));
assert.equal(n, 2, "a zip's Word and text files are read; system files and a zip inside it are not");
assert.ok(pages.every(([, size]) => size > 2000));
console.log("all file reading tests passed");
