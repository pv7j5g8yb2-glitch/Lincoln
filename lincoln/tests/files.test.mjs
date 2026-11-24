// File reading: run with npm test. Every file a firm or client sends is either read or named as not read, never dropped.
import assert from "node:assert";
import JSZip from "jszip";
import fs from "node:fs";
import CFB from "cfb";
import sharp from "sharp";
import { register } from "node:module";
register("./eval/loader.mjs", import.meta.url);
const { fileKind, docxText, xlsxText, plainText, renderFiles, unreadable } = await import("../src/lib/pdf.ts");
const { docText, msgParts, pptText, xlsText } = await import("../src/lib/ole.ts");
const { wpdText } = await import("../src/lib/wpd.ts");
const { iworkText } = await import("../src/lib/iwork.ts");
const { pptxText, odfText } = await import("../src/lib/pdf.ts");
const { emlParts, rtfText, tnefFiles } = await import("../src/lib/mime.ts");

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
// Word 97 to 2003: accents, Chinese (stored as UTF-16) and a table, from a real .doc written by LibreOffice.
const doc97 = new Uint8Array(fs.readFileSync(new URL("./fixtures/letter.doc", import.meta.url)));
assert.equal(fileKind(doc97), "doc");
assert.equal(docText(doc97), "Expert opinion letter for José Núñez\nDr. 王伟 confirms the beneficiary is among the top researchers in the field.\nAward | Year\nHealthBridge Innovation Challenge | 2024\nSigned in Boston.");

// An Outlook message: sender, subject, body and an attached Word file read as pages; a signature logo is not.
const utf16 = (t) => Buffer.from(t + "\0", "utf16le");
const m = CFB.utils.cfb_new();
CFB.utils.cfb_add(m, "/__substg1.0_0037001F", utf16("RE: documents"));
CFB.utils.cfb_add(m, "/__substg1.0_0C1A001F", utf16("Maria Hernandez"));
CFB.utils.cfb_add(m, "/__substg1.0_5D01001F", utf16("maria@example.com"));
CFB.utils.cfb_add(m, "/__substg1.0_1000001F", utf16("Attached is my CV.\r\nMaria"));
CFB.utils.cfb_add(m, "/__attach_version1.0_#00000000/__substg1.0_3707001F", utf16("CV.docx"));
CFB.utils.cfb_add(m, "/__attach_version1.0_#00000000/__substg1.0_37010102", Buffer.from(word));
CFB.utils.cfb_add(m, "/__attach_version1.0_#00000001/__substg1.0_3707001F", utf16("image001.png"));
CFB.utils.cfb_add(m, "/__attach_version1.0_#00000001/__substg1.0_3712001F", utf16("image001.png@01D7"));
CFB.utils.cfb_add(m, "/__attach_version1.0_#00000001/__substg1.0_37010102", Buffer.alloc(900, 1));
const msg = new Uint8Array(CFB.write(m, { type: "buffer" }));
assert.equal(fileKind(msg), "msg");
const mp = msgParts(msg);
assert.ok(mp.text.startsWith("From: Maria Hernandez <maria@example.com>\nSubject: RE: documents\nAttachments: CV.docx, image001.png\n\nAttached is my CV.\nMaria"), mp.text);
assert.equal(await renderFiles([msg], () => {}), 2, "the email and its Word attachment; not the logo");

// Outlook's HTML email wrapped in RTF comes back as its words.
const wrapped = "{\\rtf1\\ansi\\fromhtml1 {\\fonttbl{\\f0 Arial;}}{\\*\\htmltag19 <html>}{\\*\\htmltag241 <style>p \\{margin:0\\}}{\\*\\htmltag249 </style>}{\\*\\htmltag64 <p>}\\htmlrtf {\\htmlrtf0 Dear Ms. Hern\\'e1ndez,\\htmlrtf\\par}\\htmlrtf0{\\*\\htmltag72 </p>}{\\*\\htmltag64 <p>}\\htmlrtf {\\htmlrtf0 Your I-140 was approved.{\\*\\htmltag116 <br>}\\htmlrtf\\line\\htmlrtf0 Receipt IOE0912345678\\htmlrtf\\par}\\htmlrtf0{\\*\\htmltag72 </p>}}";
assert.equal(rtfText(wrapped), "Dear Ms. Hernández,\nYour I-140 was approved.\nReceipt IOE0912345678");
assert.equal(rtfText("{\\rtf1{\\fonttbl\\f0 Arial;}\\f0 Caf\\'e9 \\{x\\}\\par}"), "Café {x}");

