// Apple Pages, Keynote and Numbers. Files from 2013 on keep their content in .iwa records (Snappy compressed
// protocol buffers); older ones keep XML. Lincoln reads the words: a document's text, each slide's text and notes,
// each table's cell text. Layout is not kept.

/** Snappy's raw block format, as iWork writes it. */
function snappy(src: Uint8Array): Uint8Array {
  let i = 0, size = 0, shift = 0;
  for (;;) { const b = src[i++]; size |= (b & 0x7f) << shift; if (b < 0x80) break; shift += 7; }
  if (size > 200 * 1024 * 1024) return new Uint8Array();
  const out = new Uint8Array(size);
  let o = 0;
  while (i < src.length && o < size) {
    const tag = src[i++], type = tag & 3;
    if (type === 0) {
      let len = tag >> 2;
      if (len >= 60) { const n = len - 59; len = 0; for (let k = 0; k < n; k++) len |= src[i + k] << (8 * k); i += n; }
      len += 1;
      out.set(src.subarray(i, i + len), o); i += len; o += len;
      continue;
    }
    let len: number, off: number;
    if (type === 1) { len = ((tag >> 2) & 7) + 4; off = ((tag >> 5) << 8) | src[i++]; }
    else if (type === 2) { len = (tag >> 2) + 1; off = src[i] | (src[i + 1] << 8); i += 2; }
    else { len = (tag >> 2) + 1; off = (src[i] | (src[i + 1] << 8) | (src[i + 2] << 16) | (src[i + 3] << 24)) >>> 0; i += 4; }
    if (!off || off > o) break;
    for (let k = 0; k < len && o < size; k++, o++) out[o] = out[o - off];
  }
  return out.subarray(0, o);
}

/** An .iwa file: chunks of a zero byte, a 3 byte length and a Snappy block. */
function iwa(b: Uint8Array): Uint8Array {
  const parts: Uint8Array[] = [];
  for (let i = 0; i + 4 <= b.length;) {
    const len = b[i + 1] | (b[i + 2] << 8) | (b[i + 3] << 16);
    if (b[i] !== 0) break;
    parts.push(snappy(b.subarray(i + 4, i + 4 + len)));
    i += 4 + len;
  }
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let o = 0;
  for (const p of parts) { out.set(p, o); o += p.length; }
  return out;
}

type Field = { n: number; v: number; bytes?: Uint8Array };

function varint(b: Uint8Array, i: number): [number, number] {
  let v = 0, mul = 1;
  for (;;) { const x = b[i++]; v += (x & 0x7f) * mul; if (x < 0x80 || i >= b.length) return [v, i]; mul *= 128; }
}

function fields(b: Uint8Array): Field[] {
  const out: Field[] = [];
  for (let i = 0; i < b.length;) {
    let key: number; [key, i] = varint(b, i);
    const n = Math.floor(key / 8), w = key & 7;
    if (w === 0) { let v: number; [v, i] = varint(b, i); out.push({ n, v }); }
    else if (w === 2) { let len: number; [len, i] = varint(b, i); out.push({ n, v: len, bytes: b.subarray(i, i + len) }); i += len; }
    else if (w === 1) i += 8;
    else if (w === 5) i += 4;
    else break;
  }
  return out;
}

/** The objects stored in an .iwa file, each with its type number. */
function objects(b: Uint8Array): { type: number; data: Uint8Array }[] {
  const s = iwa(b), out: { type: number; data: Uint8Array }[] = [];
  for (let i = 0; i < s.length;) {
    let len: number; [len, i] = varint(s, i);
    const info = fields(s.subarray(i, i + len)); i += len;
    for (const m of info.filter((f) => f.n === 2 && f.bytes)) {
      const mf = fields(m.bytes!);
      const type = mf.find((f) => f.n === 1)?.v ?? 0, size = mf.find((f) => f.n === 3)?.v ?? 0;
      out.push({ type, data: s.subarray(i, i + size) }); i += size;
    }
    if (!info.length) break;
  }
  return out;
}

