// Reading JSON out of model replies. No imports, so tests can load it directly.

/** Pulls the JSON object out of a model reply, tolerating code fences or stray text around it. A long reply
 *  with a quote mark left unescaped inside a text value, or a raw line break in one, is repaired rather
 *  than thrown away: one stray character must not cost a whole file reading. */
export function parseJson<T>(text: string): T {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("The model reply was not in the expected format.");
  const raw = text.slice(a, b + 1);
  try {
    return JSON.parse(raw) as T;
  } catch (e) {
    try { return JSON.parse(repairJson(raw)) as T; } catch { throw e; }
  }
}

/** Escapes quote marks and control characters inside strings. A quote ends a string only when what follows
 *  it can follow a string in JSON (a comma, colon, closing bracket or the end); otherwise it is text. */
export function repairJson(s: string): string {
  let out = "", inStr = false;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (!inStr) {
      out += ch;
      if (ch === '"') inStr = true;
      continue;
    }
    if (ch === "\\") { out += ch + (s[i + 1] ?? ""); i++; continue; }
    if (ch === '"') {
      const rest = s.slice(i + 1).match(/^\s*(.)/)?.[1];
      if (rest === undefined || ",:}]".includes(rest)) { out += ch; inStr = false; } else out += '\\"';
      continue;
    }
    if (ch === "\n") { out += "\\n"; continue; }
    if (ch === "\r") { out += "\\r"; continue; }
    if (ch === "\t") { out += "\\t"; continue; }
    out += ch;
  }
  // A trailing comma before a closing bracket is dropped.
  return out.replace(/,(\s*[}\]])/g, "$1");
}
