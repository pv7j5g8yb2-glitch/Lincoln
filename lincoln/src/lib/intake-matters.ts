// What a client sees on the intake link: the matters in plain words, the questions each one needs and the
// documents to send. Questions only collect facts; nothing here ever tells a client what they qualify for.
// The case type code is how the firm's side files the case. American English, written for the client.

export type Field = { id: string; label: string; kind: "text" | "date" | "email" | "tel" | "long" | "choice"; options?: string[]; optional?: boolean; hint?: string };
export type DocItem = { id: string; label: string; optional?: boolean; hint?: string };
export type Matter = { id: string; label: string; code: string; codes: string[]; questions: Field[]; documents: DocItem[] };

const YES_NO = ["Yes", "No"];

/** Asked of every client, whatever the matter. */
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

const PASSPORT: DocItem = { id: "passport", label: "Passport", hint: "The page with your photo" };
const BIRTH: DocItem = { id: "birth", label: "Birth certificate" };
const I94: DocItem = { id: "i94", label: "I-94 record", optional: true, hint: "If you are in the United States" };
const ENTRY = { id: "entry", label: "How did you last enter the United States?", kind: "choice", options: ["With a visa", "With a green card", "Without being inspected", "I have never been to the United States", "Other"] } as const satisfies Field;
const ARRESTS = { id: "arrests", label: "Have you ever been arrested, cited or charged with a crime, anywhere?", kind: "choice", options: YES_NO } as const satisfies Field;
const REFUSED = { id: "refused", label: "Have you ever been refused a visa or entry, or been deported?", kind: "choice", options: YES_NO } as const satisfies Field;

