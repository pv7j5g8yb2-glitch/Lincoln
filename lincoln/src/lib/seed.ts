import type Database from "better-sqlite3-multiple-ciphers";
import { HALASZ_CRITERIA, HALASZ_DOCS, HALASZ_ISSUES, HALASZ_QUESTIONS } from "./halasz";

// The sample workspace. Every firm, person, client, company and case here is made up.

export const DEMO_FIRM = "f_demo";
export const DEMO_USER = "u_maria";
const H = 3600_000;
const iso = (hoursAgo: number) => new Date(Date.now() - hoursAgo * H).toISOString();
const day = (daysFromNow: number) => new Date(Date.now() + daysFromNow * 24 * H).toISOString().slice(0, 10);
let seq = 0;
const id = (p: string) => `${p}_${(++seq).toString(36)}${Math.random().toString(36).slice(2, 8)}`;

type CaseRow = [id: string, ref: string, client: string, counterpart: string | null, code: string, typeName: string, family: string, stage: string, state: string, waiting: string | null, summary: string, att: string, para: string, openedDaysAgo: number, nextInDays: number | null, nextLabel: string | null, sensitive: 0 | 1];

const CASES: CaseRow[] = [
  ["c_halasz", "2026-0412", "Dr. Réka Halász", "Corvane Therapeutics, Inc.", "O-1A", "Extraordinary ability", "Evidence petitions", "Strategy", "needs_you", "Maria Alvarez", "52 pages read. Six of eight criteria strong. Ten strategy decisions pending.", "u_maria", "u_daniel", 4, 21, "Target filing", 0],
  ["c_haddad", "2026-0398", "Mariam Haddad", null, "N-400", "Naturalization", "Citizenship and documents", "Evidence", "needs_you", "Maria Alvarez", "Green card, passports and tax returns read. A 171 day absence in 2019 is flagged. Two tax transcripts outstanding.", "u_maria", "u_aisha", 19, 3, "Planned filing", 0],
  ["c_eze", "2026-0291", "Chidi Eze", "Okafor Systems LLC", "H-1B", "Extension", "Work visas", "Filed", "moving", "USCIS", "Extension filed 9 September. Receipt notice on file.", "u_james", "u_daniel", 71, null, null, 0],
  ["c_ribeiro", "2026-0377", "Ana and Tomás Ribeiro", null, "I-130 / I-485", "Marriage based green card", "Relationship petitions", "Evidence", "waiting", "Client", "14 of 16 documents received. Outstanding: joint lease; certified translation of birth certificate.", "u_james", "u_aisha", 26, 12, "Medical examination", 0],
  ["c_nair", "2026-0355", "Dr. Priya Nair", null, "EB-2 NIW", "National Interest Waiver", "Evidence petitions", "Evidence", "waiting", "Referees", "2 of 5 referee letters signed. Petition letter drafted to the endeavour section.", "u_maria", "u_daniel", 33, 9, "Referee deadline", 0],
  ["c_mejia", "2026-0340", "L. F. M.", null, "I-589", "Asylum (defensive)", "Humanitarian", "Drafting", "moving", null, "Declaration, second draft, with James Whitaker. Every fact cited to the interview notes.", "u_james", "u_aisha", 48, 38, "Individual hearing", 1],
  ["c_watanabe", "2026-0421", "Kenji Watanabe", "Brightline Robotics K.K.", "L-1A", "New office", "Evidence petitions", "Intake", "moving", "Client", "Engagement signed. Client asked for passport, CV and company documents.", "u_maria", "u_aisha", 1, 6, "Questionnaire due", 0],
  ["c_petrova", "2026-0302", "Sofia Petrova", null, "I-751", "Removal of conditions", "Relationship petitions", "Filed", "moving", "USCIS", "Filed 21 October. Receipt notice awaited.", "u_james", "u_daniel", 60, null, null, 0],
  ["c_mwangi", "2026-0318", "G. M.", null, "I-918", "U visa", "Humanitarian", "Evidence", "waiting", "Police department", "Supplement B certification requested 14 October.", "u_maria", "u_aisha", 52, 5, "Follow up", 1],
  ["c_perm", "2026-0266", "Corvane Therapeutics, Inc.", "for Wei Chen", "PERM", "Labor certification", "Labor certification", "Evidence", "moving", null, "Prevailing wage determination received. Recruitment open to 2 December.", "u_maria", "u_daniel", 96, 19, "Recruitment closes", 0],
  ["c_ortiz", "2026-0349", "Daniel Ortiz", null, "I-601A", "Provisional waiver", "Waivers", "Drafting", "moving", null, "Hardship evidence mapped to each factor. Brief in drafting. Two medical records outstanding.", "u_james", "u_aisha", 40, 15, "Draft to attorney", 0],
  ["c_schmidt", "2026-0388", "Hannah Schmidt", null, "FOIA", "A-file request", "Records", "Filed", "waiting", "USCIS", "Request filed 30 October.", "u_maria", "u_daniel", 14, null, null, 0],
];

