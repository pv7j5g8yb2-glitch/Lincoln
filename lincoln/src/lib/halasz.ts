// Demo case: Dr. Réka Halász, O-1A. A made up case built for Lincoln's blind tests
// (demo/o1-halasz in this repo). The documents, people and companies do not exist.
// The letter text below is condensed from the letter Lincoln's method produced on that bundle.

export type Seg = { t: string; k: "fact" | "call" | "note" | "plain"; doc?: string; page?: number };
export type Section = { id: string; heading: string; cite?: string; needs?: string; paras: Seg[][] };
export type Question = {
  id: string;
  topic: string;
  q: string;
  evidence: { t: string; page?: number }[];
  recommend: "yes" | "no";
  why: string;
  answer: "yes" | "no" | "change" | null;
  note?: string;
};

const f = (t: string, doc: string, page: number): Seg => ({ t, k: "fact", doc, page });
const c = (t: string): Seg => ({ t, k: "call" });
const n = (t: string): Seg => ({ t, k: "note" });
const p = (t: string): Seg => ({ t, k: "plain" });

type Doc = [n: number, title: string, kind: string, from: number, to: number, date: string | null, source: string, lang: string, scan: 0 | 1, status: string, note: string | null];

export const HALASZ_DOCS: Doc[] = [
  [1, "Email thread from the client, with forwarded drafts", "Correspondence", 1, 2, "2026-11-02", "Client", "English", 0, "draft", "Contains an unsigned draft of Prof. Ferrante's letter with figures the signed letter does not repeat. Never used."],
  [2, "Curriculum vitae (October 2026)", "CV", 3, 3, "2026-10-01", "Client", "English", 0, "weak", "Written by the beneficiary. Says \"over 1,500 citations\" and \"over 5,000 stars\"; the dated printouts say 1,418 and 4,812."],
  [3, "Curriculum vitae (March 2024)", "CV", 4, 4, "2024-03-01", "Client", "English", 0, "superseded", "Older version. Uses the name \"Reka Halasz-Toth\"."],
  [4, "Passport identity page", "Identity", 5, 5, null, "Government", "Hungarian, English", 1, "ok", "Expires 2 March 2027, before the requested period ends."],
  [5, "Form I-94 record", "Status", 6, 6, null, "Government", "English", 0, "ok", "H-1B admission ends 15 January 2027."],
  [6, "Employment agreement for the O-1 period (signed)", "Contract", 7, 8, "2026-10-20", "Employer", "English", 0, "ok", null],
  [7, "Itinerary of events and activities", "Itinerary", 9, 9, "2026-10-22", "Employer", "English", 0, "ok", "Unsigned. Dates for the Northgate reviews are not firm."],
  [8, "HR employment verification letter", "Employment", 10, 10, "2026-10-15", "Employer", "English", 0, "ok", "Current title: Senior Research Scientist."],
  [9, "Advisory opinion letter (Dr. Paul Brenner)", "Consultation", 11, 11, "2026-10-28", "Connected to employer", "English", 0, "excluded", "Dr. Brenner sits on Corvane's advisory board and holds shares. Not a peer group consultation."],
  [10, "Corvane company profile and funding announcement", "Company", 12, 12, "2026-09-01", "Employer", "English", 0, "ok", "85 employees on 1 September 2026."],
  [11, "Corvane press release", "Press release", 13, 13, "2026-09-10", "Employer", "English", 0, "excluded", "Written by the employer. Not published material about her by a third party."],
  [12, "Spark Award certificate", "Award", 14, 14, "2024-12-12", "Employer", "English", 0, "excluded", "Internal award decided by a colleague vote."],
  [13, "Protein Innovators Prize 2025: award letter and announcement", "Award", 15, 15, "2025-09-22", "Independent", "English", 0, "ok", null],
  [14, "Fiatal Kutatói Díj certificate", "Award", 16, 16, "2020-11-12", "Independent", "Hungarian", 1, "needs_translation", "No certified English translation in the file."],
  [15, "Hajdúsági Napló newspaper article", "Press", 17, 17, "2020-11-14", "Independent", "Hungarian", 1, "needs_translation", "Regional paper. No certified English translation in the file."],
  [16, "BioScene Leaders 40 Under 40 profile", "Award", 18, 18, "2025-06-01", "Paid", "English", 0, "excluded", "Self nominations allowed and a USD 1,450 \"Featured Honoree Package\" invoice. Pay to play."],
  [17, "ESPI Fellowship election letter and bylaws extract", "Membership", 19, 20, "2025-05-20", "Independent", "English", 0, "ok", null],
  [18, "North American Protein Society membership card", "Membership", 21, 21, "2026-01-01", "Paid", "English", 0, "excluded", "Open to anyone who pays dues."],
  [19, "PhD diploma with certified English translation", "Education", 22, 22, "2019-06-28", "Independent", "Hungarian, English", 0, "ok", null],
  [20, "Boston Life Sciences Review feature (print edition)", "Press", 23, 23, "2026-04-14", "Independent", "English", 1, "ok", null],
  [21, "Boston Life Sciences Review media kit 2026 (extract)", "Press", 24, 24, "2026-01-01", "Independent", "English", 0, "ok", null],
  [22, "Opinion article in The Scientist Weekly", "Press", 25, 25, "2026-02-18", "Beneficiary", "English", 0, "excluded", "Written by her, not about her."],
  [23, "Peer review records", "Judging", 26, 26, "2026-10-05", "Independent", "English", 0, "ok", "The IJARS invitations on the same page are left out: all fields, author fees, 24 hour deadline."],
  [24, "Letter from Prof. Lucia Ferrante (signed)", "Expert letter", 27, 27, "2026-10-18", "Independent", "English", 0, "ok", null],
  [25, "Letter from Dr. Mark Delaney, Northgate Pharma", "Expert letter", 28, 28, "2026-10-12", "Customer or partner", "English", 0, "ok", "Northgate has had a paid collaboration with Corvane since 2025. Must be disclosed."],
  [26, "Letter from Prof. Elena Marchetti", "Expert letter", 29, 29, "2026-10-09", "Former supervisor", "English", 0, "weak", "Not independent. Useful for who did what."],
  [27, "Letter from Dr. Andrew Kessler, CSO, Corvane", "Expert letter", 30, 30, "2026-10-21", "Employer", "English", 0, "weak", "Employer statement. Lowest weight."],
  [28, "FoldSight repository statistics", "Impact", 31, 31, "2026-11-01", "Independent", "English", 0, "ok", null],
  [29, "Google Scholar profile", "Impact", 32, 32, "2026-11-01", "Independent", "English", 1, "ok", null],
  [30, "Paper 1: FoldSight (J. Structural Informatics, 2022)", "Article", 33, 35, "2022-03-01", "Journal", "English", 0, "ok", "First author."],
  [31, "Paper 2: kinome study (Cell Systems Biology, 2024)", "Article", 36, 38, "2024-06-01", "Journal", "English", 0, "ok", "Fourth of six authors."],
  [32, "Paper 3: benchmark (J. Structural Informatics, 2024)", "Article", 39, 40, "2024-01-01", "Journal", "English", 0, "ok", "First author."],
  [33, "Articles citing the FoldSight paper (first 70 of 612)", "Impact", 41, 43, "2026-11-01", "Independent", "English", 0, "ok", null],
  [34, "Corvane investor presentation (September 2026)", "Company", 44, 49, "2026-09-01", "Employer", "English", 0, "weak", "Calls her \"Head of Research\" and says \"over 100\" employees. Marketing figures."],
  [35, "Form W-2 for 2025", "Pay", 50, 50, "2026-01-31", "Employer", "English", 1, "ok", "Box 1 (USD 191,212) includes the 2024 bonus. Not base salary."],
  [36, "Pay statement, October 2026", "Pay", 51, 51, "2026-10-31", "Employer", "English", 0, "ok", "Base salary USD 185,000."],
  [37, "Second copy of the Delaney letter (phone scan)", "Expert letter", 52, 52, "2026-10-12", "Client", "English", 1, "duplicate", "Same letter as page 28. File once."],
];

