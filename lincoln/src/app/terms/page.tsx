import LegalShell, { type Clause } from "@/components/LegalShell";
import { COMPANY as C } from "@/lib/company";

export const metadata = { title: "Terms of Service · Lincoln" };

const clauses: Clause[] = [
  { h: "The agreement", p: [`These terms are an agreement between ${C.legalName} ("Lincoln") and the law firm or organization that opens an account (the "Customer"). The person who creates the account confirms that they are at least 18 and are authorized to accept these terms for the Customer.`] },
  { h: "The service", p: ["Lincoln is software that helps immigration law firms run their matters: it reads documents, prepares drafts, messages and reminders, tracks dates and records what was done. The service is in a private preview. Features may change, and Lincoln may limit or withdraw the preview at any time."] },
  { h: "Lincoln is not a law firm", p: ["Lincoln is not a lawyer or a law firm and does not give legal advice. Everything Lincoln produces is prepared for a licensed attorney to review. The Customer and its attorneys remain solely responsible for their legal work, including the accuracy of every document, the advice given to clients, every filing and every deadline. Nothing is to be filed with a government agency or sent as legal advice without an attorney's review and approval."] },
  { h: "Accounts", p: ["The Customer is responsible for its members' use of the service, for keeping sign in details confidential and for telling Lincoln promptly about any unauthorized access. Each person needs their own account. Shared sign ins are not permitted."] },
  { h: "Customer content", p: ["The Customer keeps all rights in the content it places in its workspace. The Customer gives Lincoln permission to host and process that content only to provide the service. Lincoln does not use Customer content to train artificial intelligence models.",
    "During the preview the Customer must not upload real client information. Workspaces are for sample or fictional matters until Lincoln confirms in writing that the workspace is approved for client data and the parties have signed a data processing agreement."] },
  { h: "Acceptable use", p: [[
    "No unlawful use, and no use to mislead a court, an agency or a client.",
    "No attempt to access another firm's data, to probe or disrupt the service, or to get round its security.",
    "No copying, reselling or reverse engineering of the service, except where the law allows it regardless of these terms.",
    "No use to offer legal services to the public without a licensed attorney's supervision.",
  ]] },
  { h: "Confidentiality", p: ["Each party will keep the other's confidential information secret and use it only for this agreement. Lincoln treats all Customer content as confidential."] },
  { h: "Fees", p: ["The preview is provided free of charge. Paid plans will be offered under a separate order with at least 30 days' notice. No charge is made without the Customer's agreement."] },
  { h: "Lincoln's property", p: ["Lincoln and its licensors own the service, including its software, design and name. These terms give the Customer a right to use the service and nothing more. Lincoln may use feedback about the service without obligation."] },
  { h: "No warranty", p: ["The preview is provided as it is. To the fullest extent the law allows, Lincoln gives no warranty that the service is free of errors, that its output is accurate or complete, or that it is fit for a particular purpose. Output produced with artificial intelligence can be wrong and must be checked by a qualified person."] },
  { h: "Limit of liability", p: ["To the fullest extent the law allows, Lincoln is not liable for indirect or consequential loss, lost profits, lost data or the outcome of any legal matter, and its total liability under these terms is limited to the greater of the fees the Customer paid in the previous 12 months and 100 US dollars. Nothing in these terms limits liability that cannot be limited by law."] },
  { h: "Ending the agreement", p: ["The Customer may close its account at any time. Lincoln may suspend or close an account that breaks these terms or puts the service or other firms at risk. On closure Lincoln deletes the workspace as set out in the Privacy Policy."] },
  { h: "Changes", p: ["Lincoln may update these terms. The new terms apply from the effective date shown on this page, and Lincoln will give account holders notice by email of any material change."] },
  { h: "Governing law and contact", p: [`These terms are governed by ${C.law}. Notices to Lincoln go to ${C.contact}, ${C.address}.`] },
];

export default function Terms() {
  return <LegalShell title="Terms of Service" intro="These terms govern access to and use of Lincoln." clauses={clauses} />;
}
