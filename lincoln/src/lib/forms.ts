import fs from "node:fs";
import path from "node:path";
import { PDFCheckBox, PDFDocument, PDFDropdown, PDFHexString, PDFName, PDFOptionList, PDFRadioGroup, PDFString, PDFTextField, StandardFonts } from "pdf-lib";

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

/** Every field of a fillable PDF, with the label the form gives it (its tooltip), in page order. */
export async function fieldsOf(bytes: Uint8Array): Promise<Field[]> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const pages = pdf.getPages().map((p) => p.ref);
  const out: Field[] = [];
  for (const f of pdf.getForm().getFields()) {
    const name = f.getName();
    const tip = text(f.acroField.dict.get(PDFName.of("TU")));
    const label = (tip || name.replace(/^form\d*\[0\]\./, "").replace(/\[\d+\]/g, "").replace(/[#._]+/g, " ")).replace(/\s+/g, " ").trim().slice(0, 300);
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

/** USCIS forms take dates as MM/DD/YYYY. */
export function normalise(field: Field, value: string) {
  let v = value.trim();
  const iso = /^(\d{4})-(\d{2})-(\d{2})$/.exec(v);
  if (iso && /date|birth|expir|arriv|issued|from|to\b/i.test(field.label)) v = `${iso[2]}/${iso[3]}/${iso[1]}`;
  // A value too long for its box is never cut: a cut number is a wrong number. Numbers lose their
  // prefix and separators where that makes them fit (A-numbers, receipts); otherwise the field stays blank.
  if (field.max && v.length > field.max) {
    const digits = v.replace(/^[A-Za-z]{1,3}(?=\d)/, "").replace(/[\s-]/g, "");
    v = /number|no\.|receipt|ssn|ein/i.test(field.label) && /^\d+$/.test(digits) && digits.length <= field.max ? digits : "";
  }
  return v;
}

export const yes = (v: string) => /^(yes|true|x|checked|on|1)$/i.test(v.trim());

/** The blank form with the answers written into its own fields. The fields stay editable. */
export async function fillPdf(bytes: Uint8Array, answers: { name: string; value: string }[]): Promise<Uint8Array> {
  const pdf = await PDFDocument.load(bytes, { ignoreEncryption: true });
  const form = pdf.getForm();
  const byName = new Map(form.getFields().map((f) => [f.getName(), f]));
  for (const a of answers) {
    const f = byName.get(a.name);
    if (!f || !a.value.trim()) continue;
    try {
      if (f instanceof PDFTextField) {
        const max = f.getMaxLength();
        if (max && a.value.length > max) continue;
        f.setText(a.value);
      } else if (f instanceof PDFCheckBox) {
        if (yes(a.value)) f.check(); else f.uncheck();
      } else if (f instanceof PDFRadioGroup) {
        const opt = f.getOptions().find((o) => o.toLowerCase() === a.value.trim().toLowerCase());
        if (opt) f.select(opt);
      } else if (f instanceof PDFDropdown || f instanceof PDFOptionList) {
        const opt = f.getOptions().find((o) => o.toLowerCase() === a.value.trim().toLowerCase());
        if (opt) f.select(opt);
      }
    } catch {
      // A field the PDF will not take is left blank rather than written wrongly.
    }
  }
  // Official forms also carry an XFA layer that some viewers prefer; it would hide the answers.
  try { form.deleteXFA(); } catch { /* no XFA */ }
  form.updateFieldAppearances(await pdf.embedFont(StandardFonts.Helvetica));
  return pdf.save();
}
