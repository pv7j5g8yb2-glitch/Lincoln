import { docText, msgParts, oleKind, pptText, xlsText } from "./ole";
import { wpdText } from "./wpd";
import { iworkText } from "./iwork";
import { emlParts, htmlText, looksLikeEmail, rtfText, tnefFiles } from "./mime";
import { keepAttachment } from "./integrations/types";


// Pages one case can hold. Cost grows with every page read (about a cent a page on Sonnet), so the
// limit is generous for real files (O-1 and EB-1 evidence often runs to 150 to 300 pages) but stops a
// stray 2,000 page dump from spending the day's budget. LINCOLN_MAX_PAGES changes it.
export const MAX_PAGES = Number(process.env.LINCOLN_MAX_PAGES) || 500;

export type Put = (n: number, jpeg: Buffer) => void;

/** Renders each page of a PDF to a JPEG and hands it to put. Pure JavaScript, no system tools. */
export async function renderPdf(data: Uint8Array, put: Put, start = 1): Promise<number> {
  const { createCanvas } = await import("@napi-rs/canvas");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const task = pdfjs.getDocument({ data, useSystemFonts: true, isEvalSupported: false } as any);
  const doc = await task.promise;
  const n = Math.max(0, Math.min(doc.numPages, MAX_PAGES - (start - 1)));
  for (let i = 1; i <= n; i++) {
    const page = await doc.getPage(i);
    const base = page.getViewport({ scale: 1 });
    // About 820 px wide: legible for the model at roughly half the tokens of a full size page.
    // Long or oddly shaped pages are capped so a hostile PDF cannot exhaust memory.
    const vp = page.getViewport({ scale: Math.min(1.4, 820 / base.width, 2400 / base.height) });
    const canvas = createCanvas(Math.ceil(vp.width), Math.ceil(vp.height));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await page.render({ canvasContext: ctx as any, viewport: vp, canvas: canvas as any }).promise;
    put(start + i - 1, canvas.toBuffer("image/jpeg", 70));
    page.cleanup();
  }
  await task.destroy();
  return n;
}

export type FileKind = "pdf" | "jpeg" | "png" | "webp" | "heic" | "tiff" | "gif" | "bmp" | "avif" | "docx" | "xlsx" | "pptx" | "odf" | "iwork" | "zip" | "text" | "eml" | "doc" | "msg" | "ppt" | "xls" | "wpd" | "tnef";

/** Identifies a file by its first bytes, never by its name. */
export function fileKind(b: Uint8Array): FileKind | null {
  const s = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n));
  if (s(0, 4) === "%PDF") return "pdf";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b[0] === 0x89 && s(1, 3) === "PNG") return "png";
  if (s(0, 4) === "RIFF" && s(8, 4) === "WEBP") return "webp";
  if (s(4, 4) === "ftyp" && /^(avif|avis)$/.test(s(8, 4))) return "avif";
  if (s(4, 4) === "ftyp" && /^(heic|heix|hevc|heim|heis|mif1|msf1)$/.test(s(8, 4))) return "heic";
  if (s(0, 4) === "GIF8") return "gif";
  if (s(0, 2) === "BM" && b.length > 54 && (b[2] | (b[3] << 8) | (b[4] << 16) | (b[5] << 24)) === b.length) return "bmp";
  // WordPerfect, still used for pleadings and letters in some firms.
  if (b[0] === 0xff && s(1, 3) === "WPC") return "wpd";
  // winmail.dat: attachments wrapped by Outlook, unwrapped and read one by one.
  if (b[0] === 0x78 && b[1] === 0x9f && b[2] === 0x3e && b[3] === 0x22) return "tnef";
  // Scanners and fax services send TIFF, often several pages in one file.
  if (s(0, 4) === "II*\0" || s(0, 4) === "MM\0*") return "tiff";
  // A Word file is a zip holding word/document.xml (Excel and PowerPoint files are zips too, and are not read).
  if (s(0, 4) === "PK\x03\x04") {
    const names = zipNames(b);
    if (names.has("word/document.xml")) return "docx";
    // A spreadsheet (payroll, a list of employees, an exhibit index) is read as rows; slides are not read.
    if (names.has("xl/workbook.xml")) return "xlsx";
    // Slides are read slide by slide, with their speaker notes.
    if (names.has("ppt/presentation.xml")) return "pptx";
    // OpenDocument (LibreOffice, Google exports): text, spreadsheet or presentation.
    if (names.has("mimetype") && names.has("content.xml")) return "odf";
    // Apple Pages, Keynote and Numbers: their own PDF copy when they keep one, otherwise their words.
    if (names.has("QuickLook/Preview.pdf") || [...names].some((n) => /^(Index\/.+\.iwa$|index\.(xml|apxl)(\.gz)?$)/.test(n))) return "iwork";
    // Any other zip is a folder of files sent at once, opened and read one by one.
    return "zip";
  }
  // Word 97 to 2003 and Outlook messages are compound files; anything else in that format (old Excel) is not read.
  if (b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0) return oleKind(b);
  // A saved or forwarded email: read as the email, with its own attachments.
  if (looksLikeEmail(b)) return "eml";
  // Calendar invites and contact cards ride along with emails; they are not evidence.
  if (looksLikeText(b)) return /^\s*BEGIN:(VCALENDAR|VCARD)/.test(new TextDecoder().decode(b.subarray(0, 64))) ? null : "text";
  return null;
}

