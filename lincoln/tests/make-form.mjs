// Builds a small fillable PDF shaped like a USCIS form (cryptic field names, labels in tooltips,
// checkboxes, a radio group, a field with a maximum length) to test the form engine without the real forms.
import fs from "node:fs";
import { PDFDocument, PDFName, PDFString, StandardFonts } from "pdf-lib";

export async function makeForm(file) {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const form = pdf.getForm();
  const tip = (f, t) => f.acroField.dict.set(PDFName.of("TU"), PDFString.of(t));
  const page = pdf.addPage([612, 792]);
  page.drawText("Form G-28 (test copy)", { x: 50, y: 750, size: 14, font });
  const fields = [
    ["form1[0].#subform[0].Pt1Line2a_FamilyName[0]", "Part 1. Information About Attorney. 2.a. Family Name (Last Name)."],
    ["form1[0].#subform[0].Pt1Line2b_GivenName[0]", "Part 1. 2.b. Given Name (First Name)."],
    ["form1[0].#subform[0].Pt2Line1a_BarNumber[0]", "Part 2. Eligibility. 1.b. Bar Number (if applicable)."],
    ["form1[0].#subform[1].Pt3Line5a_FamilyName[0]", "Part 3. Client Information. 5.a. Family Name (Last Name)."],
    ["form1[0].#subform[1].Pt3Line5b_GivenName[0]", "Part 3. 5.b. Given Name (First Name)."],
    ["form1[0].#subform[1].Pt3Line9_DateOfBirth[0]", "Part 3. 9. Date of Birth (mm/dd/yyyy)."],
  ];
  let y = 700;
  for (const [name, label] of fields) {
    const f = form.createTextField(name);
    tip(f, label);
    f.addToPage(page, { x: 50, y, width: 300, height: 18 });
    y -= 30;
  }
  const a = form.createTextField("form1[0].#subform[1].Pt3Line6_ANumber[0]");
  tip(a, "Part 3. 6. Alien Registration Number (A-Number), if any.");
  a.setMaxLength(9);
  a.addToPage(page, { x: 50, y, width: 120, height: 18 }); y -= 30;
  const c1 = form.createCheckBox("form1[0].#subform[0].Pt2Line1_Checkbox[0]");
  tip(c1, "Part 2. 1.a. I am an attorney eligible to practice law in the United States.");
  c1.addToPage(page, { x: 50, y, width: 14, height: 14 }); y -= 30;
  const r = form.createRadioGroup("form1[0].#subform[1].Pt3Line1_Agency[0]");
  tip(r, "Part 3. 1. This appearance relates to immigration matters before: USCIS, ICE or CBP.");
  r.addOptionToPage("USCIS", page, { x: 50, y, width: 14, height: 14 });
  r.addOptionToPage("ICE", page, { x: 90, y, width: 14, height: 14 });
  r.addOptionToPage("CBP", page, { x: 130, y, width: 14, height: 14 });
  pdf.addPage([612, 792]);
  fs.writeFileSync(file, await pdf.save());
}

if (process.argv[2]) await makeForm(process.argv[2]);
