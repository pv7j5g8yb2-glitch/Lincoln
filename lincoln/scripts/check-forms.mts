// Reads every official form in lincoln/forms and reports what Lincoln sees: fields, kinds, labels.
// Run: node --experimental-strip-types --no-warnings scripts/check-forms.mts
import fs from "node:fs";
import { execSync } from "node:child_process";
import { fieldsOf, fillPdf, formsDir } from "../src/lib/forms.ts";
const quiet = console.log; console.warn = () => {};
for (const f of fs.readdirSync(formsDir()).filter((x) => x.endsWith(".pdf") && !x.includes("-instr") && x !== "m-752.pdf").sort()) {
  const bytes = new Uint8Array(fs.readFileSync(`${formsDir()}/${f}`));
  try {
    const fields = await fieldsOf(bytes);
    const kinds = fields.reduce((m: Record<string, number>, x) => ((m[x.kind] = (m[x.kind] ?? 0) + 1), m), {});
    const weak = fields.filter((x) => !/[a-z]{3,}.*[a-z]{3,}/i.test(x.label) || x.label === x.name).length;
    const first = fields.find((x) => x.kind === "text");
    const out = await fillPdf(bytes, first ? [{ name: first.name, value: "Test" }] : []);
    fs.writeFileSync("/tmp/lincoln-check.pdf", out);
    quiet(`${f.padEnd(14)} fields ${String(fields.length).padStart(4)}  text ${kinds.text ?? 0}  check ${kinds.check ?? 0}  choice ${kinds.choice ?? 0}  weak labels ${weak}  filled ${out.length > 0 ? "ok" : "no"}  ${execSync("pdftotext /tmp/lincoln-check.pdf /dev/null 2>&1 || true").toString().trim() ? "PDF WARNINGS" : "clean"}`);
  } catch (e) {
    quiet(`${f.padEnd(14)} FAILED ${(e as Error).message}`);
  }
}