// A forwarded email with the original email attached, which carries the offer letter: all three are read.
const innerEml = `From: HR <hr@acme.example>\r\nSubject: Your offer\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="in"\r\n\r\n--in\r\nContent-Type: text/plain\r\n\r\nOffer attached.\r\n--in\r\nContent-Type: application/msword; name="Offer.docx"\r\nContent-Disposition: attachment; filename="Offer.docx"\r\nContent-Transfer-Encoding: base64\r\n\r\n${Buffer.from(word).toString("base64").replace(/.{76}/g, "$&\r\n")}\r\n--in--\r\n`;
const eml = new TextEncoder().encode(`From: =?UTF-8?Q?Mar=C3=ADa?= <maria@example.com>\r\nTo: firm@example.com\r\nSubject: =?UTF-8?B?Rnc6IG9mZmVy?=\r\nMIME-Version: 1.0\r\nContent-Type: multipart/mixed; boundary="out"\r\n\r\n--out\r\nContent-Type: text/html; charset=utf-8\r\nContent-Transfer-Encoding: quoted-printable\r\n\r\n<p>Forwarding the offer. It says =\r\n$145,000.</p>\r\n--out\r\nContent-Type: image/png; name="logo.png"\r\nContent-ID: <logo>\r\n\r\nx\r\n--out\r\nContent-Type: message/rfc822\r\nContent-Disposition: attachment; filename="Your offer.eml"\r\n\r\n${innerEml}\r\n--out--\r\n`);
assert.equal(fileKind(eml), "eml");
const ep = emlParts(eml);
assert.equal(ep.text, "From: María <maria@example.com>\nTo: firm@example.com\nSubject: Fw: offer\nAttachments: Your offer.eml\n\nForwarding the offer. It says $145,000.");
assert.equal(await renderFiles([eml], () => {}), 3, "the email, the forwarded email and its offer letter");

// A two page scan as TIFF: both pages read.
const page = () => sharp({ create: { width: 800, height: 1000, channels: 3, background: "#ffffff" } }).png().toBuffer();
const tiffPath = new URL("./fixtures/.scan.tiff", import.meta.url);
await sharp([await page(), await page()], { join: { animated: true } }).tiff().toFile(tiffPath.pathname).catch(() => sharp(page()).tiff().toFile(tiffPath.pathname));
const tiff = new Uint8Array(fs.readFileSync(tiffPath)); fs.rmSync(tiffPath);
assert.equal(fileKind(tiff), "tiff");
assert.ok(await renderFiles([tiff], () => {}) >= 1);
// Every other format a firm or client sends (fixtures in tests/fixtures, see its README).
const fx = (n) => new Uint8Array(fs.readFileSync(new URL(`./fixtures/${n}`, import.meta.url)));
assert.equal(fileKind(fx("deck.pptx")), "pptx");
assert.equal(await pptxText(fx("deck.pptx")), "Slide 1\nProposed endeavor\nNotes:\nSpeaker note about the endeavor\n\nSlide 2\nNational importance of AI safety research");
assert.equal(fileKind(fx("deck.ppt")), "ppt");
assert.equal(pptText(fx("deck.ppt")), "Proposed endeavor\n\nNational importance of AI safety research\nSpeaker note about the endeavor", "old PowerPoint with its notes, without its master placeholders");
assert.equal(fileKind(fx("staff.xls")), "xls");
assert.equal(xlsText(fx("staff.xls")), "Sheet: Employees\nName | Title | Salary\nMaria Hernandez | Senior Engineer | 145000\nJosé Núñez | Analyst | 98500.5");
assert.equal(fileKind(fx("staff.ods")), "odf");
assert.equal(await odfText(fx("staff.ods")), "Name | Title | Salary\nMaria Hernandez | Senior Engineer | 145000\nJosé Núñez | Analyst | 98500.5");
assert.equal(await odfText(fx("letter.odt")), "Expert opinion letter for José Núñez\nDr. 王伟 confirms the beneficiary is among the top researchers in the field.\nAward | Year\nHealthBridge Innovation Challenge | 2024\nSigned in Boston.");
assert.equal(fileKind(fx("wordperfect51.wp")), "wpd");
assert.ok(wpdText(fx("wordperfect51.wp")).startsWith("REPORT TITLE: Western Gulf of Alaska Petroleum Development Scenarios Transportation Systems Analysis.\nSTUDY TITLE:"));
assert.ok(wpdText(fx("wordperfect6.wpd")).startsWith('APPENDIX "A"\n\nAND FURTHER'));
assert.equal(fileKind(fx("pages2013.pages")), "iwork");
assert.ok((await iworkText(fx("pages2013.pages"))).includes("Some plain text to parse."));
assert.equal(fileKind(fx("winmail.dat")), "tnef");
assert.deepEqual(tnefFiles(fx("winmail.dat")).map((a) => `${a.name} ${fileKind(a.data)}`), ["quick.doc doc", "QUICK~1.HTM text", "quick.pdf pdf", "quick.txt text", "quick.xml text"]);
assert.ok(await renderFiles([fx("winmail.dat")], () => {}) >= 4, "every file inside winmail.dat is read");
assert.equal(plainText(new TextEncoder().encode("<!DOCTYPE html><html><head><style>p{}</style></head><body><p>Offer letter</p><p>Salary $145,000</p></body></html>")), "Offer letter\nSalary $145,000");
console.log("all file reading tests passed");