/** The names of the files in a zip, from its central directory (not from its contents, which may hold other zips). */
function zipNames(b: Uint8Array) {
  const names = new Set<string>();
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  // The end record sits in the last 64 KB; it gives where the directory starts and how many entries it has.
  for (let i = b.length - 22; i >= Math.max(0, b.length - 65_557); i--) {
    if (v.getUint32(i, true) !== 0x06054b50) continue;
    const count = v.getUint16(i + 10, true);
    let at = v.getUint32(i + 16, true);
    for (let k = 0; k < count && at + 46 <= b.length && v.getUint32(at, true) === 0x02014b50; k++) {
      const n = v.getUint16(at + 28, true), extra = v.getUint16(at + 30, true), comment = v.getUint16(at + 32, true);
      names.add(new TextDecoder().decode(b.subarray(at + 46, at + 46 + n)));
      at += 46 + n + extra + comment;
    }
    break;
  }
  return names;
}

/** Plain text, Markdown, RTF or a saved email: no zero bytes, valid UTF-8, almost no control characters. */
function looksLikeText(b: Uint8Array) {
  if (b.length < 2) return false;
  const head = b.subarray(0, 16_384);
  let control = 0;
  for (const x of head) {
    if (x === 0) return false;
    if (x < 9 || (x > 13 && x < 32)) control++;
  }
  if (control > head.length / 200) return false;
  const text = new TextDecoder("utf-8").decode(head);
  const bad = (text.match(/\uFFFD/g) ?? []).length;
  return bad <= 2;
}

const xmlText = (v: string) => v.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&amp;/g, "&");

/** The words of a Word file, paragraph by paragraph, with table cells kept apart. Formatting is not kept. */
export async function docxText(b: Uint8Array) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(b);
  const xml = (await zip.file("word/document.xml")?.async("string")) ?? "";
  // Each table row becomes one line, its cells separated by " | ", so a table reads as a table.
  const cell = (c: string) => xmlText([...c.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>/g)].map((m) => m[1]).join(" ").trim());
  const tables = xml.replace(/<w:tbl>[\s\S]*?<\/w:tbl>/g, (tbl) => tbl.split(/<\/w:tr>/).filter((r) => r.includes("<w:tc"))
    .map((r) => `<w:p><w:r><w:t>${r.split(/<\/w:tc>/).filter((c) => c.includes("<w:t")).map(cell).join(" | ").replace(/&/g, "&amp;").replace(/</g, "&lt;")}</w:t></w:r></w:p>`).join(""));
  const body = tables.replace(/<w:tab\/>/g, "\t").replace(/<w:br[^>]*\/>/g, "\n");
  const paras = body.split(/<\/w:p>/).map((p) => xmlText([...p.matchAll(/<w:t(?:\s[^>]*)?>([^<]*)<\/w:t>|(\t|\n)/g)].map((m) => m[1] ?? m[2]).join("")));
  return paras.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** The words of a PowerPoint file, slide by slide, each slide's speaker notes after it. */
