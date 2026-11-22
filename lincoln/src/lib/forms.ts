import fs from "node:fs";
import path from "node:path";
import { PDFCheckBox, PDFDict, PDFDocument, PDFDropdown, PDFHexString, PDFName, PDFOptionList, PDFRadioGroup, PDFString, PDFTextField, StandardFonts, type PDFFont } from "@cantoo/pdf-lib";

// Official forms are filled in their own fillable PDF: every field is read with its label, answered
// from the case and written back, so the attorney gets the real form, editable, not a copy of it.
// The blank forms are kept in lincoln/forms (see the README there); USCIS does not allow automated
// downloads, so a person adds each new edition.

export const FORM_TITLES: Record<string, string> = {
  "G-28": "Notice of Entry of Appearance as Attorney",
  "I-129": "Petition for a Nonimmigrant Worker",
  "I-129F": "Petition for Alien Fiancé(e)",
  "I-129S": "Nonimmigrant Petition Based on Blanket L Petition",
  "I-130": "Petition for Alien Relative",
  "I-130A": "Supplemental Information for Spouse Beneficiary",
  "I-131": "Application for Travel Documents",
  "I-140": "Immigrant Petition for Alien Workers",
  "I-485": "Application to Register Permanent Residence or Adjust Status",
  "I-526E": "Immigrant Petition by Regional Center Investor",
  "I-539": "Application to Extend/Change Nonimmigrant Status",
  "I-539A": "Supplemental Information for Application to Extend/Change Nonimmigrant Status",
  "I-589": "Application for Asylum and for Withholding of Removal",
  "I-601": "Application for Waiver of Grounds of Inadmissibility",
  "I-601A": "Application for Provisional Unlawful Presence Waiver",
  "I-612": "Application for Waiver of the Foreign Residence Requirement",
  "I-693": "Report of Immigration Medical Examination",
  "I-751": "Petition to Remove Conditions on Residence",
  "I-765": "Application for Employment Authorization",
  "I-765WS": "Employment Authorization Worksheet",
  "I-821D": "Consideration of Deferred Action for Childhood Arrivals",
  "I-824": "Application for Action on an Approved Application or Petition",
  "I-829": "Petition by Investor to Remove Conditions",
  "I-864": "Affidavit of Support",
  "I-907": "Request for Premium Processing Service",
  "I-912": "Request for Fee Waiver",
  "I-914": "Application for T Nonimmigrant Status",
  "I-914 Supplement A": "Application for Derivative T Nonimmigrant Status",
  "I-914 Supplement B": "Declaration for Trafficking Victim",
  "I-918": "Petition for U Nonimmigrant Status",
  "I-918 Supplement A": "Petition for Qualifying Family Member of U-1 Recipient",
  "I-918 Supplement B": "U Nonimmigrant Status Certification",
  "I-90": "Application to Replace Permanent Resident Card",
  "I-290B": "Notice of Appeal or Motion",
  "I-360": "Petition for Amerasian, Widow(er), or Special Immigrant",
  "I-821": "Application for Temporary Protected Status",
  "I-730": "Refugee/Asylee Relative Petition",
  "I-134": "Declaration of Financial Support",
  "I-212": "Application for Permission to Reapply for Admission into the United States After Deportation or Removal",
  "I-192": "Application for Advance Permission to Enter as a Nonimmigrant",
  "I-526": "Immigrant Petition by Standalone Investor",
  "N-400": "Application for Naturalization",
  "N-600K": "Application for Citizenship and Issuance of Certificate Under Section 322",
  "N-336": "Request for a Hearing on a Decision in Naturalization Proceedings",
  "N-470": "Application to Preserve Residence for Naturalization Purposes",
  "N-600": "Application for Certificate of Citizenship",
  "N-565": "Application for Replacement Naturalization/Citizenship Document",
};

