import LegalShell, { type Clause } from "@/components/LegalShell";
import { COMPANY as C } from "@/lib/company";

export const metadata = { title: "Privacy Policy · Lincoln" };

const clauses: Clause[] = [
  { h: "Who is responsible", p: [`Lincoln is operated by ${C.legalName}, ${C.address} ("Lincoln"). Questions and requests about personal data go to ${C.contact}.`,
    "For account information, Lincoln decides how the data is used. For content a firm places in its workspace, the firm decides and Lincoln acts only on the firm's instructions, as its processor or service provider."] },
  { h: "Preview status", p: ["Lincoln is in a private preview. The security controls required for confidential client files are still being completed. Until Lincoln confirms in writing that they are in place, workspaces must hold sample or fictional matters only, and no real client information should be uploaded."] },
  { h: "Information collected", p: [[
    "Account information: name, work email address, firm name, role, and a password stored only as a salted hash.",
    "Workspace content: the matters, documents, messages, drafts, decisions and notes that members of a firm add or that Lincoln produces for them.",
    "Activity records: sign in times and the actions taken in a workspace by each member and by Lincoln, kept so that a firm has a record of who did what.",
    "Technical information: IP address and basic request data, used for security and for limiting repeated sign in attempts.",
  ]] },
  { h: "How information is used", p: [[
    "To provide the service: reading documents, preparing drafts and reminders, tracking dates and showing each firm its own matters.",
    "To keep the service secure, prevent misuse and investigate faults.",
    "To contact account holders about the service, such as password resets and important changes.",
  ], "Lincoln does not sell personal data, does not show advertising, and does not use workspace content to train artificial intelligence models."] },
  { h: "Artificial intelligence providers", p: ["To perform a requested task, Lincoln sends the content the task needs to Anthropic, which runs the AI models, on Lincoln's behalf and under its commercial terms. Those terms do not allow training on that content. Anthropic keeps request data only for the limited period its terms allow. Lincoln has not yet signed a zero data retention agreement with Anthropic and will state it here once it has. Every output records which model produced it."] },
  { h: "Service providers", p: ["Anthropic runs the AI models. Render hosts the service and stores workspaces. Resend sends account emails such as password resets. When a firm connects a Google or Microsoft account, Lincoln reads its mail, calendar and files only to do that firm's work."] },
  { h: "Sharing", p: ["Workspace content is visible only to members of the firm that owns it. Lincoln shares personal data only with service providers that host or process it for Lincoln under contract, and where the law requires disclosure. Lincoln will tell the firm concerned before a required disclosure where the law allows."] },
  { h: "Cookies", p: ["Lincoln sets one essential cookie that keeps a member signed in. It cannot be read by scripts and expires after twelve hours. Lincoln uses no advertising or analytics cookies."] },
  { h: "Security", p: ["Each record is tied to one firm and every request is limited to that firm's data. Passwords are stored as salted hashes, session and reset tokens are stored only in hashed form, and client document pages are served only to signed in members of the owning firm. Lincoln holds no security certification at present and will not claim one until an independent audit has been completed."] },
  { h: "Retention and deletion", p: ["Workspace content is kept while the firm's account is open. A firm may ask Lincoln to export or delete its workspace at any time, and Lincoln will delete it within 30 days of a verified request, except where the law requires a record to be kept. Activity and security records are kept for up to 12 months."] },
  { h: "Individual rights", p: ["Depending on where a person lives, they may have the right to access, correct, delete, restrict or object to the use of their personal data, to receive a copy of it, and to complain to a data protection authority. Requests go to the contact above. Where the data sits in a firm's workspace, Lincoln will pass the request to that firm."] },
  { h: "International transfers", p: ["Lincoln and its providers may process data in countries other than the one where it was collected. Where the law requires, Lincoln uses approved safeguards for those transfers, such as standard contractual clauses."] },
  { h: "Who may use Lincoln", p: ["Lincoln is a tool for legal professionals and their staff. It is not intended for anyone under 18, and it is not offered to members of the public seeking legal advice."] },
  { h: "Changes", p: ["Lincoln will post any change to this policy on this page and change the effective date. Account holders will be told by email about any change that materially affects how their data is used."] },
];

export default function Privacy() {
  return <LegalShell title="Privacy Policy" intro="This policy explains what information Lincoln collects, how it is used, and the choices available to the firms and people who use the service." clauses={clauses} />;
}
