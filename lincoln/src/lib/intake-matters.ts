// What a client sees on the intake link: every kind of US immigration matter in plain words, grouped, with the
// questions each needs and the documents to send. Questions only collect facts; nothing here tells a client what
// they qualify for. The code is how the firm's side files the case; `codes` lists every case type in the library
// (lib/library.ts) that a case link of that type should open on. American English, written for the client.

export type Field = { id: string; label: string; kind: "text" | "date" | "email" | "tel" | "long" | "choice"; options?: string[]; optional?: boolean; hint?: string };
export type DocItem = { id: string; label: string; optional?: boolean; hint?: string };
export type Matter = { id: string; group: string; label: string; code: string; codes: string[]; questions: Field[]; documents: DocItem[] };

const YES_NO = ["Yes", "No"];

/** Asked of every client, whatever the matter: about the person filling in the link. */
export const ABOUT: Field[] = [
  { id: "name", label: "Full legal name", kind: "text", hint: "As it appears on your passport" },
  { id: "other_names", label: "Other names you have used", kind: "text", optional: true },
  { id: "dob", label: "Date of birth", kind: "date" },
  { id: "birth_country", label: "Country of birth", kind: "text" },
  { id: "citizenship", label: "Country of citizenship", kind: "text" },
  { id: "email", label: "Email", kind: "email" },
  { id: "phone", label: "Phone", kind: "tel" },
  { id: "address", label: "Current address", kind: "long" },
  { id: "where", label: "Where are you now?", kind: "choice", options: ["In the United States", "Outside the United States"] },
  { id: "a_number", label: "A-Number", kind: "text", optional: true, hint: "Only if you have one" },
];

// Questions used by many matters.
const q = {
  entry: { id: "entry", label: "How did you last enter the United States?", kind: "choice", options: ["With a visa", "With a green card", "With parole", "Without being inspected", "I have never been to the United States", "Other"] } as Field,
  entryDate: { id: "entry_date", label: "Date of your last entry", kind: "date", optional: true } as Field,
  status: { id: "status", label: "Your current immigration status", kind: "text", optional: true, hint: "For example H-1B, F-1, green card, none" } as Field,
  arrests: { id: "arrests", label: "Have you ever been arrested, cited or charged with a crime, anywhere?", kind: "choice", options: YES_NO } as Field,
  refused: { id: "refused", label: "Have you ever been refused a visa or entry, or been deported?", kind: "choice", options: YES_NO } as Field,
  court: { id: "in_court", label: "Have you ever been in immigration court?", kind: "choice", options: YES_NO } as Field,
  priorMarriage: { id: "prior_marriage", label: "Have either of you been married before?", kind: "choice", options: YES_NO } as Field,
  employer: { id: "employer", label: "Employer or company", kind: "text" } as Field,
  job: { id: "job", label: "Job title", kind: "text" } as Field,
  degree: { id: "degree", label: "Highest degree and field", kind: "text" } as Field,
  who: { id: "who", label: "You are", kind: "choice", options: ["The person the case is for", "The employer or company", "A family member or friend"] } as Field,
  person: { id: "person", label: "Name of the person the case is for", kind: "text", optional: true, hint: "If it is not you" } as Field,
  receipt: { id: "receipt", label: "Receipt number", kind: "text", optional: true, hint: "Three letters and ten numbers, on any USCIS notice" } as Field,
  describe: { id: "describe", label: "Tell us briefly what happened", kind: "long", optional: true } as Field,
};

