// Saved and forwarded emails (.eml, or an email attached to an email): the message as it reads, and its attachments
// as files, so an offer letter or an approval notice forwarded inside another email is read like any other document.

type Part = { headers: Map<string, string>; body: Buffer };

const MAX_PARTS = 60;

function split(raw: Buffer): Part {
  const text = raw.toString("latin1");
  const end = text.search(/\r?\n\r?\n/);
  const head = end < 0 ? text : text.slice(0, end);
  const bodyStart = end < 0 ? raw.length : end + (text.slice(end, end + 4).startsWith("\r\n\r\n") ? 4 : text[end] === "\r" ? 3 : 2);
  const headers = new Map<string, string>();
  for (const line of head.replace(/\r?\n[ \t]+/g, " ").split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) headers.set(line.slice(0, i).trim().toLowerCase(), line.slice(i + 1).trim());
  }
  return { headers, body: raw.subarray(bodyStart) };
}

const param = (v: string, name: string) => {
  const star = new RegExp(`${name}\\*=(?:[^']*'[^']*')?("?)([^";]+)\\1`, "i").exec(v);
  if (star) { try { return decodeURIComponent(star[2]); } catch { return star[2]; } }
  return new RegExp(`${name}=("?)([^";]*)\\1`, "i").exec(v)?.[2] ?? "";
};

/** =?UTF-8?B?...?= and =?UTF-8?Q?...?= in headers and file names. */
export function decodeWords(s: string) {
  return s.replace(/(\?=)\s+(?==\?)/g, "$1").replace(/=\?([^?]+)\?([BQ])\?([^?]*)\?=/gi, (_, cs: string, enc: string, data: string) => {
    const bytes = enc.toUpperCase() === "B" ? Buffer.from(data, "base64") : Buffer.from(data.replace(/_/g, " ").replace(/=([0-9A-F]{2})/gi, (_m, h) => String.fromCharCode(parseInt(h, 16))), "latin1");
    try { return new TextDecoder(cs.toLowerCase()).decode(bytes); } catch { return bytes.toString("utf8"); }
  });
}

function decodeBody(p: Part): Buffer {
  const enc = (p.headers.get("content-transfer-encoding") ?? "").toLowerCase();
  if (enc === "base64") return Buffer.from(p.body.toString("latin1").replace(/[^A-Za-z0-9+/=]/g, ""), "base64");
  if (enc === "quoted-printable") return Buffer.from(p.body.toString("latin1").replace(/=\r?\n/g, "").replace(/=([0-9A-F]{2})/gi, (_, h) => String.fromCharCode(parseInt(h, 16))), "latin1");
  return p.body;
}

const charsetText = (b: Buffer, type: string) => {
  const cs = param(type, "charset") || "utf-8";
  try { return new TextDecoder(cs.toLowerCase()).decode(b); } catch { return b.toString("utf8"); }
};

export const htmlText = (h: string) => h.replace(/<!--[\s\S]*?-->/g, "").replace(/<(script|style|head|xml)[\s\S]*?<\/\1>/gi, "").replace(/<br\s*\/?>|<\/(p|div|tr|li|h\d|blockquote)>/gi, "\n").replace(/<\/t[dh]>/gi, " | ")
  .replace(/<[^>]+>/g, "").replace(/&nbsp;/g, " ").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n))).replace(/&amp;/g, "&")
  .replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");

/** True when the bytes are an email saved as a file (headers, then a body), not any other text. */
export function looksLikeEmail(b: Uint8Array) {
  const head = Buffer.from(b.subarray(0, 4096)).toString("latin1");
  return /^(?:[\w-]+:.*\r?\n(?:[ \t].*\r?\n)*)+/.test(head) && /^from:/im.test(head) && /^(?:mime-version|content-type|subject|date|received|to):/im.test(head);
}