type Ev = { doc: number; page: number; grade: number; note?: string };
type Crit = { code: string; name: string; citation: string; recommendation: "claim" | "more" | "no"; strength: "Strong" | "Moderate" | "Weak"; summary: string; weakness: string; evidence: Ev[] };

// grade: 0 left out, 1 exists, 2 relevant, 3 supports the fact, 4 enough for the standard, 5 approved by the attorney
export const HALASZ_CRITERIA: Crit[] = [
  { code: "B1", name: "Prizes or awards", citation: "8 CFR 214.2(o)(3)(iii)(B)(1)", recommendation: "claim", strength: "Strong",
    summary: "Protein Innovators Prize 2025: one of three winners from 612 nominations in 41 countries, judged by a panel of 12.",
    weakness: "The Hungarian award can only support it once a certified translation is in the file.",
    evidence: [{ doc: 13, page: 15, grade: 4 }, { doc: 14, page: 16, grade: 2, note: "Needs certified translation" }, { doc: 16, page: 18, grade: 0, note: "Paid package" }, { doc: 12, page: 14, grade: 0, note: "Internal award" }] },
  { code: "B2", name: "Membership", citation: "8 CFR 214.2(o)(3)(iii)(B)(2)", recommendation: "claim", strength: "Strong",
    summary: "ESPI Fellowship: nominated by two Fellows, judged by a committee of nine senior scientists, at most 15 a year, cannot be bought.",
    weakness: "An official dated copy of the bylaws and the committee's names are still to be obtained.",
    evidence: [{ doc: 17, page: 19, grade: 4 }, { doc: 18, page: 21, grade: 0, note: "Open for dues" }] },
  { code: "B3", name: "Published material about her", citation: "8 CFR 214.2(o)(3)(iii)(B)(3)", recommendation: "claim", strength: "Strong",
    summary: "Boston Life Sciences Review feature, 14 April 2026, by Dana Whitfield. Audited print circulation 38,500; 410,000 online.",
    weakness: "The Hungarian newspaper article needs a certified translation and circulation data.",
    evidence: [{ doc: 20, page: 23, grade: 4 }, { doc: 21, page: 24, grade: 4 }, { doc: 15, page: 17, grade: 2, note: "Needs certified translation" }, { doc: 11, page: 13, grade: 0, note: "Employer's own release" }, { doc: 22, page: 25, grade: 0, note: "Written by her" }] },
  { code: "B4", name: "Judging the work of others", citation: "8 CFR 214.2(o)(3)(iii)(B)(4)", recommendation: "claim", strength: "Strong",
    summary: "Eleven manuscript reviews for the Journal of Structural Informatics, which accepted 21 percent of submissions in 2025.",
    weakness: "A signed letter on letterhead would be stronger than the printed record.",
    evidence: [{ doc: 23, page: 26, grade: 4 }] },
  { code: "B5", name: "Original contributions of major significance", citation: "8 CFR 214.2(o)(3)(iii)(B)(5)", recommendation: "claim", strength: "Strong",
    summary: "FoldSight: 612 citations of the paper, 4,812 stars, 182,000 downloads in 12 months, an independent professor's letter, and a pharma user with a Phase 1 candidate.",
    weakness: "Only one letter is fully independent. Two to four more would help.",
    evidence: [{ doc: 30, page: 33, grade: 4 }, { doc: 24, page: 27, grade: 4 }, { doc: 28, page: 31, grade: 4 }, { doc: 33, page: 41, grade: 4 }, { doc: 25, page: 28, grade: 3, note: "Disclose the paid collaboration" }, { doc: 26, page: 29, grade: 3, note: "Former supervisor" }, { doc: 31, page: 36, grade: 3, note: "Fourth of six authors" }] },
  { code: "B6", name: "Scholarly articles", citation: "8 CFR 214.2(o)(3)(iii)(B)(6)", recommendation: "claim", strength: "Strong",
    summary: "Three peer reviewed articles (2022, 2024, 2024), two as first author.",
    weakness: "Publisher copies or DOIs still to be obtained.",
    evidence: [{ doc: 30, page: 33, grade: 4 }, { doc: 31, page: 36, grade: 4 }, { doc: 32, page: 39, grade: 4 }, { doc: 22, page: 25, grade: 0, note: "Opinion piece, not scholarly" }] },
  { code: "B7", name: "Critical or essential role", citation: "8 CFR 214.2(o)(3)(iii)(B)(7)", recommendation: "more", strength: "Moderate",
    summary: "She leads Corvane's Structure Prediction group, but the proof of her role comes almost entirely from Corvane itself.",
    weakness: "Corvane's distinguished reputation rests on its Series B, the Northgate collaboration and one industry list.",
    evidence: [{ doc: 8, page: 10, grade: 3 }, { doc: 10, page: 12, grade: 3 }, { doc: 27, page: 30, grade: 2, note: "Employer statement" }, { doc: 34, page: 44, grade: 1, note: "Inflated title" }] },
  { code: "B8", name: "High salary", citation: "8 CFR 214.2(o)(3)(iii)(B)(8)", recommendation: "no", strength: "Weak",
    summary: "The O-1 salary is USD 205,000 as Principal Research Scientist. The survey median for that title in Greater Boston is USD 215,000.",
    weakness: "Below the median for the title. Claiming it would be an error.",
    evidence: [{ doc: 6, page: 7, grade: 3 }, { doc: 36, page: 51, grade: 3 }, { doc: 35, page: 50, grade: 2, note: "Includes 2024 bonus" }] },
];

