import Link from "next/link";
import { PageHead } from "@/components/ui";
import { requireUser } from "@/lib/session";

const QA: [string, string][] = [
  ["How Lincoln works", "Lincoln watches the connected mailbox and acts on new case work: it opens the case, reads every document, and drafts the replies, forms and letters. Everything it prepares waits in Review."],
  ["Review", "Every email, letter, form and filing packet waits for approval. Approve and send sends an email from the firm's own mailbox; Edit changes it first. Filings and legal drafts are approved by an attorney."],
  ["New cases", "Most cases open by themselves from mail. To open one by hand, use New case: describe the matter or attach files in one box."],
  ["Intake links", "Each attorney has an intake link in Settings, Profile, and the firm has one in Settings, Firm. Clients answer the questions and upload the documents their case type needs. Clients are never told whether they qualify."],
  ["Files", "Approved work is saved into the client's folder in the firm's Google Drive or OneDrive, as a new version whenever it changes."],
  ["Data", "Everything is stored encrypted. Admins can export all of the firm's data in Settings, Firm."],
  ["Limits", "Lincoln is not a lawyer. It gives no legal advice to the public, and signs, files or sends nothing legal without an attorney's approval."],
];

export default async function Help() {
  await requireUser();
  return (
    <div className="rise mx-auto max-w-[680px]">
      <PageHead title="Help" />
      <dl className="border-t border-line">
        {QA.map(([q, a]) => <div key={q} className="border-b border-line py-4"><dt className="mb-0.5 text-[13.5px] font-medium">{q}</dt><dd className="text-[13.5px] leading-relaxed text-muted">{a}</dd></div>)}
      </dl>
      <div className="mt-6 flex gap-5 text-[12.5px] text-muted">
        <Link href="/privacy" className="hover:text-ink">Privacy Policy</Link>
        <Link href="/terms" className="hover:text-ink">Terms of Service</Link>
      </div>
    </div>
  );
}
