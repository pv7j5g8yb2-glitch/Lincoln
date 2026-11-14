// The form engine on a USCIS shaped test form: read fields with labels, normalise, fill, read back.
import assert from "node:assert";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { PDFDocument } from "pdf-lib";
import { makeForm } from "./make-form.mjs";
import { fieldsOf, fillPdf, normalise } from "../src/lib/forms.ts";

const file = path.join(os.tmpdir(), `lincoln-g28-${process.pid}.pdf`);
await makeForm(file);
const bytes = new Uint8Array(fs.readFileSync(file));
const fields = await fieldsOf(bytes);
assert.equal(fields.length, 9);
const last = fields.find((f) => f.name.endsWith("Pt3Line5a_FamilyName[0]"));
assert.equal(last.label, "Part 3. Client Information. 5.a. Family Name (Last Name).");
assert.equal(last.kind, "text");
assert.equal(fields.find((f) => f.kind === "check").label.startsWith("Part 2. 1.a."), true);
assert.deepEqual(fields.find((f) => f.kind === "choice").options, ["USCIS", "ICE", "CBP"]);
const dob = fields.find((f) => /Date of Birth/.test(f.label));
assert.equal(normalise(dob, "1990-04-17"), "04/17/1990");
const anum = fields.find((f) => /A-Number/.test(f.label));
assert.equal(anum.max, 9);
assert.equal(normalise(anum, "A012345678"), "012345678");
assert.equal(normalise(anum, "A0123456789"), "");
assert.equal(normalise(last, "x".repeat(10)), "x".repeat(10));
const out = await fillPdf(bytes, [
  { name: last.name, value: "HADDOU" },
  { name: dob.name, value: "04/17/1990" },
  { name: fields.find((f) => f.kind === "check").name, value: "yes" },
  { name: fields.find((f) => f.kind === "choice").name, value: "USCIS" },
  { name: anum.name, value: "A0123456789" },
  { name: fields.find((f) => /Bar Number/.test(f.label)).name, value: "CA123456" },
  { name: "no.such.field", value: "x" },
]);
const back = (await PDFDocument.load(out)).getForm();
assert.equal(back.getTextField(last.name).getText(), "HADDOU");
assert.equal(back.getTextField(anum.name).getText(), undefined);
assert.equal(back.getTextField(fields.find((f) => /Bar Number/.test(f.label)).name).getText(), "CA123456");
assert.equal(back.getCheckBox(fields.find((f) => f.kind === "check").name).isChecked(), true);
assert.equal(back.getRadioGroup(fields.find((f) => f.kind === "choice").name).getSelected(), "USCIS");
fs.unlinkSync(file);
console.log("all form tests passed");
