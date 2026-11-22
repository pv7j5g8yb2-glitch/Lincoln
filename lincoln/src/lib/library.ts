// Every kind of work a US immigration firm takes on, used to classify cases from mail and instructions.
// USCIS forms checked against uscis.gov/forms/all-forms on 2026-11-14; State Department, Labor, EOIR,
// ICE, CBP and federal court work added; widened on 2026-11-22 to the whole immigration system (adjustment routes,
// dependents, enforcement, citizenship suits, labor appeals and compliance), each with a rulebook in rulebooks.ts. A matter that fits none is still opened, under the name the
// model gives it: the list guides classification, it never limits what Lincoln works on.
export type Family = { name: string; types: [code: string, name: string][] };

export const LIBRARY: Family[] = [
  { name: "Employment based nonimmigrant", types: [
    ["H-1B", "Specialty occupation: registration, petition, transfer, extension, amendment"], ["H-1B1", "Chile and Singapore"], ["E-3", "Australian specialty occupation"],
    ["H-2A", "Temporary agricultural workers"], ["H-2B", "Temporary non agricultural workers"], ["H-3", "Trainee"], ["H-1C", "Nurses in shortage areas (expired)"],
    ["L-1A", "Intracompany manager or executive"], ["L-1B", "Intracompany specialized knowledge"], ["I-129S", "Blanket L"],
    ["O-1A", "Extraordinary ability: sciences, education, business, athletics"], ["O-1B", "Extraordinary ability: arts, film, television"], ["O-2", "O-1 support staff"],
    ["P-1", "Athletes and entertainment groups"], ["P-2", "Reciprocal exchange artists"], ["P-3", "Culturally unique artists"],
    ["E-1", "Treaty trader"], ["E-2", "Treaty investor"], ["TN", "USMCA professionals"], ["R-1", "Religious worker"], ["Q-1", "Cultural exchange"],
    ["I-129CW", "CNMI transitional worker"], ["I-941", "Entrepreneur parole"], ["I-907", "Premium processing"], ["H-4", "H-1B dependents and H-4 work permit"], ["L-2", "L-1 dependents"], ["Dependents", "Other dependent visas (E, F-2, J-2, M-2, O-3, P-4, R-2, TD, N-8, N-9)"], ["AC21", "H-1B beyond six years, portability and recapture"], ["E-2C", "CNMI investor and CNMI programs"],
  ] },
  { name: "Employment based immigrant", types: [
    ["EB-1A", "Extraordinary ability"], ["EB-1B", "Outstanding professor or researcher"], ["EB-1C", "Multinational manager or executive"],
    ["EB-2 NIW", "National Interest Waiver"], ["EB-2", "Advanced degree with labor certification"], ["EB-3", "Skilled worker, professional or other worker"],
    ["I-140", "Immigrant petition for worker"], ["I-140G", "Gold Card petition"], ["EB-4", "Special immigrant, including religious workers"],
    ["EB-5", "Immigrant investor"], ["I-526", "Standalone investor petition"], ["I-526E", "Regional center investor petition"], ["I-829", "Investor removal of conditions"],
    ["I-956", "Regional center designation and filings"], ["I-485 Supplement J", "Job offer confirmation and portability"], ["SP", "PATRIOT Act special immigrants"], ["Schedule A", "Nurses, physical therapists, exceptional ability"], ["Healthcare certificate", "VisaScreen and healthcare worker certificates"], ["Physician NIW", "Physician national interest waiver"], ["SIV", "Afghan and Iraqi special immigrant visas"], ["Priority date", "Retention, porting, upgrades and the Visa Bulletin"],
  ] },
  { name: "Labor certification", types: [
    ["PERM", "Labor certification, start to finish"], ["ETA-9141", "Prevailing wage determination"], ["ETA-9089", "PERM application"],
    ["ETA-9035", "Labor condition application"], ["ETA-9142", "H-2A and H-2B labor certification"], ["PERM audit", "Audit and supervised recruitment"], ["BALCA", "PERM and prevailing wage appeals"], ["DOL investigation", "Wage and Hour investigations of H-1B, H-2A and H-2B employers"],
  ] },
  { name: "Family based", types: [
    ["I-130", "Relative petition"], ["I-129F", "Fiancé(e) petition (K-1)"], ["K-3", "Spouse visa"], ["I-751", "Removal of conditions, joint or with waiver"],
    ["I-360 widow", "Widow or widower"], ["I-730", "Refugee or asylee relative petition"], ["I-864", "Affidavit of support"], ["I-134", "Declaration of financial support"],
    ["I-600", "Orphan petition"], ["I-600A", "Orphan advance processing"], ["I-800", "Convention adoptee petition"], ["I-800A", "Convention suitability to adopt"],
    ["I-817", "Family Unity benefits"], ["VI5", "Virgin Islands parents (historic)"], ["Former citizen", "Immigrant visas for former citizens"], ["V visa", "V nonimmigrant spouse or child of a permanent resident"], ["Humanitarian reinstatement", "Petition after the petitioner dies (204(l))"], ["Adopted child", "Adopted child petition"], ["CSPA", "Child Status Protection Act age"],
  ] },
  { name: "Green card", types: [
    ["I-485", "Adjustment of status"], ["I-485 Supplement A", "Adjustment under 245(i)"], ["DS-260", "Immigrant visa, consular processing"],
    ["I-693", "Medical examination"], ["I-765", "Employment authorization"], ["I-765 compelling", "Compelling circumstances work permit"], ["I-131", "Travel document and advance parole"],
    ["I-90", "Green card renewal or replacement"], ["I-407", "Abandonment of residence"], ["I-131 re-entry", "Re-entry permit"], ["SB-1", "Returning resident visa"],
    ["I-912", "Fee waiver"], ["I-687", "Legalization temporary residence"], ["I-698", "Legalization permanent residence"], ["I-694", "Legalization appeal"], ["I-700", "Special agricultural worker legalization (historic)"], ["INA 289", "American Indians born in Canada"], ["DV", "Diversity visa"], ["Registry", "Registry (entry before 1972)"], ["Cuban adjustment", "Cuban Adjustment Act"], ["NACARA 202", "NACARA adjustment for Nicaraguans and Cubans"], ["HRIFA", "Haitian adjustment"], ["LRIF", "Liberian adjustment"], ["I-485 refugee", "Refugee adjustment"], ["I-485 asylee", "Asylee adjustment"], ["I-485 U", "Green card from U status"], ["I-485 T", "Green card from T status"], ["I-485 VAWA", "Green card from a VAWA petition"], ["I-485 SIJS", "Green card for a special immigrant juvenile"], ["I-131A", "Travel document for a resident abroad"],
  ] },
  { name: "Humanitarian", types: [
    ["I-589", "Asylum, withholding and CAT"], ["I-730", "Follow to join for refugees and asylees"], ["I-914", "T visa"], ["I-918", "U visa"], ["I-929", "U visa family member"],
    ["I-360 VAWA", "VAWA self petition"], ["I-765V", "Work permit for abused nonimmigrant spouse"], ["SIJS", "Special immigrant juvenile"],
    ["I-821", "Temporary protected status"], ["I-821D", "DACA"], ["I-131 parole", "Humanitarian parole"], ["I-881", "NACARA suspension or cancellation"],
    ["I-602", "Refugee waiver"], ["I-590", "Refugee status"], ["I-360 Amerasian", "Amerasian petition"], ["I-854", "S visa witness record"], ["PIP", "Parole in place"], ["Parole programs", "Program parole and re parole (Ukraine, Afghan, family reunification, CAM)"], ["DED", "Deferred Enforced Departure"], ["Deferred action", "Deferred action outside DACA"], ["UAC", "Unaccompanied children"], ["Asylum termination", "Termination of asylum or refugee status"],
  ] },
  { name: "Visitors, students and exchange", types: [
    ["DS-160", "Nonimmigrant visa at a consulate"], ["B-1/B-2", "Business and tourist visits"], ["F-1", "Students"], ["M-1", "Vocational students"],
    ["OPT", "Optional practical training and STEM OPT"], ["J-1", "Exchange visitors"], ["I-539", "Extension or change of status"], ["I-102", "I-94 replacement or correction"],
    ["I-612", "J-1 home residency waiver"], ["A, G and NATO", "Diplomatic and international organization status (I-566, I-508)"], ["I visa", "Foreign media"], ["C-1/D", "Transit and crew"], ["BCC", "Border crossing card"], ["ESTA", "Visa Waiver Program"], ["FAS", "Compact of Free Association citizens"],
  ] },
  { name: "Waivers and inadmissibility", types: [
    ["I-601", "Inadmissibility waiver"], ["I-601A", "Provisional unlawful presence waiver"], ["I-212", "Permission to reapply after removal"],
    ["I-192", "Advance permission to enter (212(d)(3))"], ["I-193", "Passport or visa waiver"], ["I-191", "Former 212(c) relief"],
    ["I-690", "Legalization inadmissibility waiver"], ["I-945", "Public charge bond"], ["I-356", "Cancel public charge bond"], ["Unlawful presence", "Unlawful presence and the 3, 10 year and permanent bars"], ["Public charge", "Public charge"], ["TRIG", "Terrorism related inadmissibility and exemptions"], ["212(f) proclamations", "Travel bans and entry proclamations"],
  ] },
  { name: "Citizenship", types: [
    ["N-400", "Naturalization"], ["N-600", "Certificate of citizenship"], ["N-600K", "Citizenship for children abroad (322)"], ["N-336", "Hearing on a naturalization denial"],
    ["N-470", "Preserve residence for naturalization"], ["N-565", "Replacement citizenship document"], ["N-648", "Disability exception"], ["N-426", "Military service certification"],
    ["N-644", "Posthumous citizenship"], ["N-300", "Declaration of intention"], ["319(b)", "Naturalization for spouses of citizens working abroad"], ["CRBA", "Citizenship at birth abroad and Consular Report of Birth Abroad"], ["Loss of nationality", "Renunciation and loss of citizenship"], ["Denaturalization", "Denaturalization defense"],
  ] },
  { name: "Responses, motions and appeals", types: [
    ["RFE", "Request for Evidence"], ["NOID", "Notice of Intent to Deny"], ["NOIR", "Notice of Intent to Revoke"], ["I-290B", "Motion or appeal to the AAO"],
    ["I-824", "Action on an approved petition"], ["221(g)", "Consular refusal or administrative processing"], ["Consular reconsideration", "Request to a consulate after refusal"],
    ["Expedite", "Expedite request"], ["Case inquiry", "Outside processing time, ombudsman or congressional inquiry"], ["Visa revocation", "Revoked visas"], ["Private bill", "Private immigration bill"],
  ] },
  { name: "Immigration court and enforcement", types: [
    ["Removal defense", "Master and individual hearings"], ["EOIR-42A", "Cancellation of removal for permanent residents"], ["EOIR-42B", "Cancellation of removal for non permanent residents"],
    ["Bond", "Bond and custody redetermination"], ["Motion to reopen", "Reopen or reconsider"], ["EOIR-26", "Appeal to the BIA"], ["EOIR-29", "Appeal to the BIA from a DHS decision"],
    ["I-246", "Stay of removal"], ["Prosecutorial discretion", "Requests to ICE"], ["Detention", "Detained cases and release requests"],
    ["Expedited removal", "Credible and reasonable fear"], ["Voluntary departure", "Voluntary departure"], ["EOIR-40", "Suspension of deportation (pre 1997 cases)"], ["Ineffective assistance", "Ineffective assistance of counsel (Lozada)"], ["Bond breach", "Breached immigration bonds"], ["Reinstatement", "Reinstated removal orders and withholding only cases"], ["238(b)", "Administrative removal"], ["237(a)(1)(H)", "Fraud waiver in removal"], ["VAWA cancellation", "Cancellation for abused spouses and children"], ["Closure and termination", "Administrative closure and termination"], ["Order of supervision", "Release on an order of supervision"], ["Illegal reentry", "Criminal reentry cases"], ["Post-conviction relief", "Vacating convictions for immigration"], ["Port of entry", "CBP inspection, expedited removal and withdrawal at the border"], ["DHS TRIP", "Travel screening redress and trusted traveler denials"],
  ] },
  { name: "Federal court", types: [
    ["Mandamus", "Delayed cases"], ["APA", "Challenge to an agency decision"], ["PFR", "Petition for review"], ["Habeas", "Detention"], ["1503 action", "Declaratory judgment of citizenship"], ["1447(b) action", "Naturalization delay suit"], ["1421(c) action", "Review of a naturalization denial"], ["EAJA", "Attorney fees against the government"],
  ] },
  { name: "Employer compliance and records", types: [
    ["I-9", "I-9 audits and E-Verify"], ["Worksite enforcement", "Notice of inspection and ICE audits"], ["PAF", "H-1B public access files"],
    ["Site visit", "FDNS site visit preparation"], ["Global mobility", "Program and policy work for employers"], ["OCAHO", "Employer sanctions and document fraud hearings"], ["274B discrimination", "Immigration related employment discrimination"], ["Carrier fines", "Airline and vessel fines"], ["Recognition and accreditation", "EOIR recognition and accredited representatives"], ["Corporate changes", "Mergers, acquisitions and restructuring"], ["Layoffs", "Layoffs and terminations of sponsored workers"], ["I-17", "SEVP school certification"], ["I-910", "Civil surgeon designation"],
    ["FOIA", "Records requests to USCIS, CBP, ICE, OBIM, EOIR and the State Department (G-639)"], ["G-884", "Return of original documents"],
    ["G-1041", "Genealogy records"], ["G-1566", "Certificate of non existence"], ["AR-11", "Change of address"],
  ] },
  { name: "Advice", types: [
    ["Consultation", "Initial consultation and eligibility review"], ["Criminal consequences", "Immigration consequences of a criminal case"],
    ["Travel advice", "Travel while a case is pending"], ["Status planning", "Options and long term strategy"],
  ] },
];

/** A type the list does not name keeps the name the model gave it, so no matter is ever turned away. */
export function typeOf(code: string, name?: string | null): { code: string; name: string; family: string } {
  const c = code.trim();
  const fam = LIBRARY.find((f) => f.types.some(([x]) => x === c));
  if (fam) return { code: c, name: fam.types.find(([x]) => x === c)![1], family: fam.name };
  return { code: c.slice(0, 40) || "Other", name: String(name ?? "").trim().slice(0, 120) || "To be confirmed", family: "Other" };
}