type Issue = { key: string; kind: "conflict" | "missing" | "risk" | "date"; severity: "high" | "medium" | "low"; title: string; detail: string; pages: number[] };
export const HALASZ_ISSUES: Issue[] = [
  { key: "consult", kind: "risk", severity: "high", title: "The advisory opinion is not from a peer group", detail: "Dr. Brenner sits on Corvane's Scientific Advisory Board and holds shares. A consultation from an appropriate peer group is required (8 CFR 214.2(o)(5)). ISCSB and ESPI both know her work.", pages: [11] },
  { key: "translation", kind: "missing", severity: "high", title: "Two Hungarian documents have no certified translation", detail: "The Fiatal Kutatói Díj certificate and the Hajdúsági Napló article cannot be used until certified English translations are in the file (8 CFR 103.2(b)(3)).", pages: [16, 17] },
  { key: "i94", kind: "date", severity: "high", title: "H-1B status ends on 15 January 2027", detail: "The change of status petition has to be filed before then.", pages: [6] },
  { key: "passport", kind: "date", severity: "high", title: "Passport expires on 2 March 2027", detail: "That is before the requested period ends in January 2030. Renewal is needed; admission may be limited to passport validity.", pages: [5] },
  { key: "ferrante", kind: "risk", severity: "high", title: "An unsigned draft of the Ferrante letter is in the client's email", detail: "The draft says \"12 pharmaceutical companies\", \"cited more than 2,000 times\" and \"top five in the world\". The signed letter says none of this. Only the signed letter is used.", pages: [1, 2, 27] },
  { key: "title", kind: "conflict", severity: "medium", title: "Three different job titles", detail: "The client's email and the investor deck say \"Head of Research\". HR says Senior Research Scientist. The contract says Principal Research Scientist from January 2027. Lincoln proposes the HR title now and the contract title for the O-1 role.", pages: [1, 44, 10, 7] },
  { key: "citations", kind: "conflict", severity: "medium", title: "Citations: \"over 1,500\" against 1,418", detail: "The CV says over 1,500. The Google Scholar printout dated 1 November 2026 says 1,418. Lincoln proposes 1,418.", pages: [3, 32] },
  { key: "stars", kind: "conflict", severity: "medium", title: "GitHub stars: \"over 5,000\" against 4,812", detail: "The CV says over 5,000. The repository printout dated 1 November 2026 says 4,812. Lincoln proposes 4,812.", pages: [3, 31] },
  { key: "headcount", kind: "conflict", severity: "low", title: "Corvane headcount: 85 against \"over 100\"", detail: "The company profile says 85 on 1 September 2026. The press release and the deck say over 100. Lincoln proposes the dated figure.", pages: [12, 13, 44] },
  { key: "name", kind: "risk", severity: "medium", title: "An earlier name appears on the 2024 CV", detail: "\"Reka Halasz-Toth\" is on the older CV. The name history needs a short explanation and a supporting document.", pages: [4] },
  { key: "delaney", kind: "risk", severity: "medium", title: "The Delaney letter needs a disclosure", detail: "Northgate used FoldSight from 2023 but has had a paid collaboration with Corvane since 2025. The letter is filed once (the phone scan on page 52 is a duplicate) and the relationship is stated.", pages: [28, 52] },
  { key: "kinome", kind: "risk", severity: "medium", title: "She did not lead the 2024 kinome study", detail: "She is fourth of six authors. The author contributions say she adapted FoldSight and analyzed the pocket motion results. The letter says exactly that.", pages: [36] },
  { key: "w2", kind: "risk", severity: "low", title: "The W-2 figure is not base salary", detail: "Box 1 for 2025 (USD 191,212) includes the 2024 bonus. Base salary is USD 185,000.", pages: [50, 51] },
];

