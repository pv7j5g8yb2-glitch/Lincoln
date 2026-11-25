// What the landing page says, shared by every design so they differ only in how they look. American English.
// Every name and number in an example is made up; every claim about Lincoln is true of the product today.

/** The hero line, in two lines: the first in white, the second in grey. No full stop (Ismael, 2026-11-25). */
export const HEADLINE: [string, string] = ["Your work done", "before you even ask"];

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

/** Lincoln works on any immigration case; these are the families of work, for the line under that statement. */
export const AREAS = "Employment, family, humanitarian, removal defense and naturalization.";

/** The Google and Microsoft services Lincoln connects to (the scopes in lib/integrations). Each has its logo in logos.ts. */
export const CONNECTORS: [string, string[]][] = [
  ["Google", ["Gmail", "Google Drive", "Google Docs", "Google Sheets", "Google Slides", "Google Calendar", "Google Chat"]],
  ["Microsoft", ["Outlook", "Outlook Calendar", "Word", "Excel", "PowerPoint", "OneDrive", "SharePoint", "Teams"]],
];

export const TRUST: [string, string][] = [
  ["Encrypted", "The database and every file, at rest."],
  ["Never used for training", "Client files are not used to train AI models."],
  ["Two-step sign in", "Can be required for the whole firm."],
  ["Yours to take", "Export or delete everything, at any time."],
];

export const STATEMENT = "Most of an immigration practice is paperwork. Lincoln does the paperwork. You practice law.";