export function seed(d: Database.Database) {
  seq = 0;
  const F = DEMO_FIRM;
  d.prepare("INSERT INTO firms (id, name, demo) VALUES (?, ?, 1)").run(F, "Kestrel Immigration Law");
  const insUser = d.prepare("INSERT INTO users (id, firm_id, name, email, role, initials, password_hash, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  insUser.run("u_maria", F, "Maria Alvarez", "maria@kestrel.example", "Managing attorney", "MA", null, iso(0));
  insUser.run("u_james", F, "James Whitaker", "james@kestrel.example", "Attorney", "JW", null, iso(0));
  insUser.run("u_daniel", F, "Daniel Kim", "daniel@kestrel.example", "Paralegal", "DK", null, iso(0));
  insUser.run("u_aisha", F, "Aisha Rahman", "aisha@kestrel.example", "Paralegal", "AR", null, iso(0));

  const insCase = d.prepare(`INSERT INTO cases (id, firm_id, ref, client, counterpart, type_code, type_name, family, stage, state, waiting_on, summary, attorney_id, paralegal_id, opened_at, next_date, next_date_label, sensitive, pages)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
  for (const c of CASES) insCase.run(c[0], F, c[1], c[2], c[3], c[4], c[5], c[6], c[7], c[8], c[9], c[10], c[11], c[12], iso(c[13] * 24), c[14] === null ? null : day(c[14]), c[15], c[16], c[0] === "c_halasz" ? 52 : 0);

  const insDoc = d.prepare("INSERT INTO documents (id, firm_id, case_id, n, title, kind, page_from, page_to, doc_date, source, language, is_scan, status, note, received_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  for (const x of HALASZ_DOCS) insDoc.run(id("d"), F, "c_halasz", x[0], x[1], x[2], x[3], x[4], x[5], x[6], x[7], x[8], x[9], x[10], iso(86));
  const insCrit = d.prepare("INSERT INTO criteria (id, firm_id, case_id, n, code, name, citation, recommendation, strength, summary, weakness, evidence) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  HALASZ_CRITERIA.forEach((c, i) => insCrit.run(id("k"), F, "c_halasz", i + 1, c.code, c.name, c.citation, c.recommendation, c.strength, c.summary, c.weakness, JSON.stringify(c.evidence)));
  const insIssue = d.prepare("INSERT INTO issues (id, firm_id, case_id, kind, severity, title, detail, sources, status, resolution, created_at, resolved_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', NULL, ?, NULL)");
  for (const i of HALASZ_ISSUES) insIssue.run(`i_${i.key}`, F, "c_halasz", i.kind, i.severity, i.title, i.detail, JSON.stringify(i.pages), iso(84));
  const insDate = d.prepare("INSERT INTO dates (id, firm_id, case_id, label, date, kind, source) VALUES (?, ?, ?, ?, ?, ?, ?)");
  insDate.run(id("t"), F, "c_halasz", "H-1B status ends (I-94)", "2027-01-15", "expiry", "Form I-94, p. 6");
  insDate.run(id("t"), F, "c_halasz", "Passport expires", "2027-03-02", "expiry", "Passport, p. 5");
  insDate.run(id("t"), F, "c_halasz", "O-1 employment starts", "2027-01-04", "start", "Employment agreement, p. 7");
  insDate.run(id("t"), F, "c_halasz", "Target filing", day(21), "target", "Set by Maria Alvarez");
  for (const c of CASES) if (c[0] !== "c_halasz" && c[14] !== null && c[15]) insDate.run(id("t"), F, c[0], c[15], day(c[14]), "target", null);
  insDate.run(id("t"), F, "c_mejia", "Evidence filing deadline", day(23), "deadline", "Scheduling order");

  const insMsg = d.prepare("INSERT INTO messages (id, firm_id, case_id, direction, party, party_role, subject, body, at, state, lincoln_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
  insMsg.run("m_h_in", F, "c_halasz", "in", "Réka Halász", "Client", "Documents for my O-1", "Dear Maria,\n\nAs promised, here is everything I could find, in one PDF (52 pages), plus the salary survey HR sent me as a spreadsheet. Prof. Ferrante's letter is in there twice, I think: her first draft and the signed one.\n\nI am Head of Research now, so please use that title. My CV has the latest numbers.\n\nBest wishes,\nRéka", iso(86), "filed", "52 pages and one spreadsheet read. 37 documents, 13 issues. Title and CV figures not adopted: the HR letter and dated printouts differ.");
  insMsg.run("m_h_client", F, "c_halasz", "out", "Réka Halász", "Client", "Three items needed for the petition", "Dear Réka,\n\nThank you for sending everything over. We have been through all of it, and the petition is in good shape. There are three things we need from you before we can file.\n\nFirst, the Fiatal Kutatói Díj certificate and the Hajdúsági Napló article need certified English translations. We can arrange these through our translator and add the cost to your invoice, or you can use a translator of your own. Let me know which you would prefer.\n\nSecond, your 2024 CV uses the name Halász-Tóth. Could you send a short note about the change, along with a marriage certificate or similar document if you have one?\n\nThird, your passport expires on March 2, 2027, before the O-1 period would end. Please start the renewal now and send us a copy of the new photo page when it arrives.\n\nOne quick question as well: is the GitHub account rhalasz yours?\n\nYour H-1B status runs until January 15, 2027, so we are aiming to file well before then.\n\nBest regards,\nMaria Alvarez\nKestrel Immigration Law", iso(10), "needs_approval", "Drafted from the open issues.");
  insMsg.run("m_h_iscsb", F, "c_halasz", "out", "ISCSB Secretariat", "Peer group", "Request for an advisory opinion: Dr. Réka Halász (O-1A)", "Dear Secretariat,\n\nWe represent Corvane Therapeutics, Inc., which is preparing an O-1A petition for Dr. Réka Halász, one of the recipients of your 2025 Protein Innovators Prize.\n\nThe petition needs a written advisory opinion from a peer group in her field, describing the nature of her work and her qualifications (8 CFR 214.2(o)(5)). As the international society in computational structural biology, the ISCSB would be the natural body to provide it.\n\nWould the Society be willing to write a short letter? We would be glad to send a summary of her work and the points such a letter usually covers. A reply by the end of next week would help us keep to the filing timeline.\n\nSincerely,\nMaria Alvarez\nKestrel Immigration Law", iso(9), "needs_approval", "The Brenner letter cannot serve as the consultation.");
  insMsg.run(id("m"), F, "c_ribeiro", "out", "Ana Ribeiro", "Client", "Reminder: two documents outstanding", "Dear Ana,\n\nJust following up on the two documents we still need for your case: the joint lease, and a certified translation of Tomás's birth certificate. You can attach them to a reply to this email.\n\nBest regards,\nAisha Rahman\nKestrel Immigration Law", iso(30), "sent", "Reminder, sent under the firm's three day rule.");
  insMsg.run(id("m"), F, "c_ribeiro", "in", "Ana Ribeiro", "Client", "Re: Reminder: two documents outstanding", "Hi Aisha, sorry for the delay. The landlord is sending the lease this week. The translation is being done by my cousin, is that ok?", iso(20), "filed", "Flagged for Aisha Rahman: a relative's translation needs a translator's certification. Reply drafted.");
  insMsg.run(id("m"), F, "c_nair", "in", "Prof. Henrik Lindqvist", "Referee", "Re: Letter of support for Dr. Nair", "Dear Mr Kim, I have made two small changes to the second paragraph and signed. Attached.", iso(15), "filed", "Signed letter filed. Two wording changes against the draft, none of substance.");
  insMsg.run(id("m"), F, "c_watanabe", "out", "Kenji Watanabe", "Client", "Welcome, and first steps", "Dear Mr. Watanabe,\n\nThank you for signing the engagement letter. We are looking forward to working with you on the L-1A petition.\n\nTo get started, could you send us a copy of your passport, your current CV, and the most recent annual report for Brightline Robotics K.K.? Once we have these, we will put together a timeline for the petition and share it with you.\n\nBest regards,\nAisha Rahman\nKestrel Immigration Law", iso(18), "sent", "Sent on signature of the engagement letter.");
  insMsg.run(id("m"), F, "c_eze", "in", "USCIS", "Government", "Receipt notice (Form I-797C)", "Receipt notice for Form I-129, received 9 September 2026.", iso(24 * 60), "filed", "Receipt number and dates recorded.");
  insMsg.run(id("m"), F, "c_perm", "in", "Corvane HR", "Employer", "Applicant CVs, week 2", "Three more applications came in for the posting. CVs attached.", iso(27), "filed", "Three applicant CVs filed to the case.");

  const insAppr = d.prepare("INSERT INTO approvals (id, firm_id, case_id, kind, title, brief, least_sure, if_wrong, payload, status, assignee_id, created_at, due) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending', ?, ?, ?)");
  insAppr.run("a_h_strategy", F, "c_halasz", "decisions", "Petition strategy", "Ten decisions. The support letter is drafted from the answers.", "Critical role: the evidence comes mostly from the employer.", "A criterion claimed on weak evidence invites a Request for Evidence.", JSON.stringify({ questions: HALASZ_QUESTIONS }), "u_maria", iso(10), day(2));
  insAppr.run("a_h_client", F, "c_halasz", "message", "Email to client: three items", "Request for translations, name history and passport renewal.", null, null, JSON.stringify({ messageId: "m_h_client" }), "u_maria", iso(10), day(1));
  insAppr.run("a_h_iscsb", F, "c_halasz", "message", "Request for advisory opinion", "To the ISCSB, in place of the Brenner letter.", "Whether ESPI should be asked instead, or as well.", "The consultation is required and status ends 15 January.", JSON.stringify({ messageId: "m_h_iscsb" }), "u_maria", iso(9), day(1));
  insMsg.run("m_haddad", F, "c_haddad", "out", "Mariam Haddad", "Client", "Two tax transcripts", "Dear Mariam,\n\nThank you for the documents. Everything is here except your IRS tax transcripts for 2022 and 2023. You can download both from your online account at irs.gov in a few minutes. Could you send them over this week? Once we have them, we can finalize your application.\n\nBest regards,\nMaria Alvarez\nKestrel Immigration Law", iso(14), "needs_approval", "Drafted from the open issues.");
  insAppr.run("a_haddad", F, "c_haddad", "message", "Email to client: tax transcripts", "Request for the 2022 and 2023 IRS tax transcripts.", null, null, JSON.stringify({ messageId: "m_haddad" }), "u_maria", iso(14), day(3));
  for (const [n, title, kind, source, note] of [[1, "Permanent Resident Card", "Identity", "Government", null], [2, "Passport (2014 to 2024)", "Identity", "Government", "Entry and exit stamps used for the absences."], [3, "Passport (current)", "Identity", "Government", null], [4, "Tax return 2024 and IRS transcript", "Tax", "Government", null], [5, "Tax returns 2022 and 2023", "Tax", "Client", "Returns only. The IRS transcripts are still needed."]] as [number, string, string, string, string | null][]) insDoc.run(id("d"), F, "c_haddad", n, title, kind, null, null, null, source, "English", 0, "ok", note, iso(40));
  insIssue.run("i_haddad_absence", F, "c_haddad", "risk", "high", "A 171 day absence in 2019", "3 February to 24 July 2019, from the passport stamps. Under 180 days, so continuous residence is not presumed broken, but the officer may ask about it.", "[]", iso(39));
  insIssue.run("i_haddad_tax", F, "c_haddad", "missing", "medium", "Tax transcripts for 2022 and 2023", "Only the 2024 transcript is in the file.", "[]", iso(39));

  const insAct = d.prepare("INSERT INTO activity (id, firm_id, case_id, at, actor, kind, text, minutes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
  const act = (c: string | null, h: number, kind: string, text: string, min: number) => insAct.run(id("x"), F, c, iso(h), "Lincoln", kind, text, min);
  act("c_halasz", 86, "read", "Read 52 page client file and salary spreadsheet. 37 documents, 7 scanned.", 150);
  act("c_halasz", 85.5, "file", "Filed client email and attachments.", 4);
  act("c_halasz", 85, "check", "Compared figures across documents. 13 issues opened, 4 conflicts.", 60);
  act("c_halasz", 84, "date", "Set three dates: I-94 end, passport expiry, employment start.", 9);
  act("c_halasz", 60, "evidence", "Graded 37 documents against the eight O-1A criteria.", 180);
  act("c_halasz", 59, "check", "Six items left out, reasons recorded.", 25);
  act("c_halasz", 10.5, "draft", "Prepared ten strategy decisions.", 40);
  act("c_halasz", 10, "draft", "Drafted client request: translations, name history, passport.", 12);
  act("c_halasz", 9, "draft", "Drafted request to the ISCSB for an advisory opinion.", 15);
  act("c_haddad", 40, "read", "Read the green card, two passports and three tax returns.", 55);
  act("c_haddad", 39, "check", "Flagged a 171 day absence in 2019 from the passport stamps.", 20);
  act("c_haddad", 14, "draft", "Drafted client request: two tax transcripts.", 8);
  act("c_ribeiro", 54, "read", "Read 14 documents. One returned: marriage certificate scan cut off at the seal.", 45);
  act("c_ribeiro", 30, "chase", "Reminder sent: joint lease, birth certificate translation.", 6);
  act("c_ribeiro", 20, "file", "Filed client reply. Translation question flagged.", 5);
  act("c_nair", 72, "draft", "Drafted five referee letters.", 150);
  act("c_nair", 70, "send", "Drafts issued to each referee for edit and signature.", 15);
  act("c_nair", 15, "file", "Filed signed Lindqvist letter. No change of substance.", 10);
  act("c_mejia", 44, "draft", "Drafted the declaration from the interview notes, each fact cited to its page.", 120);
  act("c_mejia", 22, "date", "Set the evidence deadline from the scheduling order.", 5);
  act("c_watanabe", 19, "open", "Case opened on signature of the engagement letter.", 10);
  act("c_watanabe", 18, "send", "Asked the client for passport, CV and company documents.", 8);
  act("c_mwangi", 26, "chase", "Follow up sent to the police department.", 8);
  act("c_perm", 27, "file", "Filed three applicant CVs to the case.", 12);
  act("c_perm", 100, "date", "Set recruitment close and 30 day quiet period.", 6);
  act("c_ortiz", 33, "evidence", "Mapped 22 hardship documents to the five factors.", 90);
  act("c_ortiz", 12, "draft", "Drafted statement of facts for the waiver brief.", 75);
  for (let dgo = 5; dgo <= 7; dgo++) {
    act("c_perm", dgo * 24 + 5, "file", "Recruitment responses filed.", 10);
    act("c_nair", dgo * 24 + 6, "read", "Publications and citation records read.", 35 + dgo * 5);
    act("c_ortiz", dgo * 24 + 2, "read", "Medical and financial records read.", 50 - dgo * 3);
  }

  d.prepare("INSERT INTO kv (firm_id, key, value) VALUES (?, 'demo_step', '0')").run(F);
}