export async function pptxText(b: Uint8Array) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(b);
  const num = (n: string) => Number(n.match(/(\d+)\.xml$/)?.[1] ?? 0);
  const words = (xml: string) => xml.split(/<\/a:p>/).map((p) => xmlText([...p.matchAll(/<a:t>([^<]*)<\/a:t>|<a:t [^>]*>([^<]*)<\/a:t>/g)].map((m) => m[1] ?? m[2]).join(""))).map((l) => l.trim()).filter(Boolean);
  const slides = Object.keys(zip.files).filter((n) => /^ppt\/slides\/slide\d+\.xml$/.test(n)).sort((a, b) => num(a) - num(b));
  const out: string[] = [];
  for (const name of slides) {
    const text = words(await zip.file(name)!.async("string"));
    const notesFile = zip.file(`ppt/notesSlides/notesSlide${num(name)}.xml`);
    const notes = notesFile ? words(await notesFile.async("string")).filter((l) => !/^\d+$/.test(l)) : [];
    out.push(`Slide ${num(name)}`, ...text, ...(notes.length ? ["Notes:", ...notes] : []), "");
  }
  return out.join("\n").trim();
}

/** The words of an OpenDocument file (.odt, .ods, .odp): paragraphs and headings, table rows with cells separated. */
export async function odfText(b: Uint8Array) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(b);
  const xml = (await zip.file("content.xml")?.async("string")) ?? "";
  // Comments are left out; footnotes move to the end, numbered, rather than breaking the sentence they belong to.
  const notes: string[] = [];
  const body = xml.slice(Math.max(0, xml.indexOf("<office:body")))
    .replace(/<office:annotation[\s\S]*?<\/office:annotation>/g, "")
    // Tracked changes keep deleted words and their author apart from the text; index templates are not text.
    .replace(/<text:tracked-changes[\s\S]*?<\/text:tracked-changes>/g, "").replace(/<text:([a-z-]+)-source[\s>][\s\S]*?<\/text:\1-source>/g, "")
    .replace(/<text:note [^>]*>\s*<text:note-citation[^>]*>([^<]*)<\/text:note-citation>\s*<text:note-body>([\s\S]*?)<\/text:note-body>\s*<\/text:note>/g, (_, n: string, inner: string) => { notes.push(`[${n}] ${xmlText(inner.replace(/<[^>]+>/g, " ")).replace(/\s+/g, " ").trim()}`); return `[${n}]`; })
    .replace(/<text:s(?: text:c="(\d+)")?\/>/g, (_, n) => " ".repeat(Number(n ?? 1))).replace(/<text:tab\/>/g, "\t").replace(/<text:line-break\/>/g, "\n")
    .replace(/<\/table:table-cell>/g, " | ").replace(/<\/table:table-row>/g, "\n").replace(/<\/(text:p|text:h)>/g, (m) => m)
    .replace(/<draw:page [^>]*draw:name="([^"]*)"[^>]*>/g, "\n$1\n");
  const text = xmlText(body.replace(/<\/(?:text:p|text:h)>(?! \|)/g, "\n").replace(/<[^>]+>/g, ""));
  const all = notes.length ? `${text}\n\nNotes:\n${notes.join("\n")}` : text;
  return all.split("\n").map((l) => l.replace(/( \| )+$/, "").trimEnd()).filter((l, i, a) => l || a[i - 1]).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** The full PDF copy an older Apple Pages, Keynote or Numbers file keeps inside itself, if it has one. */
export async function iworkPdf(b: Uint8Array) {
  const JSZip = (await import("jszip")).default;
  const f = (await JSZip.loadAsync(b)).file("QuickLook/Preview.pdf");
  return f ? new Uint8Array(await f.async("uint8array")) : null;
}

