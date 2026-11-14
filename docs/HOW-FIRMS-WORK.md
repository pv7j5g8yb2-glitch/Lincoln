# How US immigration firms work, and where Lincoln stands (2026-11-14)

From general knowledge of US immigration practice. Written for Ismael and for Lincoln itself (a short
version is built into Lincoln's prompts in `lincoln/src/lib/process.ts`). An immigration lawyer should
check it before it is quoted to buyers or investors. Fees, forms and processing times change often.

## Who does the work

* **Attorneys** give legal advice, decide strategy, sign the G-28 (the form that says they represent
  the client), sign letters and briefs, and appear in immigration court. Only they may do these.
* **Paralegals and case managers** do most of the hours: questionnaires, chasing documents, filling
  forms, building the exhibit packet, drafting first versions, tracking dates, filing.
* **Intake or front desk** handles consultations booking, engagement letters and payment.
* Most firms are small (one to ten lawyers). A few large firms (Fragomen, BAL and others) serve big
  employers. Firms usually run a case management system (Docketwise, INSZoom, LawLogix, eImmigration,
  Clio and others) plus email, Word and a shared drive.
* Most benefit work (petitions and applications) is billed as a **flat fee per case**; court work is
  often hourly or staged. Government filing fees are paid on top, by the client or employer.

## The life of a matter, step by step

Every case, of any type, runs through the same shape. What changes is the forms, the evidence and the
agency.

1. **Consultation.** The person or employer explains the situation; the attorney checks eligibility,
   bars and options, and quotes a fee.
2. **Engagement.** Engagement letter signed, fee paid, G-28 prepared. For employment cases the client is
   the employer, and the worker is the beneficiary.
3. **Intake.** A questionnaire and a document checklist go to the client: passports, I-94, status
   history, civil documents, CVs, degrees, employer documents, translations.
4. **Evidence and strategy.** The team reads everything, spots problems (gaps in status, prior denials,
   conflicting dates or names, missing translations), and the attorney decides what to claim and how.
5. **Preparation.** Forms filled in (from the questionnaire and documents), letters drafted (support or
   petition letter, declarations, cover letter), expert or reference letters requested and edited,
   exhibits put in order with an index and tabs. For some cases a Labor Department step comes first
   (an LCA for H-1B, prevailing wage and recruitment for PERM).
6. **Review and signatures.** The attorney reviews the packet. The client and the attorney sign the
   forms (by hand or a permitted electronic copy of a handwritten signature).
7. **Filing.** By post to a USCIS lockbox or service centre, or online through the attorney's USCIS
   account for the forms that allow it. Labor filings go through the DOL FLAG system, consular cases
   through the State Department's systems, court filings through EOIR's e-filing system (ECAS).
8. **After filing.** A receipt notice arrives (I-797C). Then a biometrics appointment, sometimes a
   Request for Evidence (RFE) or a Notice of Intent to Deny (NOID) with a fixed deadline, sometimes an
   interview. The firm tracks status and answers each notice.
9. **Decision.** Approval notice, or denial (then a motion, an AAO appeal, a new filing or federal court).
10. **After approval.** Visa stamping at a consulate if needed, entry, checking the new I-94, then the
    next step: extensions, a change of employer, the green card, later citizenship. Many clients come
    back for years.

## The main tracks

* **Work visas (H-1B, L-1, O-1, E, TN and others).** Employer is the client. H-1B starts with the March
  lottery registration and an LCA. Petition on I-129, then consular stamping or a change of status.
* **Employment green cards.** Usually PERM first (prevailing wage, recruitment, ETA-9089), then the
  I-140, then the I-485 in the US or consular processing abroad when the priority date is current in the
  monthly Visa Bulletin. Self petitions (EB-1A, EB-2 NIW) skip PERM.
* **Family green cards.** I-130, then the I-485 in the US (often filed together for spouses of
  citizens) or consular processing through the National Visa Center and an embassy interview. Marriage
  green cards under two years old are conditional; the I-751 removes the conditions.
* **Citizenship.** N-400, biometrics, interview with the civics and English test, oath ceremony.
* **Humanitarian.** Asylum (I-589, generally within a year of arrival; an asylum office interview or, in
  court, a hearing), U and T visas, VAWA, SIJS, TPS, DACA, parole. Often sensitive and slower.
* **Immigration court.** Starts with a Notice to Appear. Master calendar hearings, then an individual
  (merits) hearing before a judge. Defenses include asylum, cancellation of removal and adjustment.
  Appeal to the Board of Immigration Appeals within 30 days, then a petition for review in a federal
  court of appeals within 30 days.
* **Employer compliance.** I-9 audits, public access files, site visits, policy work for global
  mobility teams. Ongoing, not case by case.

## Where Lincoln stands at each step (honest, 2026-11-14)

| Step | Lincoln today |
|---|---|
| Work arriving | Reads the firm's mail, opens or matches the case, files it. Works. |
| Intake | Asks the client for missing documents by email (for approval) and chases once after 3 days. No questionnaire. |
| Reading and checking | Reads every page, lists documents, conflicts, missing items, dates, bars; dates counted in code. Works on the stand in model; real accuracy untested. |
| Strategy | Grades evidence against the requirements and flags weak points. Decisions stay with the attorney. Works in the sample case only as a structured set of decisions. |
| Drafting | Any letter or memo from the file, every fact cited to its page and checked against it. Quality on real Opus untested. |
| Forms | Fills each official fillable USCIS PDF from the file, every answer with its source, blanks left for the attorney, editable; download is the real form. Needs the blank forms added once to `lincoln/forms` (USCIS blocks automated downloads). |
| Exhibit packet | One PDF: cover letter, filled forms, letters, exhibit index, each exhibit behind a tab page. Final review item lists what is in it and what needs the attorney before filing. |
| Signatures | Not done, by law. Sending forms for e-signature (DocuSign) is planned. |
| Filing | Not done: no USCIS filing API, and the attorney must submit. Lincoln can take it to the last click. |
| After filing | Reads notices that arrive by mail: records the receipt number, sets printed deadlines, moves the stage on approval or denial. No USCIS status tracking yet. |
| RFE and NOID | Reads the notice, sets the printed deadline, lists each point and drafts the full response for review. |
| Court | Drafting support only. No EOIR filing formats. |
| Billing | Not built. |

## What "start to finish" needs, in order of value

1. **Forms filled from the file** (every major USCIS form, with each answer traced to its source).
2. **The filing packet** assembled as one PDF: cover letter, forms, exhibits in order, index and tabs.
3. **The final review page**: one screen per case showing what Lincoln did, what it checked, and only
   the few points that need the attorney's judgement, every fact one click from its page. This is what
   makes review a spot check instead of a re-check. Attorneys stay legally responsible, so a review
   always happens; the goal is minutes, not hours.
4. **E-signature** for clients and attorneys.
5. **Receipt and status tracking** (the USCIS developer API covers case status, if access is granted).
6. **RFE and NOID responses** built from the notice, the file and the original petition.
7. **A real accuracy test**: made up cases across the main tracks, run on live Opus, graded by an
   immigration lawyer. Until this is done no one can honestly say Lincoln is accurate.