export const HALASZ_QUESTIONS: Question[] = [
  { id: "B1", topic: "Prizes or awards", q: "Claim prizes or awards on the Protein Innovators Prize 2025?", recommend: "yes", answer: null,
    evidence: [{ t: "One of three winners from 612 nominations in 41 countries", page: 15 }, { t: "Panel of 12 senior scientists; no one judged a nominee from their own institution", page: 15 }],
    why: "Independent, international and selective. The Hungarian award is added once its translation arrives." },
  { id: "B2", topic: "Membership", q: "Claim membership on the ESPI Fellowship?", recommend: "yes", answer: null,
    evidence: [{ t: "Nominated by two Fellows, judged by a committee of nine, at most 15 a year, cannot be bought", page: 19 }],
    why: "The bylaws require outstanding achievement judged by recognized experts. Ordinary memberships are left out." },
  { id: "B3", topic: "Published material", q: "Claim published material on the Boston Life Sciences Review feature?", recommend: "yes", answer: null,
    evidence: [{ t: "\"The scientist who taught algorithms to see proteins breathe\", Dana Whitfield, 14 April 2026", page: 23 }, { t: "Audited print circulation 38,500; 410,000 online monthly visitors", page: 24 }],
    why: "About her and her work, with title, date, author and circulation evidence." },
  { id: "B4", topic: "Judging", q: "Claim judging on the eleven Journal of Structural Informatics reviews?", recommend: "yes", answer: null,
    evidence: [{ t: "11 manuscripts reviewed since March 2024; the journal accepted 21 percent of 1,960 submissions in 2025", page: 26 }],
    why: "A selective peer reviewed journal in her own field." },
  { id: "B5", topic: "Original contributions", q: "Claim original contributions of major significance on FoldSight?", recommend: "yes", answer: null,
    evidence: [{ t: "612 citations of the FoldSight paper", page: 32 }, { t: "4,812 stars and 182,000 downloads in 12 months", page: 31 }, { t: "Prof. Ferrante: independent, uses it in her own group", page: 27 }, { t: "Northgate: a drug candidate from a FoldSight site entered Phase 1 in 2026", page: 28 }],
    why: "Adoption well beyond her employer, with an independent expert and a measured result." },
  { id: "B6", topic: "Scholarly articles", q: "Claim scholarly articles on the three peer reviewed papers?", recommend: "yes", answer: null,
    evidence: [{ t: "FoldSight (2022), first author", page: 33 }, { t: "Kinome study (2024), fourth of six authors", page: 36 }, { t: "Benchmark (2024), first author", page: 39 }],
    why: "All three are in peer reviewed journals. Her exact role in each is stated." },
  { id: "B7", topic: "Critical role", q: "Claim a critical role at Corvane?", recommend: "no", answer: null,
    evidence: [{ t: "Her role is described almost only by Corvane's own CSO", page: 30 }, { t: "The deck's \"Head of Research\" title conflicts with HR", page: 44 }],
    why: "Hold it back unless Corvane provides independent evidence of its reputation and her role. Six criteria are already strong." },
  { id: "B8", topic: "High salary", q: "Claim high salary?", recommend: "no", answer: null,
    evidence: [{ t: "O-1 salary: USD 205,000 as Principal Research Scientist", page: 7 }, { t: "Survey median for that title in Greater Boston: USD 215,000 (BioComp 2026 spreadsheet)" }],
    why: "The offered salary is below the median for the title. Claiming it would be an error." },
  { id: "FIG", topic: "Conflicting figures", q: "Use the dated figures everywhere: 1,418 citations, 4,812 stars, 85 employees, and the HR title Senior Research Scientist?", recommend: "yes", answer: null,
    evidence: [{ t: "Google Scholar printout, 1 November 2026", page: 32 }, { t: "Repository printout, 1 November 2026", page: 31 }, { t: "HR verification letter", page: 10 }],
    why: "Each is the later, dated or signed source. The CV and the investor deck are not." },
  { id: "OUT", topic: "Left out", q: "Leave out the BioScene 40 Under 40, the Spark Award, the NAPS membership, the IJARS reviews, Corvane's press release and the unsigned Ferrante draft?", recommend: "yes", answer: null,
    evidence: [{ t: "BioScene: self nominations and a USD 1,450 package invoice", page: 18 }, { t: "Spark Award: internal, colleague vote", page: 14 }, { t: "Unsigned draft with figures the signed letter does not repeat", page: 1 }],
    why: "Each would weaken the petition or misstate the record." },
];

