// Reading JSON out of model replies. No imports, so tests can load it directly.

/** Pulls the JSON object out of a model reply, tolerating code fences or stray text around it. A long reply
 *  with a small slip (a quote mark left unescaped inside a text value, a raw line break, a missing comma,
 *  a page range written as 48-49 in a list of pages) is repaired rather than thrown away: one stray
 *  character must not cost a whole file reading. */
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

/**
 * Rewrites near-JSON into JSON, one character at a time, keeping track of whether it is inside a string
 * and whether it is in a list or an object:
 * - a quote ends a string only when what follows can follow a string; otherwise it is escaped as text;
 * - line breaks and tabs inside strings are escaped;
 * - a value that starts right after another value gets the missing comma;
 * - in a list, a page range such as 48-49 becomes 48, 49, and "p. 12" becomes 12;
 * - trailing commas are dropped.
 */
export function repairJson(s: string): string {
  let out = "";
  const stack: string[] = [];
  let inStr = false, afterValue = false;
  const inList = () => stack[stack.length - 1] === "[";
  const startValue = () => { if (afterValue) out += ","; afterValue = false; };
  // Sticky patterns read at the current position without copying the rest of the text.
  const at = (re: RegExp, i: number) => { re.lastIndex = i; return re.exec(s); };
  const ENDS = /\s*(?:[,:}\]]|$|"[^"\n]{0,80}"\s*:)/y, PAGE = /p{1,2}\.\s*(?=\d)/iy, NUM = /-?\d+(\.\d+)?([eE][+-]?\d+)?/y, RANGE = /(\d+)\s*[-–]\s*(\d+)/y, LIT = /true|false|null/y;
  for (let i = 0; i < s.length; i++) {
    const ch = s[i];
    if (inStr) {
      if (ch === "\\") { out += ch + (s[i + 1] ?? ""); i++; continue; }
      if (ch === '"') {
        // A quote ends the string when what follows can follow a string, including the next key ("key":)
        // when the comma between them is missing.
        if (at(ENDS, i + 1)) { out += ch; inStr = false; afterValue = true; }
        else out += '\\"';
        continue;
      }
      out += ch === "\n" ? "\\n" : ch === "\r" ? "\\r" : ch === "\t" ? "\\t" : ch;
      continue;
    }
    if (/\s/.test(ch)) { out += ch; continue; }
    if (ch === '"') { startValue(); inStr = true; out += ch; continue; }
    if (ch === "{" || ch === "[") { startValue(); stack.push(ch); out += ch; continue; }
    if (ch === "}" || ch === "]") {
      out = out.replace(/,\s*$/, ""); // trailing comma
      stack.pop(); out += ch; afterValue = true; continue;
    }
    if (ch === ",") { if (afterValue) out += ch; afterValue = false; continue; }
    if (ch === ":") { out += ch; afterValue = false; continue; }
    // "p. 12" or "pp. 12" in a list of pages
    const page = inList() ? at(PAGE, i) : null;
    if (page) { i += page[0].length - 1; continue; }
    const num = at(NUM, i);
    if (num) {
      startValue();
      const range = inList() ? at(RANGE, i) : null;
      if (range && Number(range[2]) >= Number(range[1]) && Number(range[2]) - Number(range[1]) <= 60) {
        const nums: number[] = [];
        for (let n = Number(range[1]); n <= Number(range[2]); n++) nums.push(n);
        out += nums.join(", ");
        i += range[0].length - 1;
      } else {
        out += num[0];
        i += num[0].length - 1;
      }
      afterValue = true;
      continue;
    }
    const lit = at(LIT, i);
    if (lit) { startValue(); out += lit[0]; i += lit[0].length - 1; afterValue = true; continue; }
    out += ch; // anything else is left for the parser to judge
  }
  return out;
}

/** The text around the point where parsing failed, for diagnosing test runs. */
export function errorContext(text: string, err: unknown) {
  const a = text.indexOf("{");
  const pos = Number(/position (\d+)/.exec(err instanceof Error ? err.message : "")?.[1] ?? -1);
  if (a < 0 || pos < 0) return "";
  const at = a + pos;
  return JSON.stringify(text.slice(Math.max(0, at - 220), at + 120));
}
