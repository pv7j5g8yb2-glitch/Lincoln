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

/** "doc" for a readable Word 97 to 2003 file, "msg" for an Outlook message, otherwise null (encrypted, Excel 97, etc). */
export function oleKind(b: Uint8Array): "doc" | "msg" | null {
  const c = open(b);
  if (!c) return null;
  const word = bytes(at(c, `${c.FullPaths[0]}WordDocument`));
  if (word && word.length > 0x20) return word[0x0b] & 0x01 ? null : "doc"; // fEncrypted: a password protected file
  if (c.FullPaths.some((p) => /\/__substg1\.0_[0-9A-F]{8}$/i.test(p))) return "msg";
  return null;
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