/** The rows of every sheet in a spreadsheet, cells separated by " | ", each sheet under its own name. */
export async function xlsxText(b: Uint8Array) {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(b);
  const shared = [...((await zip.file("xl/sharedStrings.xml")?.async("string")) ?? "").matchAll(/<si>([\s\S]*?)<\/si>/g)]
    .map((m) => xmlText([...m[1].matchAll(/<t(?:\s[^>]*)?>([^<]*)<\/t>/g)].map((t) => t[1]).join("")));
  const book = (await zip.file("xl/workbook.xml")?.async("string")) ?? "";
  const names = [...book.matchAll(/<sheet [^>]*name="([^"]*)"/g)].map((m) => xmlText(m[1]));
  const sheets = Object.keys(zip.files).filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort((a, b) => Number(a.match(/\d+/)![0]) - Number(b.match(/\d+/)![0]));
  const out: string[] = [];
  for (const [i, name] of sheets.entries()) {
    const xml = (await zip.file(name)!.async("string"));
    const rows = [...xml.matchAll(/<row[^>]*>([\s\S]*?)<\/row>/g)].map((r) => {
      const cells: string[] = [];
      for (const c of r[1].matchAll(/<c(?:\s([^>]*?))?(?:\/>|>([\s\S]*?)<\/c>)/g)) {
        const a = c[1] ?? "";
        const v = c[2]?.match(/<v>([^<]*)<\/v>/)?.[1] ?? c[2]?.match(/<t[^>]*>([^<]*)<\/t>/)?.[1] ?? "";
        // A cell's column comes from its reference (C5 is the third), so a blank cell keeps the others in line.
        const col = a.match(/\br="([A-Z]+)\d+"/)?.[1];
        const at = col ? [...col].reduce((n, ch) => n * 26 + ch.charCodeAt(0) - 64, 0) - 1 : cells.length;
        while (cells.length < at && cells.length < 200) cells.push("");
        cells.push(/\bt="s"/.test(a) ? shared[Number(v)] ?? "" : xmlText(v));
      }
      return cells.join(" | ").replace(/( \| )+$/, "");
    }).filter((r) => r.replace(/[ |]/g, ""));
    if (rows.length) out.push(`Sheet: ${names[i] ?? `Sheet ${i + 1}`}`, ...rows.slice(0, 2000), "");
  }
  return out.join("\n").trim();
}

/** The files inside a zip, in name order: folders, system files and anything past the safe size are skipped. */
export async function unzipFiles(b: Uint8Array): Promise<Uint8Array[]> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(b);
  const out: Uint8Array[] = [];
  let total = 0;
  for (const name of Object.keys(zip.files).sort()) {
    const f = zip.files[name];
    if (f.dir || /(^|\/)(__MACOSX|\.)/.test(name)) continue;
    if (out.length >= 200) break;
    const data = await f.async("uint8array");
    total += data.length;
    // A small zip that unpacks to an enormous size is refused rather than filling the disk.
    if (total > 200 * 1024 * 1024) break;
    out.push(data);
  }
  return out;
}

/** The words of a text file. RTF loses its control words; a saved email loses the base64 blocks of its attachments. */
export function plainText(b: Uint8Array) {
  const t = new TextDecoder("utf-8").decode(b).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (t.startsWith("{\\rtf")) return rtfText(t);
  if (/^\s*<(!doctype html|html[\s>])/i.test(t)) return htmlText(t).trim();
  return t.split("\n").filter((line) => !/^[A-Za-z0-9+/=]{60,}$/.test(line.trim())).join("\n").trim();
}

