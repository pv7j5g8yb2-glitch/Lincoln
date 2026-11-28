// Form guards on the real USCIS forms in lincoln/forms: run with npm test. An answer is written only into the box it was
// meant for, only with the shape that box takes, only once per single choice question, and only if it fits the box.
import assert from "node:assert";
import fs from "node:fs";
import { PDFDocument, PDFTextField } from "@cantoo/pdf-lib";
import { answersFor, dropContradictions, fieldsOf, fillPdf, keyOf, normalise, unplaceable, withCopies } from "../src/lib/forms.ts";

const load = async (code) => { const bytes = new Uint8Array(fs.readFileSync(new URL(`../forms/${code}.pdf`, import.meta.url))); return { bytes, fields: await fieldsOf(bytes) }; };
const i130 = await load("i-130");
const at = (fields, key) => { const i = fields.findIndex((f) => keyOf(f.name) === key); assert.ok(i >= 0, `no box ${key}`); return i; };
const answer = (fields, key, value, i = at(fields, key)) => answersFor([{ i, key, value, source: "p. 1" }], fields);

// The right answer in the right box is kept.
assert.equal(answer(i130.fields, "Pt2Line10_StreetNumberName", "4821 West Riverside Boulevard")[0]?.value, "4821 West Riverside Boulevard");
assert.equal(answer(i130.fields, "Pt2Line8_DateofBirth", "1990-01-15")[0]?.value, "01/15/1990");
assert.equal(answer(i130.fields, "Pt2Line10_ZipCode", "78201").length, 1);
// An answer whose key is not its box's own (meant for the neighbouring box) is never written.
assert.equal(answer(i130.fields, "Pt2Line10_StreetNumberName", "78201", at(i130.fields, "Pt2Line10_ZipCode")).length, 0);
assert.equal(answersFor([{ i: at(i130.fields, "Pt2Line10_ZipCode"), value: "78201" }], i130.fields).length, 0, "an answer with no key is dropped");
// A value of the wrong shape for its box is a sign it is in the wrong place, and is never written.
assert.equal(answer(i130.fields, "Pt2Line10_StreetNumberName", "TX").length, 0, "a state in a street box");
assert.equal(answer(i130.fields, "Pt2Line8_DateofBirth", "02/30/1990").length, 0, "an impossible date");
assert.equal(answer(i130.fields, "Pt2Line8_DateofBirth", "San Antonio").length, 0, "a place in a date box");
assert.equal(answer(i130.fields, "Pt2Line4a_FamilyName", "01/15/1990").length, 0, "a date in a name box");
assert.equal(answer(i130.fields, "Pt2Line10_ZipCode", "Texas").length, 0, "a word in a ZIP box");

// The G-28 box keyed Line6_EMail is the mobile telephone box: the label decides, never the key.
const g28 = await load("g-28");
assert.equal(answer(g28.fields, "Line6_EMail", "maria.hernandez@example.com").length, 0);
assert.equal(answer(g28.fields, "Line6_EMail", "(210) 555-0147")[0]?.value, "2105550147");
// Split telephone boxes on the I-589 take their own parts.
const i589 = await load("i-589");
assert.equal(answer(i589.fields, "PtAILine8_AreaCode", "210").length, 1);
assert.equal(answer(i589.fields, "PtAILine8_AreaCode", "2105550147").length, 0);

// Two boxes ticked for a question that takes one: neither is kept, the attorney decides.
const tick = (key) => ({ ...i130.fields[at(i130.fields, key)], value: "yes", source: "p. 1" });
assert.equal(dropContradictions([tick("Pt2Line9_Male"), tick("Pt2Line9_Female")]).length, 0);
assert.equal(dropContradictions([tick("Pt2Line9_Male")]).length, 1);

// A street too long for its box takes USPS abbreviations; a value that cannot fit at a readable size is never cut.
const street = { label: "Enter Street Number and Name.", kind: "text", max: 25, name: "x" };
assert.equal(normalise(street, "4821 West Riverside Boulevard"), "4821 W Riverside Blvd");
const zip = i130.fields[at(i130.fields, "Pt2Line10_StreetNumberName")];
const long = [{ name: zip.name, value: "4821 West Riverside Boulevard Northwest Extension Building C" }];
assert.ok((await unplaceable(i130.bytes, long)).has(zip.name), "a value too wide for its box is left blank");
// A value a little too wide is set slightly smaller, inside the box.
const family = i130.fields[at(i130.fields, "Pt2Line4a_FamilyName")];
const filled = await PDFDocument.load(await fillPdf(i130.bytes, [{ name: family.name, value: "Hernandez Castellanos de la Fuente" }]));
const box = filled.getForm().getFields().find((f) => f.getName() === family.name);
assert.ok(box instanceof PDFTextField && box.getText() === "Hernandez Castellanos de la Fuente");

// Header boxes that copy the A-Number from page 1 are filled from it.
const i485 = await load("i-485");
const src = i485.fields[at(i485.fields, "Pt1Line4_AlienNumber")];
const copies = withCopies([{ name: src.name, label: src.label, value: "123456789", source: "p. 1" }], i485.fields);
assert.ok(copies.length > 10, "every page header A-Number is filled");

// Every label keeps the box's own description: a long label keeps its end, where the box is named.
for (const code of ["i-130", "i-485", "i-129", "n-400"]) for (const f of (await load(code)).fields) assert.ok(f.label.length <= 300 + 3, `${code} ${f.name} label too long`);
console.log("all form guard tests passed");