const utf8 = new TextDecoder("utf-8");
const clean = (t: string) => t.replace(/\uFFFC/g, "").replace(/[\u2028\u2029\r]/g, "\n").replace(/\n{3,}/g, "\n\n").trim();

/** Text storages (type 2001): the body of a document, a shape, a slide's notes. */
function texts(b: Uint8Array) {
  return objects(b).filter((o) => o.type === 2001).map((o) => clean(fields(o.data).filter((f) => f.n === 3 && f.bytes).map((f) => utf8.decode(f.bytes!)).join(""))).filter(Boolean);
}

/** Table cell strings (type 6005 lists of strings). */
function cells(b: Uint8Array) {
  return objects(b).filter((o) => o.type === 6005).flatMap((o) => {
    const f = fields(o.data);
    if (f.find((x) => x.n === 1)?.v !== 1) return [];
    return f.filter((x) => x.n === 3 && x.bytes).map((x) => fields(x.bytes!).find((y) => y.n === 3 && y.bytes)).filter(Boolean).map((y) => utf8.decode(y!.bytes!).trim()).filter(Boolean);
  });
}

const num = (n: string) => Number(n.match(/-(\d+)\.iwa$/)?.[1] ?? 0);

/** The words of a Pages, Keynote or Numbers file, or "" when nothing could be read. */
export async function iworkText(b: Uint8Array): Promise<string> {
  const JSZip = (await import("jszip")).default;
  const zip = await JSZip.loadAsync(b);
  const names = Object.keys(zip.files);
  const read = async (n: string) => new Uint8Array(await zip.file(n)!.async("uint8array"));
  const out: string[] = [];
  const slides = names.filter((n) => /^Index\/Slide(-\d+)?\.iwa$/.test(n)).sort((a, b) => num(a) - num(b));
  if (slides.length) {
    // The files are not stored in slide order, so slides are not numbered here.
    for (const n of slides) { const t = texts(await read(n)); if (t.length) out.push(...t, ""); }
  } else if (zip.file("Index/Document.iwa")) {
    out.push(...texts(await read("Index/Document.iwa")));
  }
  const lists = names.filter((n) => /^Index\/Tables\/DataList(-\d+)?\.iwa$/.test(n)).sort((a, b) => num(a) - num(b));
  const tableText: string[] = [];
  for (const n of lists) tableText.push(...cells(await read(n)));
  if (tableText.length) out.push("Table cells (layout not kept):", ...tableText);
  if (out.length) return out.join("\n").replace(/\n{3,}/g, "\n\n").trim();
  // iWork '09: the content is XML (index.xml, index.apxl, sometimes gzipped).
  const xmlName = names.find((n) => /^index\.(xml|apxl)(\.gz)?$/.test(n));
  if (!xmlName) return "";
  let xml = await read(xmlName);
  if (xml[0] === 0x1f && xml[1] === 0x8b) xml = new Uint8Array((await import("node:zlib")).gunzipSync(xml)); // gzipped, whatever the name says
  const s = utf8.decode(xml);
  const body = s.replace(/<sf:(?:p|li)\b[^>]*\/>/g, "\n").replace(/<\/sf:(?:p|li)>/g, "\n").replace(/<sf:br\/>|<sf:lnbr\/>/g, "\n").replace(/<sf:tab\/>/g, "\t")
    .replace(/<sf:t\b[^>]*>\s*<sf:ct sfa:s="([^"]*)"[^>]*\/>/g, "\n$1\n").replace(/<sf:n\b[^>]*sf:v="([^"]*)"[^>]*\/>/g, (_, v: string) => ` ${Number.isFinite(Number(v)) ? Math.round(Number(v) * 1e6) / 1e6 : v} `);
  const text = body.replace(/<(sf:(?:stylesheet|styles|anon-styles|calc-engine|metadata|annotations|headers|footers|menu-choices))(?:\s[^>]*)?(?<!\/)>[\s\S]*?<\/\1>/g, "").replace(/<[^>]+>/g, "")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&#x([0-9a-f]+);/gi, (_, h) => String.fromCodePoint(parseInt(h, 16))).replace(/&amp;/g, "&");
  return text.split("\n").map((l) => l.trim()).filter(Boolean).join("\n").trim();
}