/** The email as it reads (from, to, date, subject, body) and its attached files. */
export function emlParts(raw: Uint8Array): { text: string; attachments: { name: string; data: Uint8Array }[] } {
  const top = split(Buffer.from(raw));
  let plain = "", html = "";
  const attachments: { name: string; data: Uint8Array }[] = [];
  let count = 0;
  const walk = (p: Part, depth: number) => {
    if (++count > MAX_PARTS || depth > 6) return;
    const type = p.headers.get("content-type") ?? "text/plain";
    const disp = p.headers.get("content-disposition") ?? "";
    const name = decodeWords(param(disp, "filename") || param(type, "name"));
    if (/^multipart\//i.test(type)) {
      const boundary = param(type, "boundary");
      if (!boundary) return;
      const parts = p.body.toString("latin1").split(new RegExp(`\\r?\\n?--${boundary.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:--)?[ \\t]*\\r?\\n?`));
      for (const s of parts.slice(1)) if (s.trim()) walk(split(Buffer.from(s, "latin1")), depth + 1);
      return;
    }
    const isAttachment = /attachment/i.test(disp) || (name && !/^text\/(plain|html)/i.test(type));
    if (isAttachment) {
      const data = decodeBody(p);
      // A logo in a signature is not a document.
      const logo = /^image\//i.test(type) && p.headers.has("content-id") && !/attachment/i.test(disp);
      if (!logo && data.length && attachments.length < 30) attachments.push({ name: name || (/^message\/rfc822/i.test(type) ? "Attached email.eml" : "an attachment"), data: new Uint8Array(data) });
      return;
    }
    if (/^message\/rfc822/i.test(type)) { attachments.push({ name: "Attached email.eml", data: new Uint8Array(decodeBody(p)) }); return; }
    if (/^text\/plain/i.test(type) && !plain) plain = charsetText(decodeBody(p), type);
    else if (/^text\/html/i.test(type) && !html) html = charsetText(decodeBody(p), type);
  };
  walk(top, 0);
  const h = (n: string) => decodeWords(top.headers.get(n) ?? "");
  const head = [["From", h("from")], ["To", h("to")], ["Cc", h("cc")], ["Date", h("date")], ["Subject", h("subject")]].filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`);
  if (attachments.length) head.push(`Attachments: ${attachments.map((a) => a.name).join(", ")}`);
  const body = (plain || htmlText(html)).replace(/\r\n?/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  return { text: `${head.join("\n")}\n\n${body}`.trim(), attachments };
}

const cp1252 = new TextDecoder("windows-1252");

/** The words of an RTF document. Outlook's HTML email wrapped in RTF (\\fromhtml) is unwrapped back to its text. */
export function rtfText(t: string): string {
  // Escaped braces and backslashes stand aside first, so they are neither groups nor control words.
  t = t.replace(/\\([{}\\])/g, (_, c: string) => ({ "{": "", "}": "", "\\": "" })[c]!);
  const html = /\\fromhtml1/.test(t);
  if (html) t = t.replace(/\\htmlrtf(?!0)\d*\s?[\s\S]*?\\htmlrtf0 ?/g, "").replace(/\{\\\*\\htmltag\d* ?((?:[^{}\\]|\\'[0-9a-f]{2}|\\(?:par|tab|line)\b ?)*)\}/gi, "$1");
  t = t.replace(/\{\\(?:fonttbl|colortbl|stylesheet|info|listtable|listoverridetable|rsidtbl|generator)(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g, "")
    .replace(/\{\\\*(?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*\}/g, "")
    .replace(/\\(?:par|line)\b ?/g, "\n").replace(/\\tab\b ?/g, "\t").replace(/\\cell\b ?/g, " | ").replace(/\\row\b ?/g, "\n")
    .replace(/\\'([0-9a-f]{2})/gi, (_, h: string) => cp1252.decode(Uint8Array.of(parseInt(h, 16))))
    .replace(/\\u(-?\d+)\??/g, (_, n: string) => String.fromCharCode((Number(n) + 65536) % 65536))
    .replace(/\\[a-z]+-?\d* ?/gi, "").replace(/\\./g, "").replace(/[{}]/g, "")
    .replace(//g, "{").replace(//g, "}").replace(//g, "\\");
  if (html) return htmlText(t.replace(/\s+/g, " ")).split("\n").map((l) => l.trim()).join("\n").replace(/\n{3,}/g, "\n\n").trim();
  return t.replace(/\n{3,}/g, "\n\n").trim();
}

/** The files inside winmail.dat, the wrapper some Outlook setups put around every attachment. */
export function tnefFiles(b: Uint8Array): { name: string; data: Uint8Array }[] {
  const u32 = (i: number) => (b[i] | (b[i + 1] << 8) | (b[i + 2] << 16) | (b[i + 3] << 24)) >>> 0;
  if (b.length < 6 || u32(0) !== 0x223e9f78) return [];
  const files: { name: string; data?: Uint8Array }[] = [];
  // After the signature and key: attributes of level (1 byte), id (4), length (4), data, checksum (2). Each attachment
  // starts with its rendering record; its name and its data follow in either order.
  for (let i = 6; i + 9 <= b.length && files.length <= 30;) {
    const id = u32(i + 1), len = u32(i + 5), data = b.subarray(i + 9, i + 9 + len);
    if (id === 0x00069002) files.push({ name: "" });
    else if (id === 0x00018010 && files.length) files[files.length - 1].name = new TextDecoder("windows-1252").decode(data).replace(/\0+$/, "");
    else if (id === 0x0006800f && files.length) files[files.length - 1].data = new Uint8Array(data);
    i += 9 + len + 2;
  }
  return files.filter((f) => f.data?.length).map((f) => ({ name: f.name || "an attachment", data: f.data! }));
}