/** The forms a case of each type usually files with USCIS, the G-28 first. */
const CASE_FORMS: Record<string, string[]> = {
  "H-1B": ["G-28", "I-129", "I-907"], "H-1B1": ["G-28", "I-129"], "E-3": ["G-28", "I-129"], "H-2A": ["G-28", "I-129"], "H-2B": ["G-28", "I-129"], "H-3": ["G-28", "I-129"],
  "L-1A": ["G-28", "I-129", "I-907"], "L-1B": ["G-28", "I-129", "I-907"], "I-129S": ["G-28", "I-129S"],
  "O-1A": ["G-28", "I-129", "I-907"], "O-1B": ["G-28", "I-129", "I-907"], "O-2": ["G-28", "I-129"], "P-1": ["G-28", "I-129"], "P-2": ["G-28", "I-129"], "P-3": ["G-28", "I-129"],
  "E-1": ["G-28", "I-129"], "E-2": ["G-28", "I-129"], "TN": ["G-28", "I-129"], "R-1": ["G-28", "I-129"], "Q-1": ["G-28", "I-129"],
  "EB-1A": ["G-28", "I-140", "I-907"], "EB-1B": ["G-28", "I-140", "I-907"], "EB-1C": ["G-28", "I-140", "I-907"], "EB-2 NIW": ["G-28", "I-140", "I-907"], "EB-2": ["G-28", "I-140"], "EB-3": ["G-28", "I-140"], "I-140": ["G-28", "I-140"],
  "I-526E": ["G-28", "I-526E"], "I-829": ["G-28", "I-829"],
  "I-130": ["G-28", "I-130", "I-130A"], "I-129F": ["G-28", "I-129F"], "I-751": ["G-28", "I-751"], "I-864": ["I-864"],
  "I-485": ["G-28", "I-485", "I-864", "I-765", "I-131"], "I-765": ["G-28", "I-765"], "I-131": ["G-28", "I-131"], "I-90": ["G-28", "I-90"],
  "I-589": ["G-28", "I-589"], "I-914": ["G-28", "I-914"], "I-918": ["G-28", "I-918"], "I-821D": ["G-28", "I-821D", "I-765", "I-765WS"],
  "I-539": ["G-28", "I-539"], "I-612": ["G-28", "I-612"], "I-601": ["G-28", "I-601"], "I-601A": ["G-28", "I-601A"], "I-824": ["G-28", "I-824"], "I-290B": ["G-28", "I-290B"],
  "N-400": ["G-28", "N-400"], "N-600": ["G-28", "N-600"], "N-565": ["G-28", "N-565"], "I-912": ["I-912"],
  "I-360 VAWA": ["G-28", "I-360"], "SIJS": ["G-28", "I-360"], "EB-4": ["G-28", "I-360"], "I-360 widow": ["G-28", "I-360"], "I-360 Amerasian": ["G-28", "I-360"],
  "I-821": ["G-28", "I-821", "I-765"], "I-730": ["G-28", "I-730"], "I-134": ["I-134"], "I-212": ["G-28", "I-212"], "I-192": ["G-28", "I-192"],
  "EB-5": ["G-28", "I-526E"], "I-526": ["G-28", "I-526"], "N-600K": ["G-28", "N-600K"], "N-336": ["G-28", "N-336"], "N-470": ["G-28", "N-470"],
  "I-907": ["G-28", "I-907"], "I-131 re-entry": ["G-28", "I-131"], "I-131 parole": ["G-28", "I-131"],
};

export const formsFor = (typeCode: string) => CASE_FORMS[typeCode.trim()] ?? [];
export const formsDir = () => process.env.FORMS_DIR || path.join(process.cwd(), "forms");
const FILES: Record<string, string> = { "I-914 Supplement A": "i-914supa", "I-914 Supplement B": "i-914supb", "I-918 Supplement A": "i-918supa", "I-918 Supplement B": "i-918supb" };
const fileOf = (code: string) => FILES[code] ?? code.toLowerCase().replace(/[^a-z0-9-]/g, "");
export const templatePath = (code: string) => path.join(formsDir(), `${fileOf(code)}.pdf`);
export const hasTemplate = (code: string) => fs.existsSync(templatePath(code));
export const titleOf = (code: string) => FORM_TITLES[code] ?? code;

/** Supplements whose instructions are printed in the main form's. */
const INSTRUCTIONS_IN: Record<string, string> = { "I-130A": "I-130", "I-539A": "I-539", "I-765WS": "I-765", "I-914 Supplement A": "I-914", "I-918 Supplement A": "I-918" };
const instructionCache = new Map<string, string>();