export const MATTERS: Matter[] = [
  {
    id: "spouse", label: "Green card through my spouse", code: "I-130", codes: ["I-130", "I-485", "K-3", "DS-260"],
    questions: [
      { id: "spouse_name", label: "Your spouse's full name", kind: "text" },
      { id: "spouse_status", label: "Your spouse is a", kind: "choice", options: ["US citizen", "Green card holder"] },
      { id: "married_on", label: "Date of marriage", kind: "date" },
      { id: "married_in", label: "Place of marriage", kind: "text" },
      { id: "prior_marriage", label: "Have either of you been married before?", kind: "choice", options: YES_NO },
      ENTRY,
      { id: "entry_date", label: "Date of your last entry", kind: "date", optional: true },
      ARRESTS, REFUSED,
    ],
    documents: [
      PASSPORT, BIRTH,
      { id: "marriage", label: "Marriage certificate" },
      { id: "spouse_status_doc", label: "Your spouse's US passport, naturalization certificate or green card" },
      { id: "prior_divorce", label: "Divorce or death certificates from earlier marriages", optional: true, hint: "If either of you was married before" },
      I94,
      { id: "together", label: "Photos of the two of you together", optional: true },
      { id: "spouse_tax", label: "Your spouse's most recent tax return", optional: true },
    ],
  },
  {
    id: "family", label: "Green card through another family member", code: "I-130", codes: ["I-130"],
    questions: [
      { id: "relative_name", label: "Your relative's full name", kind: "text" },
      { id: "relationship", label: "They are your", kind: "choice", options: ["Parent", "Child", "Brother or sister"] },
      { id: "relative_status", label: "Your relative is a", kind: "choice", options: ["US citizen", "Green card holder"] },
      ENTRY, ARRESTS, REFUSED,
    ],
    documents: [
      PASSPORT, BIRTH,
      { id: "relative_status_doc", label: "Your relative's US passport, naturalization certificate or green card" },
      { id: "relationship_doc", label: "Documents that show how you are related", hint: "For example, birth certificates that name the same parent" },
      I94,
    ],
  },
  {
    id: "fiance", label: "Fiancé(e) visa", code: "I-129F", codes: ["I-129F"],
    questions: [
      { id: "partner_name", label: "Your fiancé(e)'s full name", kind: "text" },
      { id: "partner_country", label: "Where your fiancé(e) lives now", kind: "text" },
      { id: "last_met", label: "When you last met in person", kind: "date" },
      { id: "prior_marriage", label: "Have either of you been married before?", kind: "choice", options: YES_NO },
      ARRESTS,
    ],
    documents: [
      PASSPORT,
      { id: "partner_passport", label: "Your fiancé(e)'s passport" },
      { id: "citizenship_doc", label: "Proof of US citizenship", hint: "US passport, birth certificate or naturalization certificate" },
      { id: "met", label: "Proof you have met in person", hint: "Photos together, tickets, boarding passes" },
      { id: "prior_divorce", label: "Divorce or death certificates from earlier marriages", optional: true },
    ],
  },
  {
    id: "citizenship", label: "US citizenship", code: "N-400", codes: ["N-400"],
    questions: [
      { id: "resident_since", label: "Date you became a permanent resident", kind: "date" },
      { id: "marital", label: "Marital status", kind: "choice", options: ["Single", "Married", "Divorced", "Widowed"] },
      { id: "trips", label: "Trips outside the United States since you became a permanent resident", kind: "long", optional: true, hint: "Dates and countries, as best you can" },
      ARRESTS,
      { id: "taxes", label: "Have you filed a tax return every year as a resident?", kind: "choice", options: YES_NO },
    ],
    documents: [
      { id: "green_card", label: "Green card, front and back" },
      PASSPORT,
      { id: "marriage", label: "Marriage certificate", optional: true, hint: "If you are married" },
      { id: "court", label: "Court records", optional: true, hint: "If you were ever arrested or charged" },
    ],
  },
  {
    id: "renew", label: "Renew or replace my green card", code: "I-90", codes: ["I-90"],
    questions: [
      { id: "reason", label: "Why do you need a new card?", kind: "choice", options: ["It is expiring or has expired", "It was lost, stolen or damaged", "My name changed", "Other"] },
      { id: "expires", label: "Expiration date on the card", kind: "date", optional: true },
    ],
    documents: [
      { id: "green_card", label: "Green card, front and back", optional: true, hint: "Or a copy, if you still have it" },
      PASSPORT,
      { id: "name_change", label: "Name change document", optional: true, hint: "If your name changed" },
    ],
  },
  {
    id: "conditions", label: "Remove conditions on my green card", code: "I-751", codes: ["I-751"],
    questions: [
      { id: "card_date", label: "Date on your two year green card", kind: "date" },
      { id: "still_married", label: "Are you still married to the same spouse?", kind: "choice", options: YES_NO },
      { id: "children", label: "Children you have together", kind: "text", optional: true },
    ],
    documents: [
      { id: "green_card", label: "Green card, front and back" },
      { id: "joint", label: "Documents you share", hint: "Lease or mortgage, bank statements, joint tax returns, insurance" },
      { id: "children_birth", label: "Birth certificates of children you have together", optional: true },
    ],
  },
  {
    id: "work_permit", label: "Work permit", code: "I-765", codes: ["I-765"],
    questions: [
      { id: "basis", label: "What is your application based on?", kind: "choice", options: ["A pending green card application", "A pending asylum application", "DACA", "TPS", "Something else or not sure"] },
      { id: "current_expires", label: "Expiration date of your current work permit", kind: "date", optional: true },
    ],
    documents: [
      PASSPORT,
      { id: "current_ead", label: "Current or previous work permit, front and back", optional: true },
      { id: "receipt", label: "Receipt notice for your pending application", optional: true },
      I94,
    ],
  },
  {
    id: "asylum", label: "Asylum", code: "I-589", codes: ["I-589"],
    questions: [
      { id: "entry_date", label: "Date you last entered the United States", kind: "date" },
      { id: "fear_country", label: "Country you are afraid to return to", kind: "text" },
      { id: "family_here", label: "Family members with you in the United States", kind: "long", optional: true },
    ],
    documents: [
      PASSPORT, I94,
      { id: "support", label: "Any documents that support your story", optional: true, hint: "Reports, letters, medical records, photos" },
    ],
  },
  {
    id: "employer", label: "Work visa through my employer", code: "H-1B", codes: ["H-1B", "L-1A", "L-1B", "TN", "E-3", "H-1B1"],
    questions: [
      { id: "employer", label: "Employer", kind: "text" },
      { id: "job", label: "Job title", kind: "text" },
      { id: "degree", label: "Highest degree and field", kind: "text" },
      { id: "status", label: "Current visa or status, if in the United States", kind: "text", optional: true },
    ],
    documents: [
      PASSPORT,
      { id: "cv", label: "Résumé or CV" },
      { id: "degrees", label: "Diplomas and transcripts" },
      { id: "visa", label: "Current visa and I-94", optional: true },
      { id: "offer", label: "Job offer letter", optional: true },
    ],
  },
  {
    id: "talent", label: "Extraordinary ability (O-1 or EB-1)", code: "O-1A", codes: ["O-1A", "O-1B", "EB-1A", "EB-2 NIW"],
    questions: [
      { id: "field", label: "Your field", kind: "text" },
      { id: "organization", label: "Employer or organization", kind: "text", optional: true },
      { id: "achievements", label: "Your main achievements", kind: "long", hint: "Awards, publications, press, important roles" },
    ],
    documents: [
      PASSPORT,
      { id: "cv", label: "Résumé or CV" },
      { id: "awards", label: "Awards and prizes", optional: true },
      { id: "press", label: "Press about you or your work", optional: true },
      { id: "publications", label: "Publications", optional: true },
      { id: "letters", label: "Letters from experts in your field", optional: true },
    ],
  },
  {
    id: "daca", label: "DACA renewal", code: "I-821D", codes: ["I-821D"],
    questions: [
      { id: "daca_expires", label: "Date your current DACA expires", kind: "date" },
      { id: "address_changed", label: "Has your address changed since your last renewal?", kind: "choice", options: YES_NO },
      ARRESTS,
    ],
    documents: [
      { id: "current_ead", label: "Current work permit, front and back" },
      { id: "approval", label: "Most recent DACA approval notice" },
      { id: "id", label: "Passport or photo ID" },
    ],
  },
  {
    id: "other", label: "Something else", code: "", codes: [],
    questions: [{ id: "describe", label: "What do you need help with?", kind: "long" }],
    documents: [PASSPORT, { id: "other_docs", label: "Any documents about your case", optional: true }],
  },
];

export const matterById = (id: string | null | undefined) => MATTERS.find((m) => m.id === id) ?? null;
/** The matter a case of this type asks its client about, if one fits. */
export const matterForCode = (code: string | null | undefined) => (code ? MATTERS.find((m) => m.codes.includes(code)) ?? null : null);