/** Lays text out on white A4 pages and hands each page to put as a JPEG, as a printed copy would read. */
export async function renderText(text: string, put: Put, start = 1, maxPages = 60): Promise<number> {
  const { createCanvas } = await import("@napi-rs/canvas");
  const W = 1000, H = 1414, M = 80, SIZE = 22, LINE = 33;
  const measure = createCanvas(W, H).getContext("2d");
  measure.font = `${SIZE}px sans-serif`;
  const width = W - 2 * M;
  const lines: string[] = [];
  for (const para of text.split("\n")) {
    const words = para.replace(/\t/g, "    ").split(" ");
    let line = "";
    for (let w of words) {
      // A word wider than the page (a long link) is broken across lines.
      while (measure.measureText(w).width > width) {
        let cut = w.length;
        while (cut > 1 && measure.measureText(w.slice(0, cut)).width > width) cut--;
        if (line) { lines.push(line); line = ""; }
        lines.push(w.slice(0, cut));
        w = w.slice(cut);
      }
      const next = line ? `${line} ${w}` : w;
      if (measure.measureText(next).width <= width) line = next;
      else { lines.push(line); line = w; }
    }
    lines.push(line);
  }
  const perPage = Math.floor((H - 2 * M) / LINE);
  const pages = Math.min(Math.max(1, Math.ceil(lines.length / perPage)), maxPages, MAX_PAGES - (start - 1));
  for (let i = 0; i < pages; i++) {
    const canvas = createCanvas(W, H);
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#111111";
    ctx.font = `${SIZE}px sans-serif`;
    ctx.textBaseline = "top";
    lines.slice(i * perPage, (i + 1) * perPage).forEach((l, k) => ctx.fillText(l, M, M + k * LINE));
    put(start + i, canvas.toBuffer("image/jpeg", 82));
  }
  return Math.max(0, pages);
}

/**
 * Turns photos and scans into pages: HEIC is converted, the camera's rotation is applied by the
 * decoder, and each image is resized so the longest side is at most 1600 pixels.
 */
/** Each page of a TIFF (a scan or a fax) as a JPEG page. */
export async function renderTiff(b: Uint8Array, put: Put, start = 1): Promise<number> {
  const sharp = (await import("sharp")).default;
  const meta = await sharp(b, { limitInputPixels: 80_000_000 }).metadata();
  let n = 0;
  for (let page = 0; page < Math.min(meta.pages ?? 1, 200) && start - 1 + n < MAX_PAGES; page++) {
    const jpeg = await sharp(b, { page, limitInputPixels: 80_000_000 }).flatten({ background: "#ffffff" }).resize(1600, 1600, { fit: "inside", withoutEnlargement: true }).jpeg({ quality: 82 }).toBuffer();
    n++;
    put(start - 1 + n, jpeg);
  }
  return n;
}

export async function renderImages(images: Uint8Array[], put: Put, start = 1): Promise<number> {
  const { createCanvas, loadImage } = await import("@napi-rs/canvas");
  let n = 0;
  for (const raw of images) {
    if (start - 1 + n >= MAX_PAGES) break;
    const dims = imageSize(raw);
    // Refuse decompression bombs: a small file that claims an enormous picture.
    if (dims && (dims.w > 20000 || dims.h > 20000 || dims.w * dims.h > 80_000_000)) throw new Error("An image is too large to read.");
    let data = Buffer.from(raw);
    if (fileKind(raw) === "heic") {
      const convert = (await import("heic-convert")).default as (o: { buffer: Buffer; format: "JPEG"; quality: number }) => Promise<ArrayBuffer>;
      data = Buffer.from(await convert({ buffer: data, format: "JPEG", quality: 0.9 }));
    }
    const img = await loadImage(data);
    const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
    const canvas = createCanvas(Math.round(img.width * scale), Math.round(img.height * scale));
    const ctx = canvas.getContext("2d");
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    n++;
    put(start - 1 + n, canvas.toBuffer("image/jpeg", 82));
  }
  return n;
}

/** Attachments Lincoln could not read and that may matter (an old .doc, an Outlook .msg), by name. Invites, contact
 *  cards and signature files are left out: they are not evidence. */
export function unreadable(files: { name: string; data: Uint8Array | Buffer }[]) {
  return files.filter((f) => !fileKind(new Uint8Array(f.data)) && !/\.(ics|vcf|p7s|p7m|asc|sig)$/i.test(f.name)).map((f) => f.name || "an attachment").slice(0, 6);
}