/** The text of the form's official instructions, or "" when they have not been added. */
export async function instructionsOf(code: string): Promise<string> {
  const file = path.join(formsDir(), `${fileOf(INSTRUCTIONS_IN[code] ?? code)}-instr.pdf`);
  if (!fs.existsSync(file)) return "";
  const key = `${file}:${fs.statSync(file).mtimeMs}`;
  const hit = instructionCache.get(key);
  if (hit !== undefined) return hit;
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const task = pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(file)), isEvalSupported: false, useSystemFonts: true } as any);
  const doc = await task.promise;
  const pages: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const content = await (await doc.getPage(i)).getTextContent();
    pages.push(content.items.map((it) => ("str" in it ? it.str + (it.hasEOL ? "\n" : "") : "")).join(""));
  }
  await task.destroy();
  // Some USCIS PDFs carry a hidden "Draft Not for Production" layer in their text; it is not part of the instructions.
  const text = pages.join("\n").replace(/Draft\s*\n?\s*Not for\s*\n?\s*(Production|Reproduction)\s*\n?\s*(\d{2}\/\d{2}\/\d{4})?/g, "").replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim().slice(0, 200_000);
  instructionCache.set(key, text);
  return text;
}

export type Field = { name: string; kind: "text" | "check" | "choice"; label: string; options?: string[]; max?: number; page?: number };
export type Answer = { name: string; label: string; value: string; source: string };

const text = (v: unknown) => (v instanceof PDFString || v instanceof PDFHexString ? v.decodeText() : "");

/** A field's own name, short ("Pt2Line12_StreetNumberName"). USCIS names every box by its part, item and purpose, so
 *  the model must give it back with each answer: an answer whose key does not match its box is never written. */
