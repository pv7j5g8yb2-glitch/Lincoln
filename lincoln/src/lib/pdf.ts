
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

export type FileKind = "pdf" | "jpeg" | "png" | "webp" | "heic" | "docx" | "text";

/** Identifies a file by its first bytes, never by its name. */
export function fileKind(b: Uint8Array): FileKind | null {
  const s = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n));
  if (s(0, 4) === "%PDF") return "pdf";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b[0] === 0x89 && s(1, 3) === "PNG") return "png";
  if (s(0, 4) === "RIFF" && s(8, 4) === "WEBP") return "webp";
  if (s(4, 4) === "ftyp" && /^(heic|heix|hevc|heim|heis|mif1|msf1)$/.test(s(8, 4))) return "heic";
  // A Word file is a zip holding word/document.xml (Excel and PowerPoint files are zips too, and are not read).
  if (s(0, 4) === "PK\x03\x04" && Buffer.from(b.buffer, b.byteOffset, b.byteLength).includes("word/document.xml")) return "docx";
  if (looksLikeText(b)) return "text";
  return null;
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

/** The words of a text file. RTF loses its control words; a saved email loses the base64 blocks of its attachments. */
export function plainText(b: Uint8Array) {
  let t = new TextDecoder("utf-8").decode(b).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
  if (t.startsWith("{\\rtf")) {
    t = t.replace(/\{\\(?:fonttbl|colortbl|stylesheet|info)(?:[^{}]|\{[^{}]*\})*\}/g, "").replace(/\{\\\*[^{}]*\}/g, "").replace(/\\par[d]?\b ?/g, "\n").replace(/\\'([0-9a-f]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16)))
      .replace(/\\[a-z]+-?\d* ?/gi, "").replace(/[{}]/g, "");
  }
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

/** Renders a mixed set of PDFs and images, in order, as consecutive pages. Returns pages added. */
export async function renderFiles(files: Uint8Array[], put: Put, start = 1): Promise<number> {
  let added = 0;
  for (const f of files) {
    const k = fileKind(f);
    if (k === "pdf") added += await renderPdf(f, put, start + added);
    // Word and text files become pages of their words, so a CV, a letter or consultation notes are read like a scan.
    else if (k === "docx") { const t = await docxText(f); if (t) added += await renderText(t, put, start + added); }
    else if (k === "text") { const t = plainText(f); if (t) added += await renderText(t, put, start + added); }
    else if (k) added += await renderImages([f], put, start + added);
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