/** Renders a mixed set of PDFs and images, in order, as consecutive pages. Returns pages added. */
export async function renderFiles(files: Uint8Array[], put: Put, start = 1, depth = 0): Promise<number> {
  let added = 0;
  for (const f of files) {
    const k = fileKind(f);
    if (k === "pdf") added += await renderPdf(f, put, start + added);
    // Word and text files become pages of their words, so a CV, a letter or consultation notes are read like a scan.
    else if (k === "docx") { const t = await docxText(f); if (t) added += await renderText(t, put, start + added); }
    else if (k === "xlsx") { const t = await xlsxText(f); if (t) added += await renderText(t, put, start + added); }
    // The files of a zip are read in order as if sent one by one (also a zip attached to an Outlook message); a zip
    // inside a zip is not opened.
    else if (k === "zip" && depth < 2) added += await renderFiles(await unzipFiles(f), put, start + added, 2);
    else if (k === "doc") { const t = docText(f); if (t) added += await renderText(t, put, start + added); }
    else if (k === "pptx") { const t = await pptxText(f); if (t) added += await renderText(t, put, start + added); }
    else if (k === "odf") { const t = await odfText(f); if (t) added += await renderText(t, put, start + added); }
    else if (k === "iwork") { const pdf = await iworkPdf(f); if (pdf) added += await renderPdf(pdf, put, start + added); else { const t = await iworkText(f); if (t) added += await renderText(t, put, start + added); } }
    else if (k === "ppt") { const t = pptText(f); if (t) added += await renderText(t, put, start + added); }
    else if (k === "xls") { const t = xlsText(f); if (t) added += await renderText(t, put, start + added); }
    else if (k === "wpd") { const t = wpdText(f); if (t) added += await renderText(t, put, start + added); }
    else if (k === "avif") { const sharp = (await import("sharp")).default; added += await renderImages([new Uint8Array(await sharp(f, { limitInputPixels: 80_000_000 }).jpeg({ quality: 90 }).toBuffer())], put, start + added); }
    // An Outlook message reads as the email it is, then each of its attachments as if sent on its own.
    else if (k === "msg" || k === "eml") {
      const m = k === "msg" ? msgParts(f) : emlParts(f);
      if (m.text) added += await renderText(m.text, put, start + added);
      const files = m.attachments.filter((a) => keepAttachment(a.name, "", a.data.length, "inline" in a && Boolean(a.inline))).map((a) => a.data);
      if (depth < 2) added += await renderFiles(files, put, start + added, depth + 1);
    }
    else if (k === "tiff") added += await renderTiff(f, put, start + added);
    else if (k === "tnef" && depth < 2) added += await renderFiles(tnefFiles(f).map((a) => a.data), put, start + added, depth + 1);
    else if (k === "text") { const t = plainText(f); if (t) added += await renderText(t, put, start + added); }
    else if (k === "jpeg" || k === "png" || k === "webp" || k === "heic" || k === "gif" || k === "bmp") added += await renderImages([f], put, start + added);
  }
  return added;
}

/** Width and height from the file header, without decoding: PNG, JPEG, WebP. */
export function imageSize(b: Uint8Array): { w: number; h: number } | null {
  const v = new DataView(b.buffer, b.byteOffset, b.byteLength);
  const k = fileKind(b);
  try {
    if (k === "png") return { w: v.getUint32(16), h: v.getUint32(20) };
    if (k === "webp") {
      const fmt = String.fromCharCode(...b.slice(12, 16));
      if (fmt === "VP8X") return { w: 1 + (b[24] | (b[25] << 8) | (b[26] << 16)), h: 1 + (b[27] | (b[28] << 8) | (b[29] << 16)) };
      if (fmt === "VP8 ") return { w: v.getUint16(26, true) & 0x3fff, h: v.getUint16(28, true) & 0x3fff };
      if (fmt === "VP8L") { const bits = v.getUint32(21, true); return { w: (bits & 0x3fff) + 1, h: ((bits >> 14) & 0x3fff) + 1 }; }
    }
    if (k === "jpeg") {
      let i = 2;
      while (i + 9 < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const marker = b[i + 1];
        const len = v.getUint16(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) return { h: v.getUint16(i + 5), w: v.getUint16(i + 7) };
        i += 2 + len;
      }
    }
  } catch { return null; }
  return null;
}
