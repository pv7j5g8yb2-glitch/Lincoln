
export const MAX_PAGES = 90;

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

export type FileKind = "pdf" | "jpeg" | "png" | "webp" | "heic";

/** Identifies a file by its first bytes, never by its name. */
export function fileKind(b: Uint8Array): FileKind | null {
  const s = (i: number, n: number) => String.fromCharCode(...b.slice(i, i + n));
  if (s(0, 4) === "%PDF") return "pdf";
  if (b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff) return "jpeg";
  if (b[0] === 0x89 && s(1, 3) === "PNG") return "png";
  if (s(0, 4) === "RIFF" && s(8, 4) === "WEBP") return "webp";
  if (s(4, 4) === "ftyp" && /^(heic|heix|hevc|heim|heis|mif1|msf1)$/.test(s(8, 4))) return "heic";
  return null;
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