// Documents used by many matters.
const d = {
  passport: { id: "passport", label: "Passport", hint: "The page with your photo" } as DocItem,
  birth: { id: "birth", label: "Birth certificate" } as DocItem,
  i94: { id: "i94", label: "I-94 record", optional: true, hint: "If you are in the United States" } as DocItem,
  greenCard: { id: "green_card", label: "Green card, front and back" } as DocItem,
  ead: { id: "ead", label: "Work permit, front and back", optional: true } as DocItem,
  marriage: { id: "marriage", label: "Marriage certificate" } as DocItem,
  priorDivorce: { id: "prior_divorce", label: "Divorce or death certificates from earlier marriages", optional: true, hint: "If either of you was married before" } as DocItem,
  notices: { id: "notices", label: "Any notices from USCIS, the court or a consulate", optional: true } as DocItem,
  courtDocs: { id: "court_docs", label: "Court papers", optional: true, hint: "Notice to Appear, hearing notices, judge's orders" } as DocItem,
  criminal: { id: "criminal", label: "Court records for any arrest or charge", optional: true } as DocItem,
  cv: { id: "cv", label: "Résumé or CV" } as DocItem,
  degrees: { id: "degrees", label: "Diplomas and transcripts" } as DocItem,
  offer: { id: "offer", label: "Job offer or employment letter", optional: true } as DocItem,
  pay: { id: "pay", label: "Recent pay stubs", optional: true } as DocItem,
  tax: { id: "tax", label: "Most recent tax return", optional: true } as DocItem,
  visa: { id: "visa", label: "Current visa", optional: true } as DocItem,
  id: { id: "photo_id", label: "Passport or photo ID" } as DocItem,
  other: { id: "other_docs", label: "Any other documents about your case", optional: true } as DocItem,
};

const m = (group: string, id: string, label: string, code: string, codes: string[], questions: Field[], documents: DocItem[]): Matter => ({ id, group, label, code, codes: [code, ...codes].filter(Boolean), questions, documents });

const FAMILY = "Family", GREEN = "Green card", WORK = "Work visas", WORK_GC = "Green card through work or investment", STUDY = "Visitors, students and exchange", CITIZEN = "Citizenship", HUMAN = "Protection and humanitarian", COURT = "Immigration court and detention", WAIVER = "Waivers", PROBLEM = "A problem with an application", EMPLOYER = "For employers", OTHER = "Something else";

export const GROUPS = [FAMILY, GREEN, WORK, WORK_GC, STUDY, CITIZEN, HUMAN, COURT, WAIVER, PROBLEM, EMPLOYER, OTHER];

