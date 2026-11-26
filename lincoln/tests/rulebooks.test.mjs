// Rulebooks: run with npm test. Every case type Lincoln knows and every official code must lead to a complete
// rulebook in the same four parts: the law, the tests in order, the evidence that proves them, the traps.
import fs from "node:fs";
import assert from "node:assert";
import { LIBRARY } from "../src/lib/library.ts";
import { OFFICIAL_CODES } from "../src/lib/codes.ts";
import { EVIDENCE } from "../src/lib/rulebook-evidence.ts";

const src = fs.readFileSync(new URL("../src/lib/rulebooks.ts", import.meta.url), "utf8");
// Each rulebook: "CODE": { cites: [...], rules: "..." or `...` }
const books = new Map();
for (const m of src.matchAll(/^ {2}"([^"]+)": \{ cites: \[([^\]]*)\], rules: ("(?:[^"\\]|\\.)*"|`[^`]*`) \},?$/gm)) {
  books.set(m[1], { cites: m[2].trim(), rules: m[3].slice(1, -1) });
}
const declared = [...src.matchAll(/^ {2}"([^"]+)": \{ cites:/gm)].map((m) => m[1]);
assert.equal(books.size, declared.length, `rulebooks the test could not read: ${declared.filter((k) => !books.has(k)).join(", ")}`);

// Matters with no statute or regulation of their own (advice, historic acts outside the INA, practice).
const NO_LAW = new Set(["Consultation", "Status planning", "I-824", "LRIF", "SP", "Private bill", "DHS TRIP", "EAJA", "NACARA 202", "EOIR-40", "Ineffective assistance"]);

const problems = [];
for (const [code] of LIBRARY.flatMap((f) => f.types)) if (!books.has(code)) problems.push(`${code}: in the library with no rulebook`);
for (const c of OFFICIAL_CODES) for (const k of c.rulebooks) if (!books.has(k)) problems.push(`${c.code}: points to missing rulebook ${k}`);
for (const [k, b] of books) {
  if (b.rules.trim().length < 40) problems.push(`${k}: tests too thin`);
  if (!b.cites && !NO_LAW.has(k)) problems.push(`${k}: no governing law cited`);
  const ev = EVIDENCE[k];
  if (!ev || ev[0].trim().length < 15) problems.push(`${k}: no evidence part`);
  if (!ev || (!ev[1].trim() && !/Traps?:/.test(b.rules))) problems.push(`${k}: no traps part`);
}
for (const k of Object.keys(EVIDENCE)) if (!books.has(k)) problems.push(`${k}: evidence for a rulebook that does not exist`);
assert.deepEqual(problems, [], problems.join("\n"));

// A consultation names its case type in words: that type's own rulebook must come with it (the appeal test cases all
// opened as consultations and got none, 2026-11-26).
const { register } = await import("node:module");
register("./eval/loader.mjs", import.meta.url);
const { rulebooksFor } = await import("../src/lib/rulebooks.ts");
const got = (text) => rulebooksFor("Consultation Initial consultation", text)?.codes ?? [];
for (const [text, want] of [
  ["H-1B petition for a nursing assistant", "H-1B"], ["O-1A petition for an export director", "O-1A"],
  ["EB-1A self petition, Form I-140", "EB-1A"], ["EB-2 national interest waiver for a researcher", "EB-2 NIW"],
  ["EB-1C multinational manager", "EB-1C"], ["U visa, substantial abuse", "I-918"], ["T-1 status for a hotel worker", "I-914"],
  ["VAWA self petition by an abused spouse", "I-360 VAWA"],
]) assert.ok(got(text).includes(want), `${text}: expected ${want}, got ${got(text).join(", ")}`);
assert.ok(!got("EB-2 NIW petition").includes("EB-2"), "EB-2 NIW must not also pull in EB-2");
assert.ok(!got("VAWA cancellation of removal").includes("I-360 VAWA"), "VAWA cancellation is not the I-360");
console.log(`all rulebook tests passed (${books.size} rulebooks, ${OFFICIAL_CODES.length} official codes)`);
