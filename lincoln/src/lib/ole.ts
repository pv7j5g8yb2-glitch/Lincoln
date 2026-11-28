import CFB from "cfb";
import { htmlText, rtfText } from "./mime";

// Older Office files: Word 97 to 2003 (.doc) and Outlook messages saved or dragged out of Outlook (.msg). Both are
// compound files (a small file system inside one file). Lincoln reads the words of a .doc, and a .msg as the email
// it is, with its attachments read like any other file.

type Entry = { name: string; content?: Uint8Array | number[] };
type Container = { FileIndex: Entry[]; FullPaths: string[] };

const OLE = [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1];

function open(b: Uint8Array): Container | null {
  if (b.length < 512 || OLE.some((x, i) => b[i] !== x)) return null;
  try { return CFB.read(Buffer.from(b.buffer, b.byteOffset, b.byteLength), { type: "buffer" }) as unknown as Container; } catch { return null; }
}

const bytes = (e: Entry | undefined) => (e?.content ? Uint8Array.from(e.content as ArrayLike<number>) : null);
const at = (c: Container, path: string) => {
  const i = c.FullPaths.findIndex((p) => p.toLowerCase() === path.toLowerCase());
  return i < 0 ? undefined : c.FileIndex[i];
};

/** Which older Office file this is: Word, Outlook, PowerPoint or Excel 97 to 2003. Null when it is password protected
 *  (a new Office file with a password is also stored this way) or anything else. */
export function oleKind(b: Uint8Array): "doc" | "msg" | "ppt" | "xls" | null {
  const c = open(b);
  if (!c) return null;
  const root = c.FullPaths[0];
  if (at(c, `${root}EncryptionInfo`)) return null;
  const word = bytes(at(c, `${root}WordDocument`));
  if (word && word.length > 0x20) return word[0x0b] & 0x01 ? null : "doc"; // fEncrypted
  if (c.FullPaths.some((p) => /\/__substg1\.0_[0-9A-F]{8}$/i.test(p))) return "msg";
  if (at(c, `${root}PowerPoint Document`)) return at(c, `${root}EncryptedSummary`) ? null : "ppt";
  const book = bytes(at(c, `${root}Workbook`) ?? at(c, `${root}Book`));
  if (book) { for (let i = 0; i + 4 <= book.length && i < 4096;) { const t = u16(book, i); if (t === 0x002f) return null; i += 4 + u16(book, i + 2); } return "xls"; }
  return null;
}

