// What the landing page says, shared by every design so they differ only in how they look. American English.
// Every name and number in an example is made up; every claim about Lincoln is true of the product today.

export const HEADLINE = "Your work done before you even ask.";

export const WORK: { title: string; line: string }[] = [
  { title: "Opens cases from email", line: "A client writes in. The case is open before anyone sees the email." },
  { title: "Reads every page", line: "Conflicts, gaps and bars, each with the page it came from." },
  { title: "Fills every form", line: "Current editions, every answer traced to the file." },
  { title: "Drafts the petition", line: "Support letters and briefs, cited to the evidence and the law." },
  { title: "Answers RFEs", line: "Each point of the notice mapped to the evidence that meets it." },
  { title: "Collects documents", line: "Clients upload through a secure link. Lincoln follows up." },
  { title: "Keeps every deadline", line: "On the firm's calendar the moment a notice arrives." },
  { title: "Works in Word and Google Docs", line: "Tracked changes on the firm's own documents, with the reason." },
  { title: "Waits for approval", line: "Nothing is filed or sent without an attorney's approval." },
];

export const TYPES = [
  "H-1B", "O-1A", "O-1B", "EB-1A", "EB-1B", "EB-1C", "EB-2 NIW", "PERM", "L-1A", "L-1B", "TN", "E-2", "E-3", "R-1", "H-2B",
  "I-130", "I-485", "K-1", "I-751", "N-400", "DACA", "TPS", "Asylum", "U visa", "T visa", "VAWA", "Waivers", "Removal defense", "Consular processing", "SIJ",
];

/** Case types with their own rulebook in Lincoln (tests/rulebooks.test.mjs counts them). */
export const RULEBOOKS = 236;

export const TOOLS = ["Gmail", "Outlook", "Google Drive", "OneDrive", "SharePoint", "Microsoft Word", "Google Docs", "Google Calendar", "Microsoft Teams", "Google Chat"];

export const TRUST: [string, string][] = [
  ["Encrypted", "The database and every file, at rest."],
  ["Never used for training", "Client files are not used to train AI models."],
  ["Two-step sign in", "Can be required for the whole firm."],
  ["Yours to take", "Export or delete everything, at any time."],
];

export const STATEMENT = "Most of an immigration practice is paperwork. Lincoln does the paperwork. You practice law.";