export const keyOf = (name: string) => name.replace(/^form\d*\[0\]\./, "").replace(/#?subform\[\d+\]\./gi, "").replace(/\[0\]$/, "");

/** Every field of a fillable PDF, with the label the form gives it (its tooltip), in page order. */
export async function fieldsOf(bytes: Uint8Array): Promise<Field[]> {
  const pdf = await openForm(bytes);
  plainText(pdf.getForm().getFields());
  const pages = pdf.getPages().map((p) => p.ref);
  const out: Field[] = [];
  for (const f of pdf.getForm().getFields()) {
    const name = f.getName();
    // The 2D barcode boxes on each page are written by Adobe from the answers, never by hand.
    if (/BarCode|PDF417/i.test(name)) continue;
    const tip = text(f.acroField.dict.get(PDFName.of("TU"))).replace(/\s+/g, " ").trim();
    // A long label opens with the section's instructions and ends with the box itself ("12. A. Enter Street Number
    // and Name"), so a long one keeps its start and its end; cutting the end would hide which box it is.
    const label = !tip ? keyOf(name).replace(/[#._]+/g, " ") : tip.length <= 300 ? tip : `${tip.slice(0, 90).replace(/\s+\S*$/, "")} … ${tip.slice(-200).replace(/^\S*\s+/, "")}`;
    const widget = f.acroField.getWidgets()[0];
    const pageRef = widget?.P();
    const page = pageRef ? pages.findIndex((r) => r === pageRef) + 1 || undefined : undefined;
    if (f instanceof PDFTextField) out.push({ name, kind: "text", label, max: f.getMaxLength(), page });
    else if (f instanceof PDFCheckBox) out.push({ name, kind: "check", label, page });
    else if (f instanceof PDFRadioGroup) out.push({ name, kind: "choice", label, options: f.getOptions(), page });
    else if (f instanceof PDFDropdown || f instanceof PDFOptionList) out.push({ name, kind: "choice", label, options: f.getOptions(), page });
  }
  return out.sort((a, b) => (a.page ?? 0) - (b.page ?? 0));
}

// USPS Publication 28 street suffix and direction abbreviations.
const USPS: Record<string, string> = {
  avenue: "Ave", boulevard: "Blvd", street: "St", road: "Rd", drive: "Dr", lane: "Ln", court: "Ct", place: "Pl", circle: "Cir",
  highway: "Hwy", parkway: "Pkwy", terrace: "Ter", square: "Sq", trail: "Trl", expressway: "Expy", freeway: "Fwy", mountain: "Mtn",
  heights: "Hts", center: "Ctr", crossing: "Xing", junction: "Jct", point: "Pt", north: "N", south: "S", east: "E", west: "W",
  northeast: "NE", northwest: "NW", southeast: "SE", southwest: "SW", apartment: "Apt", suite: "Ste", floor: "Fl",
};

/** USCIS forms take dates as MM/DD/YYYY. */
export function normalise(field: Field, value: string) {
  let v = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (iso && /date|birth|expir|arriv|issued|from|to\b/i.test(field.label)) v = `${iso[2]}/${iso[3]}/${iso[1]}`;
  // A value too long for its box is never cut: a cut number is a wrong number. Numbers lose their
  // prefix and separators where that makes them fit (A-numbers, receipts); otherwise the field stays blank.
  // A street too long for its box takes the USPS standard abbreviations, as a paralegal would write it, only when the
  // full form does not fit.
  if (field.max && v.length > field.max && /street/i.test(field.label)) {
    const short = v.split(" ").map((w) => USPS[w.toLowerCase().replace(/[.,]$/, "")] ?? w).join(" ");
    if (short.length <= field.max) return short;
  }
  if (field.max && v.length > field.max) {
    const numberish = /number|no\.|receipt|ssn|ein|telephone|phone|mobile|fax/i.test(field.label);
    const compact = v.replace(/[\s\-().]/g, "").replace(/^\+/, "");
    if (numberish && /^[A-Za-z]{0,3}\d+$/.test(compact) && compact.length <= field.max) v = compact; // EAC2390112345 keeps its letters
    else {
      // A box for digits only (an A-number box after its printed "A") takes the number without its prefix.
      let digits = compact.replace(/^[A-Za-z]{1,3}(?=\d)/, "");
      if (/telephone|phone|mobile|fax/i.test(field.label) && /^1\d{10}$/.test(digits)) digits = digits.slice(1);
      // Receipt numbers are never shortened: their letters are part of the number.
      v = numberish && !/receipt/i.test(field.label) && /^\d+$/.test(digits) && digits.length <= field.max ? digits : "";
    }
  }
  return v;
}

/** Opens an official form. USCIS locks its PDFs (no password to open; filling allowed, other changes not);
 *  the lock is opened as any PDF reader does, and its leftover dictionary is dropped so the saved file is clean. */
async function openForm(bytes: Uint8Array) {
  const pdf = await PDFDocument.load(bytes, { password: "" });
  for (const [ref, obj] of pdf.context.enumerateIndirectObjects())
    if (obj instanceof PDFDict && obj.get(PDFName.of("Filter"))?.toString() === "/Standard" && obj.has(PDFName.of("O"))) pdf.context.delete(ref);
  return pdf;
}

/** Some USCIS boxes ("Additional Information") are marked rich text, which the PDF library cannot read or
 *  draw; they take plain text just as well. */
function plainText(fields: ReturnType<ReturnType<PDFDocument["getForm"]>["getFields"]>) {
  for (const f of fields) if (f instanceof PDFTextField && f.isRichFormatted()) f.disableRichFormatting();
}

export const yes = (v: string) => /^(yes|true|x|checked|on|1)$/i.test(v.trim());

// The smallest type an answer may shrink to so it fits its box. Below this it is hard to read, so the box stays blank.
const MIN_SIZE = 7;

/** The type size at which a value fits inside its box without being cut, or null when it cannot fit at a readable
 *  size. Single line boxes must hold it on one line; multiline boxes must hold every wrapped line. */
function fitSize(f: PDFTextField, value: string, font: PDFFont): number | null {
  const rect = f.acroField.getWidgets()[0]?.getRectangle();
  if (!rect) return null;
  const da = Number(/([\d.]+)\s+Tf/.exec(f.acroField.getDefaultAppearance() ?? "")?.[1] ?? 10) || 10;
  if (f.isCombed()) return value.length <= (f.getMaxLength() ?? value.length) ? da : null;
  const width = rect.width - 4;
  const lines = (size: number) => {
    let n = 0;
    for (const para of value.split("\n")) {
      let line = "";
      n++;
      for (const w of para.split(" ")) {
        const next = line ? `${line} ${w}` : w;
        if (font.widthOfTextAtSize(next, size) <= width) { line = next; continue; }
        if (!line || font.widthOfTextAtSize(w, size) > width) return Infinity;
        n++; line = w;
      }
    }
    return n;
  };
  for (let size = da; size >= MIN_SIZE; size -= 0.5) {
    if (f.isMultiline() ? lines(size) * size * 1.15 <= rect.height - 2 : font.widthOfTextAtSize(value, size) <= width) return size;
  }
  return null;
}

/** Writes the answers into the form's own fields, and returns the names of those that could not be written as given:
 *  a value that will not fit its box, an option the field does not offer. Nothing is ever cut or guessed. */
async function place(pdf: PDFDocument, answers: { name: string; value: string }[], font: PDFFont) {
  const form = pdf.getForm();
  plainText(form.getFields());
  const byName = new Map(form.getFields().map((f) => [f.getName(), f]));
  const left: string[] = [];
  for (const a of answers) {
    const f = byName.get(a.name);
    if (!f || !a.value.trim()) continue;
    try {
      if (f instanceof PDFTextField) {
        const max = f.getMaxLength();
        const size = max && a.value.length > max ? null : fitSize(f, a.value, font);
        if (size === null) { left.push(a.name); continue; }
        f.setText(a.value);
        // A value a little too wide is set slightly smaller rather than spilling past the box's edge.
        const da = Number(/([\d.]+)\s+Tf/.exec(f.acroField.getDefaultAppearance() ?? "")?.[1] ?? 10) || 10;
        if (size < da) f.setFontSize(size);
      } else if (f instanceof PDFCheckBox) {
        if (yes(a.value)) f.check(); else f.uncheck();
      } else if (f instanceof PDFRadioGroup) {
        const opt = f.getOptions().find((o) => o.toLowerCase() === a.value.trim().toLowerCase());
        if (opt) f.select(opt); else left.push(a.name);
      } else if (f instanceof PDFDropdown || f instanceof PDFOptionList) {
        const opt = f.getOptions().find((o) => o.toLowerCase() === a.value.trim().toLowerCase());
        if (opt) f.select(opt); else left.push(a.name);
      }
    } catch {
      // A field the PDF will not take is left blank rather than written wrongly.
      left.push(a.name);
    }
  }
  return left;
}

/** The answers that cannot be written into this form as given (too long for their box, or not an option), so they
 *  are taken out before review and the attorney sees those boxes as blank, not as filled. */
export async function unplaceable(bytes: Uint8Array, answers: { name: string; value: string }[]) {
  const pdf = await openForm(bytes);
  return new Set(await place(pdf, answers, await pdf.embedFont(StandardFonts.Helvetica)));
}

/** The blank form with the answers written into its own fields. The fields stay editable. */
export async function fillPdf(bytes: Uint8Array, answers: { name: string; value: string }[]): Promise<Uint8Array> {
  const pdf = await openForm(bytes);
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  await place(pdf, answers, font);
  const form = pdf.getForm();
  // Official forms also carry an XFA layer that some viewers prefer; it would hide the answers.
  try { form.deleteXFA(); } catch { /* no XFA */ }
  form.updateFieldAppearances(font);
  return pdf.save();
}

export type RawAnswer = { i: number; key?: unknown; value: unknown; source?: unknown };

/** Whether a value has the shape its box asks for, judged from the box's key and label. A value of the wrong shape (a
 *  state in a street box, letters in an A-Number) is never written: it is a sign the answer is in the wrong place. */
export function plausible(f: Field, v: string): boolean {
  // The box's own words: the last sentences of its label ("13. A. Enter Date From. Enter as 2 digit month..."). Not the
  // section's instructions at the start of a long label, and never the key: USCIS keys can name the wrong thing (the
  // G-28 box keyed Line6_EMail is the mobile telephone box).
  const k = (f.label.includes(" … ") ? f.label.split(" … ").pop()! : f.label).split(/(?<=\.)\s+/).slice(-3).join(" ");
  const has = (re: RegExp) => re.test(k);
  if (f.kind !== "text") return true;
  if (/^(n\/?a|none)$/i.test(v)) return !has(/date|zip|number|ssn|telephone|phone/i) || has(/middle|other names|unit|apt/i);
  if (has(/SSN|Social Security/i)) return /^\d{9}$/.test(v.replace(/-/g, ""));
  if (has(/ANumber|AlienNumber|A-Number|Alien Registration Number/i)) return /^\d{7,9}$/.test(v.replace(/^A-?/i, ""));
  if (has(/Receipt/i)) return /^[A-Z]{3}\d{10}$/.test(v.replace(/[\s-]/g, ""));
  if (has(/ZipCode|Zip Code/i)) return /^\d{5}(-?\d{4})?$/.test(v);
  if (has(/E-?mail/i)) return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(v);
  if (has(/Area Code/i)) return /^\d{3}$/.test(v);
  if (has(/Extension/i) && !has(/Telephone Number[^.]*\.$/i)) return /^\d{1,6}$/.test(v);
  if (has(/7-digit Telephone/i)) return /^\d{3}-?\d{4}$/.test(v);
  if (has(/Telephone|Phone|Mobile|Fax/i)) return /^\+?[\d\s().-]{7,20}$/.test(v) && v.replace(/\D/g, "").length >= 7;
  if (has(/Date(?! of Birth.*place)|DOB|\bmm\/dd\/yyyy/i) && !has(/place|city|country|reason|explain|describe|additional/i)) {
    const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(v);
    if (!m) return false;
    const [mm, dd, yy] = [Number(m[1]), Number(m[2]), Number(m[3])];
    const t = new Date(Date.UTC(yy, mm - 1, dd));
    return t.getUTCMonth() === mm - 1 && t.getUTCDate() === dd && yy >= 1900 && yy <= 2100;
  }
  if (has(/FamilyName|GivenName|MiddleName|LastName|FirstName|Family Name|Given Name|Middle Name/i) && !has(/organization|company|business|employer/i)) return !/[\d@]/.test(v);
  if (has(/Country|Province|CityOrTown|City or Town/i) && !has(/street|address line|in care of/i)) return !/\d/.test(v);
  if (has(/StreetNumberName|Street Number and Name/i)) return /[A-Za-z]/.test(v) && !/^[A-Z]{2}$/.test(v);
  if (has(/_State\b|\bState\b/) && f.max && f.max <= 2) return /^[A-Z]{2}$/.test(v);
  if (has(/HowMany|How many|Number of|NumberOf/i) && !has(/street|telephone|phone|receipt|passport|document|ssn|account/i)) return /^\d{1,4}$/.test(v);
  return true;
}

/** Two boxes ticked for a question that takes one (Yes and No, Male and Female, Single and Married, Apt. and Ste.) is a
 *  contradiction: none of them is kept, and the attorney decides. USCIS names the boxes of one question alike
 *  (Pt2Line9_Male, Pt2Line9_Female; Pt2Line12_Unit[0], [1], [2]); questions that say "all that apply" take several. */
export function dropContradictions(answers: Answer[]): Answer[] {
  const group = (a: Answer) => {
    const k = keyOf(a.name).replace(/\[\d+\]$/, "");
    const line = /^(Pt\d+Line\d+[a-z]?\d*)_/i.exec(k)?.[1];
    return line ?? k;
  };
  const yesNo = (a: Answer) => a.label.replace(/\s*Check (Yes|No)\b.*$/i, "").trim();
  const ticked = new Map<string, number>();
  const keyFor = (a: Answer) => (/Check (Yes|No)\b/i.test(a.label) ? `yn:${yesNo(a)}` : `g:${group(a)}`);
  const several = (a: Answer) => /all that apply|select all|check all|one or more/i.test(a.label);
  for (const a of answers) if (a.value === "yes" && !several(a)) ticked.set(keyFor(a), (ticked.get(keyFor(a)) ?? 0) + 1);
  return answers.filter((a) => a.value !== "yes" || several(a) || (ticked.get(keyFor(a)) ?? 0) < 2);
}

/** The model's answers, checked against the fields they claim to fill: the key given back must be the box's own, a
 *  choice must be one of the box's options, and every value must have the shape its box asks for. */
export function answersFor(list: RawAnswer[], fields: Field[]): Answer[] {
  const out: Answer[] = [];
  for (const a of list) {
    const f = fields[Number(a.i)];
    const value = typeof a.value === "string" ? a.value : typeof a.value === "number" ? String(a.value) : "";
    if (!f || !value.trim()) continue;
    // The key given back must be this box's own: an answer meant for a neighbouring box is never written here.
    if (String(a.key ?? "").trim() !== keyOf(f.name)) continue;
    if (f.kind === "choice" && !f.options?.some((o) => o.toLowerCase() === value.trim().toLowerCase())) continue;
    if (f.kind === "check" && !yes(value)) continue;
    const v = f.kind === "check" ? "yes" : normalise(f, value);
    if (!v || !plausible(f, v)) continue;
    out.push({ name: f.name, label: f.label, value: v, source: String(a.source ?? "").slice(0, 40) });
  }
  return out;
}

/** Boxes the form fills from another ("This is a read only field. This field pre-populates from page 1"): the A-Number
 *  at the top of each page, names repeated in Additional Information. Adobe copies them with a script that is removed
 *  when the form is filled, so the copy is made here, from the answer to the box of the same name. */
export function withCopies(answers: Answer[], fields: Field[]): Answer[] {
  const base = (name: string) => keyOf(name).replace(/\[\d+\]$/, "").replace(/^#?area\[\d+\]\./i, "");
  const given = new Map(answers.map((a) => [base(a.name), a]));
  const have = new Set(answers.map((a) => a.name));
  const copies: Answer[] = [];
  for (const f of fields) {
    if (have.has(f.name) || !/pre-?populates?|read only field/i.test(f.label)) continue;
    const from = given.get(base(f.name));
    if (from && from.name !== f.name) copies.push({ name: f.name, label: f.label, value: from.value, source: from.source });
  }
  return [...answers, ...copies];
}