const EA = "Employment agreement", HR = "HR employment verification letter", ISCSB = "Protein Innovators Prize award letter and announcement", ESPI = "ESPI Fellowship election letter and bylaws";
const BLSR = "Boston Life Sciences Review feature", KIT = "Boston Life Sciences Review media kit", JSI = "Peer review records", FER = "Letter from Prof. Lucia Ferrante", DEL = "Letter from Dr. Mark Delaney";
const MAR = "Letter from Prof. Elena Marchetti", GH = "FoldSight repository statistics", GS = "Google Scholar profile", P1 = "FoldSight article (2022)", P2 = "Kinome article (2024)", P3 = "Benchmark article (2024)";

export const HALASZ_LETTER: Section[] = [
  { id: "intro", heading: "Introduction", paras: [
    [f("Corvane Therapeutics, Inc. is a Delaware corporation with offices at 400 Binney Street, Cambridge, Massachusetts.", EA, 7), p(" Corvane petitions for O-1A classification of Dr. Réka Halász as an individual of extraordinary ability in the sciences under 8 CFR 214.2(o)(1)(ii)(A)(1)."), n(" Confirm change of status from H-1B rather than consular notification.")],
    [f("Corvane will employ Dr. Halász as Principal Research Scientist, Structure Prediction, reporting to its Chief Scientific Officer.", EA, 7), f(" She will lead the Structure Prediction group of six scientists and be responsible for the FoldSight platform.", EA, 7), f(" Employment begins on the later of 4 January 2027 or the date USCIS approves this petition, and continues for three years.", EA, 7), n(" The passport expires on 2 March 2027; renewed passport to be obtained.")],
  ] },
  { id: "field", heading: "The beneficiary and the field", paras: [
    [f("Dr. Halász is a Hungarian national, born in Debrecen.", "Passport identity page", 5), f(" She received her PhD in computational biology, summa cum laude, from Pannonia University of Sciences in Budapest on 28 June 2019.", "PhD diploma with certified translation", 22), f(" From 2019 to 2023 she was a postdoctoral researcher in the laboratory of Prof. Elena Marchetti at the Alpine Institute of Technology in Zurich.", MAR, 29)],
    [f("Corvane has employed Dr. Halász full time since 6 February 2023. Her current title is Senior Research Scientist, and she leads Corvane's Structure Prediction group of five scientists.", HR, 10), f(" Corvane was founded in 2020 and had 85 employees on 1 September 2026.", "Corvane company profile", 12)],
    [f("Her work centers on predicting how the binding pockets of proteins, where drugs attach, change shape.", P1, 33), f(" A single microsecond scale simulation of a medium sized protein can take weeks of computing time.", P1, 33), n(" An explanation of the name \"Halasz-Toth\" on the 2024 CV is to be obtained.")],
  ] },
  { id: "standard", heading: "The legal standard", paras: [
    [p("The O-1A classification is for a person of extraordinary ability in the sciences, education, business or athletics, shown by sustained national or international acclaim (INA 101(a)(15)(O)(i); 8 CFR 214.2(o)(1)(ii)(A)(1)). Extraordinary ability means \"a level of expertise indicating that the person is one of the small percentage who have arisen to the very top of the field of endeavor\" (8 CFR 214.2(o)(3)(ii)).")],
    [p("A petitioner may show a major internationally recognized award, or evidence meeting at least three of the eight criteria in 8 CFR 214.2(o)(3)(iii)(B). USCIS then reviews all the evidence together in a final merits determination (USCIS Policy Manual, Vol. 2, Part M, Ch. 4). The standard of proof is a preponderance of the evidence (Matter of Chawathe, 25 I&N Dec. 369 (AAO 2010))."), n(" Confirm the current Policy Manual section before filing.")],
  ] },
  { id: "B1", needs: "B1", heading: "Prizes or awards", cite: "8 CFR 214.2(o)(3)(iii)(B)(1)", paras: [
    [f("The International Society for Computational Structural Biology (ISCSB) awarded Dr. Halász its 2025 Protein Innovators Prize for the development of FoldSight.", ISCSB, 15), f(" She was one of three recipients, and received the prize at the ISCSB annual meeting in Lisbon on 22 September 2025.", ISCSB, 15)],
    [f("The ISCSB has about 4,200 members in 58 countries and has awarded the prize every year since 2009.", ISCSB, 15), f(" In 2025 the committee received 612 nominations from 41 countries.", ISCSB, 15), f(" A panel of 12 senior scientists from universities and industry reviewed them, and no panel member reviewed a nominee from their own institution.", ISCSB, 15), c(" The prize is therefore an internationally recognized award for excellence in her field.")],
    [n("The Hungarian Young Researcher Award (2020) is added here once its certified translation is in the file. BioScene 40 Under 40 and the Corvane Spark Award are deliberately left out.")],
  ] },
  { id: "B2", needs: "B2", heading: "Membership in associations requiring outstanding achievements", cite: "8 CFR 214.2(o)(3)(iii)(B)(2)", paras: [
    [f("On 20 May 2025 the Council of the European Society for Protein Informatics (ESPI) elected Dr. Halász a Fellow of the Society.", ESPI, 19), f(" Under ESPI's bylaws, Fellowship is the Society's highest class of membership and is conferred by election only.", ESPI, 19), f(" A candidate must be nominated by two existing Fellows who are not employed by the candidate's organization.", ESPI, 19), f(" A Fellowship Committee of nine senior scientists assesses each nomination and may recommend a candidate only for outstanding and sustained contributions to protein informatics.", ESPI, 19), f(" No more than fifteen Fellows may be elected in any year, and Fellowship cannot be applied for or purchased.", ESPI, 19)],
    [c("ESPI Fellowship therefore requires outstanding achievements, as judged by recognized international experts in the field."), n(" An official dated copy of the bylaws and the names of the 2025 Fellowship Committee are to be obtained.")],
  ] },
  { id: "B3", needs: "B3", heading: "Published material about the beneficiary", cite: "8 CFR 214.2(o)(3)(iii)(B)(3)", paras: [
    [f("\"The scientist who taught algorithms to see proteins breathe\", by Dana Whitfield, Senior Science Correspondent, appeared in the Boston Life Sciences Review on 14 April 2026.", BLSR, 23), f(" The article is about Dr. Halász and FoldSight, the free tool she built to predict how the pockets where drugs attach open and close.", BLSR, 23)],
    [f("The Boston Life Sciences Review has been published weekly since 1994.", KIT, 24), f(" Its audited print circulation in 2025 was 38,500, and it had 410,000 online monthly unique visitors.", KIT, 24), c(" It is a major trade publication in the life sciences."), n(" The full article with all pages and its URL is to be obtained. Corvane's press release and her own opinion article are left out.")],
  ] },
  { id: "B4", needs: "B4", heading: "Judging the work of others", cite: "8 CFR 214.2(o)(3)(iii)(B)(4)", paras: [
    [f("Since March 2024 Dr. Halász has served as an invited peer reviewer for the Journal of Structural Informatics and has completed reviews of 11 manuscripts.", JSI, 26), f(" The journal received 1,960 submissions in 2025 and accepted 21 percent of them.", JSI, 26), n(" A signed letter on the journal's letterhead is to be obtained. Reviews for the International Journal of Advanced Research Science are left out.")],
  ] },
  { id: "B5", needs: "B5", heading: "Original contributions of major significance", cite: "8 CFR 214.2(o)(3)(iii)(B)(5)", paras: [
    [f("Dr. Halász created FoldSight, an open source method that predicts from a single static structure the range of shapes a binding pocket can take, in under five minutes on one graphics card.", P1, 33), f(" The article's author contribution statement says that she conceived the method, wrote the software, ran all experiments and wrote the paper.", P1, 34), f(" Prof. Marchetti, her former supervisor and co-author, confirms this.", MAR, 29)],
    [f("On a held out test set of 310 proteins, FoldSight recovered 83 percent of the cryptic pockets seen in long simulations, against 41 percent for the best previous method.", P1, 33)],
    [f("On 1 November 2026 the public FoldSight repository had 4,812 stars, and the package had been downloaded 182,000 times in the previous 12 months.", GH, 31), f(" The account \"rhalasz\" made 71 percent of all commits.", GH, 31), f(" The FoldSight article has been cited 612 times.", GS, 32)],
    [f("Prof. Lucia Ferrante of Atlantic University in Lisbon has never worked with Dr. Halász, Corvane or her former laboratory.", FER, 27), f(" She writes that predicting how a binding pocket changes shape took weeks of simulation for each protein before FoldSight, and minutes after it.", FER, 27), f(" Her group and at least four others she knows of use FoldSight routinely.", FER, 27)],
    [f("Dr. Mark Delaney is Vice President, Computational Chemistry, at Northgate Pharma. His team began using FoldSight in 2023, before Northgate had any relationship with Corvane.", DEL, 28), f(" With it, Northgate identified a previously unknown binding site in an oncology target, and a candidate drug designed against that site entered a Phase 1 clinical trial in 2026.", DEL, 28), f(" In 2025 Northgate signed a paid research collaboration with Corvane.", DEL, 28)],
    [f("In a 2024 study of 518 human kinases, the authors found 92 previously unreported binding sites. Dr. Halász adapted FoldSight for kinases and analyzed the pocket motion results; other authors designed and led the study.", P2, 36), c(" Taken together, FoldSight is an original contribution of major significance: others have adopted it widely, and it has changed what is practical in drug discovery."), n(" Two to four further independent expert letters are to be obtained.")],
  ] },
  { id: "B6", needs: "B6", heading: "Authorship of scholarly articles", cite: "8 CFR 214.2(o)(3)(iii)(B)(6)", paras: [
    [f("Halász R, Marchetti E. \"FoldSight: learning binding pocket flexibility from molecular dynamics.\" Journal of Structural Informatics 18(3): 211–229 (2022). First author.", P1, 33)],
    [f("Brandauer T, Ito K, Nwosu A, Halász R, Weller J, Marchetti E. \"Flexible pocket docking finds hidden binding sites across the human kinome.\" Cell Systems Biology 9(6): 744–761 (2024). Fourth of six authors.", P2, 36)],
    [f("Halász R, Delgado M. \"Benchmarking pocket flexibility predictors on 1,200 drug targets.\" Journal of Structural Informatics 20(1): 33–49 (2024). First author.", P3, 39), f(" On 1 November 2026 her articles had been cited 1,418 times in total.", GS, 32), n(" Publisher copies or DOIs of all three articles are to be obtained.")],
  ] },
  { id: "B7", needs: "B7", heading: "Critical or essential role", cite: "8 CFR 214.2(o)(3)(iii)(B)(7)", paras: [
    [f("Dr. Halász leads Corvane's Structure Prediction group.", HR, 10), f(" Corvane has two oncology programs in preclinical development.", "Corvane company profile", 12), c(" Her role is critical to Corvane, an organization with a distinguished reputation in computational drug discovery."), n(" This section rests mostly on Corvane's own statements. Independent evidence of Corvane's reputation and of her role is to be obtained before filing.")],
  ] },
  { id: "consult", heading: "The consultation", cite: "8 CFR 214.2(o)(2)(ii)(D) and 214.2(o)(5)", paras: [
    [p("Corvane submits a written advisory opinion from [peer group, to be obtained] on the nature of Dr. Halász's work and her qualifications."), n(" No consultation is in the file. The letter from Dr. Paul Brenner is from a member of Corvane's Scientific Advisory Board who holds Corvane shares, so it is not used. This is time critical.")],
  ] },
  { id: "merits", heading: "Final merits", paras: [
    [c("Taken together, the evidence shows that Dr. Halász has sustained national and international acclaim and is among the small percentage at the very top of her field."), f(" She was one of three prize winners chosen from 612 nominations from 41 countries.", ISCSB, 15), f(" ESPI elects no more than fifteen Fellows a year.", ESPI, 19), f(" An independent professor uses FoldSight in her own group and knows of at least four others that do.", FER, 27), f(" A pharmaceutical company began using it in 2023 and with it found a binding site against which a drug candidate entered a Phase 1 trial in 2026.", DEL, 28), f(" Her work has been cited 1,418 times in all.", GS, 32), c(" The recognition is selective, independent and sustained from 2020 to 2026, and its impact reaches well beyond her employer."), n(" Field comparison data for citations is to be obtained.")],
  ] },
];