/** The words of a PowerPoint 97 to 2003 file, slide by slide as stored (master and layout placeholders left out). */
export function pptText(b: Uint8Array): string {
  const c = open(b);
  const doc = c && bytes(at(c, `${c.FullPaths[0]}PowerPoint Document`));
  if (!doc) return "";
  const out: string[] = [];
  let i = 0;
  // Records are an 8 byte header (version, type, length); a container (version 0xF) holds records, an atom is skipped.
  while (i + 8 <= doc.length && out.length < 20000) {
    const ver = doc[i] & 0x0f, type = u16(doc, i + 2), len = u32(doc, i + 4);
    if (type === 0x03ee) out.push(""); // a new slide
    if (ver === 0x0f) { i += 8; continue; }
    if (type === 0x0fa0) out.push(utf16.decode(doc.subarray(i + 8, i + 8 + len)));
    else if (type === 0x0fa8) out.push(cp1252.decode(doc.subarray(i + 8, i + 8 + len)));
    i += 8 + len;
  }
  // The same words are stored twice (the outline and the slide itself); each block is kept once.
  const seen = new Set<string>();
  return out.map((t) => t.replace(/\r|\v/g, "\n")).filter((t) => !/^Click to edit\b|^(Second|Third|Fourth|Fifth|Sixth|Seventh|Eighth|Ninth) (Outline )?level$/i.test(t.trim()) && t !== "*")
    .filter((t) => { const key = t.trim(); if (!key) return true; if (seen.has(key)) return false; seen.add(key); return true; })
    .join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/** The rows of every sheet of an Excel 97 to 2003 file, cells separated by " | ", each sheet under its name. */
export function xlsText(b: Uint8Array): string {
  const c = open(b);
  const book = c && bytes(at(c, `${c.FullPaths[0]}Workbook`) ?? at(c, `${c.FullPaths[0]}Book`));
  if (!book) return "";
  const records: { t: number; d: Uint8Array }[] = [];
  for (let i = 0; i + 4 <= book.length;) { const t = u16(book, i), n = u16(book, i + 2); records.push({ t, d: book.subarray(i + 4, i + 4 + n) }); i += 4 + n; }
  // Shared strings: one record, carried on in CONTINUE records; a string cut at a boundary restarts with a flags byte.
  const sst: string[] = [];
  const si = records.findIndex((r) => r.t === 0x00fc);
  if (si >= 0) {
    const parts = [records[si].d.subarray(8)];
    for (let k = si + 1; k < records.length && records[k].t === 0x003c; k++) parts.push(records[k].d);
    let part = 0, p = 0;
    const need = () => { if (p >= parts[part].length && part + 1 < parts.length) { part++; p = 0; return true; } return false; };
    const total = u32(records[si].d, 4);
    for (let n = 0; n < total && part < parts.length; n++) {
      need();
      const cur = () => parts[part];
      if (p + 3 > cur().length) break;
      let chars = u16(cur(), p); let flags = cur()[p + 2]; p += 3;
      const runs = flags & 0x08 ? u16(cur(), p) : 0; if (flags & 0x08) p += 2;
      const ext = flags & 0x04 ? u32(cur(), p) : 0; if (flags & 0x04) p += 4;
      let str = "";
      while (chars > 0) {
        if (p >= cur().length) { if (!need()) break; flags = cur()[p]; p += 1; }
        const wide = flags & 0x01, avail = Math.floor((cur().length - p) / (wide ? 2 : 1)), take = Math.min(chars, avail);
        str += wide ? utf16.decode(cur().subarray(p, p + take * 2)) : cp1252.decode(cur().subarray(p, p + take));
        p += take * (wide ? 2 : 1); chars -= take;
        if (take === 0 && !need()) break;
      }
      let skip = runs * 4 + ext;
      while (skip > 0) { const here = Math.min(skip, cur().length - p); p += here; skip -= here; if (skip > 0 && !need()) break; }
      sst.push(str);
    }
  }
  const rk = (v: number) => {
    let x: number;
    if (v & 0x02) x = (v >> 2); else { const buf = new DataView(new ArrayBuffer(8)); buf.setUint32(4, v & 0xfffffffc, true); x = buf.getFloat64(0, true); }
    return v & 0x01 ? x / 100 : x;
  };
  const f64 = (d: Uint8Array, i: number) => new DataView(d.buffer, d.byteOffset + i, 8).getFloat64(0, true);
  const num = (x: number) => (Number.isInteger(x) ? String(x) : String(Math.round(x * 1e6) / 1e6));
  const names = records.filter((r) => r.t === 0x0085).map((r) => { const n = r.d[6], wide = r.d[7] & 1; return wide ? utf16.decode(r.d.subarray(8, 8 + n * 2)) : cp1252.decode(r.d.subarray(8, 8 + n)); });
  const out: string[] = [];
  let sheet = -1, grid = new Map<number, Map<number, string>>();
  const flush = () => {
    if (sheet >= 0 && grid.size) {
      const rows = [...grid.keys()].sort((a, b) => a - b).slice(0, 2000).map((r) => { const cells = grid.get(r)!; const max = Math.max(...cells.keys()); return Array.from({ length: Math.min(max + 1, 200) }, (_, k) => cells.get(k) ?? "").join(" | ").replace(/( \| )+$/, ""); }).filter((r) => r.replace(/[ |]/g, ""));
      if (rows.length) out.push(`Sheet: ${names[sheet] ?? `Sheet ${sheet + 1}`}`, ...rows, "");
    }
    grid = new Map();
  };
  const put = (r: number, col: number, v: string) => { if (!grid.has(r)) grid.set(r, new Map()); grid.get(r)!.set(col, v); };
  let pendingFormula: [number, number] | null = null;
  for (const { t, d } of records) {
    if (t === 0x0809 && u16(d, 2) === 0x0010) { flush(); sheet++; }
    else if (sheet < 0) continue;
    else if (t === 0x00fd) put(u16(d, 0), u16(d, 2), sst[u32(d, 6)] ?? "");
    else if (t === 0x0203) put(u16(d, 0), u16(d, 2), num(f64(d, 6)));
    else if (t === 0x027e) put(u16(d, 0), u16(d, 2), num(rk(u32(d, 6))));
    else if (t === 0x00bd) { const r = u16(d, 0), first = u16(d, 2); for (let k = 0; 4 + k * 6 + 6 <= d.length - 2; k++) put(r, first + k, num(rk(u32(d, 4 + k * 6 + 2)))); }
    else if (t === 0x0204) { const n = u16(d, 6), wide = d[8] & 1; put(u16(d, 0), u16(d, 2), wide ? utf16.decode(d.subarray(9, 9 + n * 2)) : cp1252.decode(d.subarray(9, 9 + n))); }
    else if (t === 0x0006) { if (u16(d, 12) === 0xffff && d[6] === 0) pendingFormula = [u16(d, 0), u16(d, 2)]; else if (u16(d, 12) !== 0xffff) put(u16(d, 0), u16(d, 2), num(f64(d, 6))); }
    else if (t === 0x0207 && pendingFormula) { const n = u16(d, 0), wide = d[2] & 1; put(pendingFormula[0], pendingFormula[1], wide ? utf16.decode(d.subarray(3, 3 + n * 2)) : cp1252.decode(d.subarray(3, 3 + n))); pendingFormula = null; }
  }
  flush();
  return out.join("\n").trim();
}

const u16 = (b: Uint8Array, i: number) => b[i] | (b[i + 1] << 8);
const u32 = (b: Uint8Array, i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
const cp1252 = new TextDecoder("windows-1252");
const utf16 = new TextDecoder("utf-16le");

/** The words of a Word 97 to 2003 file: the main text through its piece table, field codes left out, tables as rows. */
export function docText(b: Uint8Array): string {
  const c = open(b);
  if (!c) return "";
  const root = c.FullPaths[0];
  const word = bytes(at(c, `${root}WordDocument`));
  if (!word) return "";
  const table = bytes(at(c, `${root}${word[0x0b] & 0x02 ? "1Table" : "0Table"}`));
  if (!table) return "";
  // The FIB: fixed part, then counted blocks of shorts, longs and (offset, length) pairs. ccpText is the fourth long;
  // the piece table (Clx) is the 34th pair.
  const csw = u16(word, 32), lw = 34 + csw * 2, cslw = u16(word, lw), longs = lw + 2;
  const ccpText = u32(word, longs + 12);
  const pairs = longs + cslw * 4 + 2;
  const fcClx = u32(word, pairs + 33 * 8), lcbClx = u32(word, pairs + 33 * 8 + 4);
  if (!lcbClx || fcClx + lcbClx > table.length) return "";
  let i = fcClx;
  while (table[i] === 0x01) i += 3 + u16(table, i + 1); // formatting runs before the piece table
  if (table[i] !== 0x02) return "";
  const lcb = u32(table, i + 1), base = i + 5, n = Math.floor((lcb - 4) / 12);
  let text = "";
  for (let k = 0; k < n && text.length < ccpText; k++) {
    const cpStart = u32(table, base + k * 4), cpEnd = u32(table, base + (k + 1) * 4);
    const fcRaw = u32(table, base + (n + 1) * 4 + k * 8 + 2);
    const len = cpEnd - cpStart;
    if (len <= 0) continue;
    if (fcRaw & 0x40000000) { const s = (fcRaw & 0x3fffffff) / 2; text += cp1252.decode(word.subarray(s, s + len)); }
    else text += utf16.decode(word.subarray(fcRaw, fcRaw + len * 2));
  }
  text = text.slice(0, ccpText || text.length);
  // Fields keep only their result ({ HYPERLINK "..." } shows its words); then Word's marks become plain text.
  text = text.replace(/\x13[^\x13\x14\x15]*\x14([^\x13\x15]*)\x15/g, "$1").replace(/\x13[^\x13\x15]*\x15/g, "");
  text = text.replace(/\x07\r?\x07/g, "\n").replace(/\x07/g, " | ").replace(/[\r\x0b\x0c]/g, "\n").replace(/\x1e/g, "-").replace(/\x1f/g, "")
    .replace(/[\x00-\x08\x0e-\x1d]/g, "");
  return text.split("\n").map((l) => l.replace(/( \| )+$/, "").trimEnd()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

// Outlook keeps each property of a message in its own stream, named by tag: 001F is text in UTF-16, 001E in the
// sender's code page, 0102 raw bytes.
function prop(c: Container, dir: string, tag: string): string {
  const w = bytes(at(c, `${dir}__substg1.0_${tag}001F`));
  if (w) return utf16.decode(w).replace(/\0+$/, "");
  const a = bytes(at(c, `${dir}__substg1.0_${tag}001E`));
  return a ? cp1252.decode(a).replace(/\0+$/, "") : "";
}

/** RTF compressed the way Outlook stores it (LZFu); the message body when no plain text copy is kept. */
function lzfu(b: Uint8Array): string {
  if (b.length < 16) return "";
  const raw = u32(b, 4), type = u32(b, 8);
  if (type === 0x414c454d) return cp1252.decode(b.subarray(16, 16 + raw)); // stored, not compressed
  if (type !== 0x75465a4c) return "";
  const seed = "{\\rtf1\\ansi\\mac\\deff0\\deftab720{\\fonttbl;}{\\f0\\fnil \\froman \\fswiss \\fmodern \\fscript \\fdecor MS Sans SerifSymbolArialTimes New RomanCourier{\\colortbl\\red0\\green0\\blue0\r\n\\par \\pard\\plain\\f0\\fs20\\b\\i\\u\\tab\\tx";
  const dict = new Uint8Array(4096);
  for (let k = 0; k < seed.length; k++) dict[k] = seed.charCodeAt(k);
  let w = seed.length, i = 16;
  const out: number[] = [];
  while (i < b.length && out.length < raw) {
    const flags = b[i++];
    for (let bit = 0; bit < 8 && i < b.length && out.length < raw; bit++) {
      if (flags & (1 << bit)) {
        const ref = (b[i] << 8) | b[i + 1]; i += 2;
        const off = ref >> 4, len = (ref & 0xf) + 2;
        if (off === w % 4096) return cp1252.decode(Uint8Array.from(out));
        for (let k = 0; k < len; k++) { const x = dict[(off + k) % 4096]; out.push(x); dict[w++ % 4096] = x; }
      } else { const x = b[i++]; out.push(x); dict[w++ % 4096] = x; }
    }
  }
  return cp1252.decode(Uint8Array.from(out));
}

/** When the message was sent, from its fixed size properties (a FILETIME). */
function sentAt(c: Container): string {
  const p = bytes(at(c, `${c.FullPaths[0]}__properties_version1.0`));
  if (!p) return "";
  for (let i = 32; i + 16 <= p.length; i += 16) {
    if (u32(p, i) !== 0x00390040 && u32(p, i) !== 0x0e060040) continue;
    const ft = u32(p, i + 8) + u32(p, i + 12) * 2 ** 32;
    const ms = ft / 10_000 - 11_644_473_600_000;
    if (ms > 0 && ms < 4e12) return new Date(ms).toUTCString().replace(/:\d\d GMT$/, " GMT");
  }
  return "";
}

/** An Outlook message as the email it is (from, to, date, subject, body) and its attached files. */
export function msgParts(b: Uint8Array): { text: string; attachments: { name: string; data: Uint8Array; inline: boolean }[] } {
  const c = open(b);
  if (!c) return { text: "", attachments: [] };
  const root = c.FullPaths[0];
  const from = [prop(c, root, "0C1A"), prop(c, root, "5D01") || prop(c, root, "0065")].filter(Boolean);
  let body = prop(c, root, "1000");
  if (!body.trim()) { const h = bytes(at(c, `${root}__substg1.0_10130102`)); if (h) body = htmlText(new TextDecoder().decode(h)); }
  if (!body.trim()) { const r = bytes(at(c, `${root}__substg1.0_10090102`)); if (r) body = rtfText(lzfu(r)); }
  const head = [
    from.length && `From: ${from[0]}${from[1] && from[1] !== from[0] ? ` <${from[1]}>` : ""}`,
    prop(c, root, "0E04") && `To: ${prop(c, root, "0E04")}`,
    prop(c, root, "0E03") && `Cc: ${prop(c, root, "0E03")}`,
    sentAt(c) && `Date: ${sentAt(c)}`,
    prop(c, root, "0037") && `Subject: ${prop(c, root, "0037")}`,
  ].filter(Boolean);
  const attachments: { name: string; data: Uint8Array; inline: boolean }[] = [];
  const dirs = c.FullPaths.filter((p) => /\/__attach_version1\.0_#[0-9A-F]{8}\/$/i.test(p) && p.split("/").length === root.split("/").length + 1);
  for (const dir of dirs.slice(0, 50)) {
    const data = bytes(at(c, `${dir}__substg1.0_37010102`));
    const name = prop(c, dir, "3707") || prop(c, dir, "3704") || "an attachment";
    const inline = Boolean(prop(c, dir, "3712"));
    if (data) attachments.push({ name, data, inline });
  }
  const names = dirs.map((d) => prop(c, d, "3707") || prop(c, d, "3704")).filter(Boolean);
  if (names.length) head.push(`Attachments: ${names.join(", ")}`);
  const text = `${head.join("\n")}\n\n${body.replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim()}`.trim();
  return { text, attachments };
}