export const MATTERS: Matter[] = [
  // Family
  m(FAMILY, "spouse", "Green card through my spouse", "I-130", ["I-485", "K-3", "I-864"], [
    { id: "spouse_name", label: "Your spouse's full name", kind: "text" },
    { id: "spouse_status", label: "Your spouse is a", kind: "choice", options: ["US citizen", "Green card holder"] },
    { id: "married_on", label: "Date of marriage", kind: "date" }, { id: "married_in", label: "Place of marriage", kind: "text" },
    q.priorMarriage, q.entry, q.entryDate, q.arrests, q.refused,
  ], [d.passport, d.birth, d.marriage, { id: "spouse_status_doc", label: "Your spouse's US passport, naturalization certificate or green card" }, d.priorDivorce, d.i94, { id: "together", label: "Photos of the two of you together", optional: true }, { id: "spouse_tax", label: "Your spouse's most recent tax return", optional: true }]),
  m(FAMILY, "family", "Green card through a parent, child, brother or sister", "I-130", [], [
    { id: "relative_name", label: "Your relative's full name", kind: "text" },
    { id: "relationship", label: "They are your", kind: "choice", options: ["Parent", "Child", "Brother or sister"] },
    { id: "relative_status", label: "Your relative is a", kind: "choice", options: ["US citizen", "Green card holder"] },
    q.entry, q.arrests, q.refused,
  ], [d.passport, d.birth, { id: "relative_status_doc", label: "Your relative's US passport, naturalization certificate or green card" }, { id: "relationship_doc", label: "Documents that show how you are related", hint: "For example, birth certificates that name the same parent" }, d.i94]),
  m(FAMILY, "fiance", "Fiancé(e) visa", "I-129F", [], [
    { id: "partner_name", label: "Your fiancé(e)'s full name", kind: "text" }, { id: "partner_country", label: "Where your fiancé(e) lives now", kind: "text" },
    { id: "last_met", label: "When you last met in person", kind: "date" }, q.priorMarriage, q.arrests,
  ], [d.passport, { id: "partner_passport", label: "Your fiancé(e)'s passport" }, { id: "citizenship_doc", label: "Proof of US citizenship", hint: "US passport, birth certificate or naturalization certificate" }, { id: "met", label: "Proof you have met in person", hint: "Photos together, tickets, boarding passes" }, d.priorDivorce]),
  m(FAMILY, "conditions", "Remove conditions on my two year green card", "I-751", [], [
    { id: "card_date", label: "Date on your two year green card", kind: "date" },
    { id: "still_married", label: "Are you still married to the same spouse?", kind: "choice", options: YES_NO },
    { id: "children", label: "Children you have together", kind: "text", optional: true },
  ], [d.greenCard, { id: "joint", label: "Documents you share", hint: "Lease or mortgage, bank statements, joint tax returns, insurance" }, { id: "children_birth", label: "Birth certificates of children you have together", optional: true }]),
  m(FAMILY, "widow", "Green card after my US citizen spouse died", "I-360 widow", [], [
    { id: "spouse_name", label: "Your late spouse's full name", kind: "text" }, { id: "married_on", label: "Date of marriage", kind: "date" },
    { id: "died_on", label: "Date your spouse died", kind: "date" }, { id: "remarried", label: "Have you remarried?", kind: "choice", options: YES_NO }, q.entry,
  ], [d.passport, d.birth, d.marriage, { id: "death", label: "Death certificate" }, { id: "spouse_citizenship", label: "Proof your spouse was a US citizen", optional: true }]),
  m(FAMILY, "refugee_family", "Bring family of a refugee or asylee", "I-730", [], [
    { id: "relative_name", label: "Family member's full name", kind: "text" },
    { id: "relationship", label: "They are your", kind: "choice", options: ["Spouse", "Child under 21"] },
    { id: "granted_on", label: "Date you were granted asylum or refugee status", kind: "date" },
  ], [d.passport, { id: "grant", label: "Your asylum approval or refugee document" }, { id: "relationship_doc", label: "Marriage or birth certificate showing the relationship" }]),
  m(FAMILY, "adoption", "Adopting a child from another country", "I-800", ["I-600", "I-600A", "I-800A"], [
    { id: "child_country", label: "Country of the child", kind: "text" }, { id: "child_name", label: "Child's name, if known", kind: "text", optional: true },
    { id: "home_study", label: "Do you have a home study?", kind: "choice", options: ["Yes", "In progress", "No"] },
  ], [d.passport, { id: "home_study_doc", label: "Home study", optional: true }, { id: "adoption_docs", label: "Adoption or placement documents", optional: true }]),
  m(FAMILY, "sponsor", "Financial sponsor for a relative", "I-864", ["I-134", "I-817"], [
    { id: "relative_name", label: "Name of the person you are sponsoring", kind: "text" }, { id: "household", label: "People in your household", kind: "text" },
    q.employer, { id: "income", label: "Yearly income", kind: "text" },
  ], [d.id, d.tax, d.pay, { id: "status_doc", label: "Proof of your US citizenship or green card" }]),

  // Green card
  m(GREEN, "adjust", "Green card while in the United States", "I-485", ["I-485 Supplement A", "I-485 Supplement J", "I-693", "I-687", "I-698", "I-694"], [
    { id: "basis", label: "What is your green card based on?", kind: "choice", options: ["Family", "Employer", "Asylum or refugee status", "Other or not sure"] },
    q.entry, q.entryDate, q.status, q.arrests, q.refused,
  ], [d.passport, d.birth, d.i94, { id: "petition", label: "Approval or receipt notice of the petition", optional: true }, d.visa, d.ead]),
  m(GREEN, "consular", "Immigrant visa interview abroad", "DS-260", [], [
    { id: "petition_type", label: "Who filed the petition for you?", kind: "choice", options: ["A family member", "An employer", "I filed it myself"] },
    { id: "nvc", label: "NVC case number", kind: "text", optional: true }, { id: "consulate", label: "Consulate or embassy", kind: "text", optional: true }, q.arrests, q.refused,
  ], [d.passport, d.birth, { id: "police", label: "Police certificates", optional: true }, { id: "petition", label: "Petition approval notice", optional: true }]),
  m(GREEN, "renew", "Renew or replace my green card", "I-90", [], [
    { id: "reason", label: "Why do you need a new card?", kind: "choice", options: ["It is expiring or has expired", "It was lost, stolen or damaged", "My name changed", "Other"] },
    { id: "expires", label: "Expiration date on the card", kind: "date", optional: true },
  ], [{ ...d.greenCard, optional: true, hint: "Or a copy, if you still have it" }, d.passport, { id: "name_change", label: "Name change document", optional: true }]),
  m(GREEN, "travel_doc", "Travel permission while my case is pending", "I-131", [], [
    { id: "pending", label: "What application is pending?", kind: "text" }, { id: "trip", label: "Where and when you want to travel", kind: "long" },
  ], [d.passport, { id: "receipt_doc", label: "Receipt notice for the pending application" }]),
  m(GREEN, "reentry", "Long trip abroad as a green card holder", "I-131 re-entry", ["SB-1"], [
    { id: "trip", label: "Where you are going and for how long", kind: "long" },
    { id: "already_out", label: "Have you already been outside the US for more than a year?", kind: "choice", options: YES_NO },
  ], [d.greenCard, d.passport]),
  m(GREEN, "abandon", "Give up my green card", "I-407", [], [{ id: "why", label: "Tell us briefly why", kind: "long", optional: true }], [d.greenCard, d.passport]),
  m(GREEN, "work_permit", "Work permit", "I-765", ["I-912"], [
    { id: "basis", label: "What is your application based on?", kind: "choice", options: ["A pending green card application", "A pending asylum application", "DACA", "TPS", "Something else or not sure"] },
    { id: "current_expires", label: "Expiration date of your current work permit", kind: "date", optional: true },
  ], [d.passport, d.ead, { id: "receipt_doc", label: "Receipt notice for your pending application", optional: true }, d.i94]),

  // Work visas
  m(WORK, "h1b", "H-1B professional work visa", "H-1B", ["I-907", "ETA-9035"], [q.who, q.person, q.employer, q.job, q.degree, q.status], [d.passport, d.cv, d.degrees, d.offer, d.visa, d.i94]),
  m(WORK, "l1", "Transfer within my company (L-1)", "L-1A", ["L-1B", "I-129S"], [q.who, q.person, q.employer, q.job, { id: "abroad_since", label: "Date you started with the company abroad", kind: "date" }], [d.passport, d.cv, { id: "org", label: "Organization chart", optional: true }, d.pay]),
  m(WORK, "talent", "Extraordinary ability visa (O-1)", "O-1A", ["O-1B", "O-2"], [
    { id: "field", label: "Your field", kind: "text" }, { id: "organization", label: "Employer, agent or organization", kind: "text", optional: true },
    { id: "achievements", label: "Your main achievements", kind: "long", hint: "Awards, publications, press, important roles" },
  ], [d.passport, d.cv, { id: "awards", label: "Awards and prizes", optional: true }, { id: "press", label: "Press about you or your work", optional: true }, { id: "letters", label: "Letters from experts in your field", optional: true }]),
  m(WORK, "artists", "Athletes, artists and entertainers (P visa)", "P-1", ["P-2", "P-3"], [
    { id: "field", label: "Sport, art or group", kind: "text" }, { id: "events", label: "Events or tour planned in the US", kind: "long" },
  ], [d.passport, { id: "contracts", label: "Contracts or itinerary" }, { id: "recognition", label: "Proof of recognition", optional: true }]),
  m(WORK, "treaty", "Treaty trader or investor (E-1 or E-2)", "E-2", ["E-1"], [
    q.employer, { id: "investment", label: "Amount invested or trade volume", kind: "text" }, { id: "business", label: "What the business does", kind: "long" },
  ], [d.passport, { id: "business_docs", label: "Business plan and company documents", optional: true }, { id: "funds", label: "Proof of the investment funds", optional: true }]),
  m(WORK, "tn", "Professionals from Canada, Mexico, Australia, Chile or Singapore", "TN", ["E-3", "H-1B1"], [q.employer, q.job, q.degree], [d.passport, d.degrees, d.offer, d.cv]),
  m(WORK, "seasonal", "Seasonal or farm workers (H-2A or H-2B)", "H-2B", ["H-2A", "ETA-9142"], [q.who, q.employer, { id: "workers", label: "Number of workers and dates needed", kind: "text" }], [{ id: "business_docs", label: "Company documents", optional: true }, d.other]),
  m(WORK, "religious", "Religious worker", "R-1", ["EB-4"], [q.employer, q.job, { id: "years", label: "Years as a member of the religion", kind: "text" }], [d.passport, { id: "ordination", label: "Ordination or religious training documents", optional: true }, d.offer]),
  m(WORK, "startup", "Entrepreneur or startup founder", "I-941", [], [q.employer, { id: "funding", label: "Funding raised", kind: "text", optional: true }, { id: "business", label: "What the company does", kind: "long" }], [d.passport, d.cv, { id: "business_docs", label: "Company and funding documents", optional: true }]),
  m(WORK, "other_work", "Another work visa (H-3, Q-1, I visa, CNMI)", "Q-1", ["H-3", "I visa", "I-129CW"], [q.employer, q.job, q.describe], [d.passport, d.offer, d.other]),

  // Green card through work or investment
  m(WORK_GC, "self_petition", "Green card on my own merit (EB-1A or NIW)", "EB-1A", ["EB-2 NIW", "EB-1B"], [
    { id: "field", label: "Your field", kind: "text" }, { id: "achievements", label: "Your main achievements", kind: "long", hint: "Awards, publications, citations, press, important roles" }, q.status,
  ], [d.passport, d.cv, { id: "publications", label: "Publications and citations", optional: true }, { id: "awards", label: "Awards and prizes", optional: true }, { id: "letters", label: "Letters from experts in your field", optional: true }]),
  m(WORK_GC, "employer_gc", "Green card through my employer (PERM)", "PERM", ["EB-2", "EB-3", "I-140", "ETA-9089", "ETA-9141", "PERM audit"], [q.who, q.person, q.employer, q.job, q.degree, q.status], [d.passport, d.cv, d.degrees, { id: "experience", label: "Letters from past employers", optional: true }, d.visa]),
  m(WORK_GC, "manager", "Green card as a multinational manager (EB-1C)", "EB-1C", [], [q.employer, q.job, { id: "abroad_role", label: "Your role at the company abroad", kind: "text" }], [d.passport, d.cv, { id: "org", label: "Organization charts", optional: true }]),
  m(WORK_GC, "investor", "Green card through investment (EB-5 or Gold Card)", "EB-5", ["I-526", "I-526E", "I-829", "I-956", "I-140G"], [
    { id: "amount", label: "Amount you plan to invest", kind: "text" }, { id: "project", label: "Project or regional center", kind: "text", optional: true },
    { id: "source", label: "Where the money comes from", kind: "long" },
  ], [d.passport, { id: "funds", label: "Proof of the source of funds", optional: true }, d.tax]),
  m(WORK_GC, "investor_conditions", "Remove conditions as an investor (I-829)", "I-829", [], [{ id: "card_date", label: "Date on your two year green card", kind: "date" }, { id: "project", label: "Project or regional center", kind: "text" }], [d.greenCard, { id: "investment_docs", label: "Investment and job creation documents", optional: true }]),

  // Visitors, students and exchange
  m(STUDY, "visitor", "Visitor visa (B-1 or B-2)", "B-1/B-2", ["DS-160"], [{ id: "purpose", label: "Purpose of the trip", kind: "long" }, { id: "dates", label: "Planned dates", kind: "text" }, q.refused], [d.passport, { id: "ties", label: "Proof of ties at home", optional: true, hint: "Job letter, property, family" }]),
  m(STUDY, "student", "Student visa (F-1 or M-1)", "F-1", ["M-1"], [{ id: "school", label: "School", kind: "text" }, { id: "program", label: "Program and start date", kind: "text" }, q.refused], [d.passport, { id: "i20", label: "Form I-20" }, { id: "funds", label: "Proof of funds", optional: true }]),
  m(STUDY, "opt", "Work after studies (OPT or STEM OPT)", "OPT", [], [{ id: "school", label: "School", kind: "text" }, { id: "degree_end", label: "Program end date", kind: "date" }, { id: "stem", label: "Is your degree in a STEM field?", kind: "choice", options: YES_NO }], [d.passport, { id: "i20", label: "Form I-20 with the OPT recommendation" }, d.ead, d.i94]),
  m(STUDY, "exchange", "Exchange visitor (J-1) or the two year home rule waiver", "J-1", ["I-612"], [{ id: "program", label: "Program and sponsor", kind: "text" }, { id: "need", label: "What you need", kind: "choice", options: ["A J-1 visa", "A waiver of the two year home residence rule", "Something else"] }], [d.passport, { id: "ds2019", label: "Form DS-2019", optional: true }]),
  m(STUDY, "extend", "Extend or change my status in the US", "I-539", [], [q.status, { id: "expires", label: "Date your current stay ends", kind: "date" }, { id: "want", label: "What you want to change to, or how long to stay", kind: "text" }], [d.passport, d.i94, d.visa]),
  m(STUDY, "i94_fix", "Fix or replace my I-94 record", "I-102", [], [{ id: "problem", label: "What is wrong with it", kind: "long" }], [d.passport, d.i94]),
  m(STUDY, "diplomat", "Diplomatic or international organization status", "A, G and NATO", [], [{ id: "organization", label: "Government or organization", kind: "text" }, q.describe], [d.passport, d.visa, d.other]),

  // Citizenship
  m(CITIZEN, "naturalize", "US citizenship", "N-400", ["N-648", "N-426", "N-470", "N-300"], [
    { id: "resident_since", label: "Date you became a permanent resident", kind: "date" },
    { id: "marital", label: "Marital status", kind: "choice", options: ["Single", "Married", "Divorced", "Widowed"] },
    { id: "trips", label: "Trips outside the United States since you became a permanent resident", kind: "long", optional: true, hint: "Dates and countries, as best you can" },
    q.arrests, { id: "taxes", label: "Have you filed a tax return every year as a resident?", kind: "choice", options: YES_NO },
    { id: "military", label: "Have you served in the US military?", kind: "choice", options: YES_NO },
  ], [d.greenCard, d.passport, { ...d.marriage, optional: true, hint: "If you are married" }, d.criminal]),
  m(CITIZEN, "certificate", "Certificate of citizenship through my parents", "N-600", ["N-600K"], [
    { id: "parent_citizen", label: "Which parent is or was a US citizen?", kind: "choice", options: ["Mother", "Father", "Both"] },
    { id: "where_now", label: "Do you live in the United States?", kind: "choice", options: YES_NO },
  ], [d.birth, { id: "parent_citizenship", label: "Your parent's proof of US citizenship" }, d.greenCard, { id: "parents_marriage", label: "Your parents' marriage certificate", optional: true }]),
  m(CITIZEN, "replace_cert", "Replace a citizenship or naturalization certificate", "N-565", ["N-644"], [{ id: "reason", label: "Why do you need a new one?", kind: "choice", options: ["Lost, stolen or destroyed", "Name or other change", "Error on the certificate"] }], [d.id, { id: "old_cert", label: "Copy of the old certificate", optional: true }]),

  // Protection and humanitarian
  m(HUMAN, "asylum", "Asylum", "I-589", ["I-590", "I-602"], [q.entryDate, { id: "fear_country", label: "Country you are afraid to return to", kind: "text" }, { id: "family_here", label: "Family members with you in the United States", kind: "long", optional: true }, q.court], [d.passport, d.i94, d.courtDocs, { id: "support", label: "Any documents that support your story", optional: true }]),
  m(HUMAN, "tps", "Temporary Protected Status (TPS)", "I-821", [], [{ id: "tps_country", label: "Country of TPS", kind: "text" }, { id: "first_tps", label: "Is this your first TPS application?", kind: "choice", options: YES_NO }, q.arrests], [d.passport, d.ead, { id: "presence", label: "Proof you have lived in the US", optional: true }]),
  m(HUMAN, "daca", "DACA", "I-821D", [], [{ id: "daca_expires", label: "Date your current DACA expires", kind: "date", optional: true }, { id: "first", label: "Is this your first DACA application?", kind: "choice", options: YES_NO }, q.arrests], [d.ead, { id: "approval", label: "Most recent DACA approval notice", optional: true }, d.id]),
  m(HUMAN, "u_visa", "Victim of a crime in the US (U visa)", "I-918", ["I-929"], [{ id: "crime", label: "Type of crime and when it happened", kind: "text" }, { id: "reported", label: "Was it reported to the police?", kind: "choice", options: YES_NO }], [d.passport, { id: "police_report", label: "Police report or court records", optional: true }, { id: "certification", label: "Form I-918 Supplement B, if you have it", optional: true }]),
  m(HUMAN, "t_visa", "Victim of human trafficking (T visa)", "I-914", [], [q.entryDate, q.describe], [d.passport, { id: "support", label: "Any documents about what happened", optional: true }]),
  m(HUMAN, "vawa", "Abuse by a US citizen or green card holder spouse or parent (VAWA)", "I-360 VAWA", ["I-765V"], [{ id: "abuser_status", label: "The person is a", kind: "choice", options: ["US citizen", "Green card holder"] }, { id: "relationship", label: "They are your", kind: "choice", options: ["Spouse or former spouse", "Parent", "Adult son or daughter"] }], [d.passport, { id: "relationship_doc", label: "Marriage or birth certificate showing the relationship", optional: true }, { id: "support", label: "Any documents about the abuse", optional: true }]),
  m(HUMAN, "sijs", "A child who was abused, abandoned or neglected (SIJS)", "SIJS", [], [{ id: "child_name", label: "Child's full name", kind: "text" }, { id: "child_dob", label: "Child's date of birth", kind: "date" }, { id: "state_court", label: "Is there a state court case?", kind: "choice", options: YES_NO }], [d.birth, { id: "court_order", label: "State court order", optional: true }]),
  m(HUMAN, "parole", "Humanitarian parole", "I-131 parole", [], [{ id: "person", label: "Name of the person who needs to come", kind: "text" }, { id: "reason", label: "Why they need to come", kind: "long" }], [d.passport, { id: "support", label: "Documents about the emergency", optional: true }]),
  m(HUMAN, "nacara", "NACARA relief", "I-881", [], [{ id: "since", label: "Date you entered the US", kind: "date" }, q.court], [d.passport, d.courtDocs]),
  m(HUMAN, "other_protection", "Other protection (Amerasian, S visa)", "I-360 Amerasian", ["I-854"], [q.describe], [d.passport, d.other]),

  // Immigration court and detention
  m(COURT, "court_case", "I have a case in immigration court", "Removal defense", ["EOIR-42A", "EOIR-42B", "Prosecutorial discretion", "Voluntary departure"], [
    { id: "next_hearing", label: "Date of your next hearing", kind: "date", optional: true }, { id: "court_city", label: "Court city", kind: "text", optional: true }, q.entry, q.arrests,
  ], [d.courtDocs, d.passport, d.criminal]),
  m(COURT, "detained", "Someone is detained by immigration (ICE)", "Detention", ["Bond", "Habeas"], [
    { id: "detained_name", label: "Full name of the person detained", kind: "text" }, { id: "facility", label: "Detention center, if known", kind: "text", optional: true },
    { id: "detained_on", label: "Date they were detained", kind: "date", optional: true }, { id: "relationship", label: "Your relationship to them", kind: "text" },
  ], [{ id: "detainee_docs", label: "Their ID or any papers they were given", optional: true }, d.criminal]),
  m(COURT, "order", "I have a deportation order", "Motion to reopen", ["I-246", "EOIR-26", "EOIR-29", "PFR"], [{ id: "order_date", label: "Date of the order", kind: "date", optional: true }, q.describe], [d.courtDocs, d.passport]),
  m(COURT, "border", "Fear interview at the border", "Expedited removal", [], [{ id: "where_held", label: "Where the person is held", kind: "text", optional: true }, { id: "fear_country", label: "Country they are afraid to return to", kind: "text" }], [d.other]),

  // Waivers
  m(WAIVER, "waiver", "Waiver for a past immigration or criminal issue", "I-601", ["I-601A", "I-212", "I-192", "I-193", "I-191", "I-690", "I-945", "I-356"], [
    { id: "issue", label: "What is the issue?", kind: "choice", options: ["Time in the US without status", "A past deportation", "A criminal record", "A finding of fraud or misrepresentation", "Other or not sure"] },
    { id: "qualifying", label: "Do you have a US citizen or green card holder spouse or parent?", kind: "choice", options: YES_NO }, q.describe,
  ], [d.passport, d.criminal, d.notices]),

  // A problem with an application
  m(PROBLEM, "rfe", "USCIS asked for more evidence or plans to deny", "RFE", ["NOID", "NOIR"], [q.receipt, { id: "due", label: "Response due date", kind: "date" }], [{ id: "notice", label: "The notice, every page" }, { id: "original", label: "Copy of what was filed", optional: true }]),
  m(PROBLEM, "denied", "My application was denied", "I-290B", ["N-336", "I-824"], [q.receipt, { id: "denied_on", label: "Date of the decision", kind: "date" }], [{ id: "decision", label: "The decision, every page" }, { id: "original", label: "Copy of what was filed", optional: true }]),
  m(PROBLEM, "delayed", "My case is taking too long", "Expedite", ["Case inquiry", "Mandamus", "APA"], [q.receipt, { id: "filed_on", label: "Date it was filed", kind: "date" }, { id: "why_urgent", label: "Any urgent reason", kind: "long", optional: true }], [{ id: "receipt_doc", label: "Receipt notice" }]),
  m(PROBLEM, "consular_refusal", "My visa was refused at a consulate", "221(g)", ["Consular reconsideration"], [{ id: "consulate", label: "Consulate or embassy", kind: "text" }, { id: "refused_on", label: "Date of the refusal", kind: "date" }], [{ id: "refusal", label: "Refusal letter" }, d.passport]),
  m(PROBLEM, "records", "Get my immigration records", "FOIA", ["G-884", "G-1041", "G-1566", "AR-11"], [{ id: "what", label: "What records you need", kind: "long" }], [d.id]),

  // For employers
  m(EMPLOYER, "compliance", "I-9, E-Verify or an ICE inspection", "I-9", ["Worksite enforcement", "PAF", "Site visit"], [q.employer, { id: "employees", label: "Number of employees", kind: "text" }, { id: "deadline", label: "Any deadline", kind: "date", optional: true }], [{ id: "notice", label: "Notice of inspection or other letter", optional: true }]),
  m(EMPLOYER, "mobility", "Immigration program for our employees", "Global mobility", [], [q.employer, { id: "needs", label: "What the company needs", kind: "long" }], [d.other]),

  // Something else
  m(OTHER, "advice", "I am not sure and want advice", "Consultation", ["Status planning", "Travel advice"], [q.status, { id: "question", label: "What do you need help with?", kind: "long" }], [d.passport, d.other]),
  m(OTHER, "criminal_case", "A criminal case and my immigration status", "Criminal consequences", [], [q.status, { id: "charge", label: "Charge and court date", kind: "text" }], [d.criminal, d.greenCard]),
  m(OTHER, "other", "Something else", "", [], [{ id: "describe", label: "What do you need help with?", kind: "long" }], [d.passport, d.other]),
];

export const matterById = (id: string | null | undefined) => MATTERS.find((x) => x.id === id) ?? null;
/** The matter a case of this type asks its client about, if one fits. */
export const matterForCode = (code: string | null | undefined) => (code ? MATTERS.find((x) => x.codes.includes(code)) ?? null : null);
