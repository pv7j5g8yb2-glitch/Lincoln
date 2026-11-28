import { formsFor } from "./forms";

// Figures that change by year. Update each March from USCIS Form I-864P (www.uscis.gov/i-864p).
// 125 percent of the HHS poverty guidelines, effective March 1, 2026: household size to minimum income.
const I864P_2026 = {
  effective: "2026-03-01",
  contiguous: { 2: 27050, 3: 34150, 4: 41250, 5: 48350, 6: 55450, 7: 62550, 8: 69650, extra: 7100 },
  alaska: { 2: 33813, 3: 42688, 4: 51563, 5: 60438, 6: 69313, 7: 78188, 8: 87063, extra: 8875 },
  hawaii: { 2: 31113, 3: 39275, 4: 47438, 5: 55600, 6: 63763, 7: 71925, 8: 80088, extra: 8163 },
};

const row = (name: string, t: Record<string, number>) =>
  `${name}: ${[2, 3, 4, 5, 6, 7, 8].map((n) => `${n} people $${t[n].toLocaleString("en-US")}`).join(", ")}, each additional person $${t.extra.toLocaleString("en-US")}`;

/** The affidavit of support minimums, for case types that file an I-864; empty for others. */
export function supportRule(typeCode: string) {
  if (!formsFor(typeCode).includes("I-864") && !["I-130", "I-864"].includes(typeCode.trim())) return "";
  const t = I864P_2026;
  return `Affidavit of support (Form I-864) minimum income, 125 percent of the poverty guidelines, USCIS Form I-864P effective ${t.effective} (100 percent applies only to an active duty sponsor petitioning for a spouse or child):
- ${row("48 states, DC and territories", t.contiguous)}
- ${row("Alaska", t.alaska)}
- ${row("Hawaii", t.hawaii)}
Household size counts the sponsor, the sponsor's spouse and dependent children, other dependents, and every immigrant sponsored. Compare the sponsor's stated income with the figure for that household size in the sponsor's state. If it is below, report it with both figures and the shortfall, and that a joint sponsor or the sponsor's assets are needed.`;
}
