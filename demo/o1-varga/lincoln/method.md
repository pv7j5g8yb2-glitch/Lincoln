# Lincoln method for an O-1A packet (version 0.1, 2026-11-10)

This is Lincoln's harness written as four messages, so it can run in a plain Claude chat before
any code exists. It is written for any O-1A case, not for this test case. Message 1 carries the
case file. Send each message only after the previous reply has finished.

## Message 1: read and extract

You are preparing the evidence for an O-1A petition for a US immigration attorney, who will review
and sign everything. You do not give legal advice and you never invent facts.

Work in four passes over the next four messages. This message is pass 1: extraction only. Do not
argue eligibility yet.

For every exhibit in the case file below, produce a table of facts. One row per fact:
* fact (short, neutral wording)
* exact quote from the exhibit
* exhibit letter and page
* date of the document
* who is speaking, and whether they are independent of the beneficiary and the petitioner
  (independent, customer, employer or colleague, the beneficiary herself, unknown)
* type of source (government, peer reviewed journal, professional or major trade publication with
  stated circulation, general newspaper, internal company document, personal blog, other)

Then list every case where two exhibits give different figures or facts for the same thing (money,
headcounts, dates, counts of sites or users, titles). For each, say which document is later or more
authoritative and why. Then list every statement that is promotional or about other people rather
than about the beneficiary.

[paste the case file here]

## Message 2: assess the criteria

Pass 2: assess eligibility using only the facts table from pass 1.

The legal frame is 8 CFR 214.2(o)(3)(iii): a one time major internationally recognised award, or at
least three of the eight criteria below, followed by a final merits review of all the evidence
together (USCIS Policy Manual, Volume 2, Part M), asking whether the beneficiary has sustained
national or international acclaim and is among the small percentage at the very top of the field,
on a preponderance of the evidence.

For each criterion, apply its own standard strictly:
1. Prizes or awards: must be nationally or internationally recognised, for excellence in the field.
   Internal company, school or local awards do not qualify. Note the selection process and number
   of nominees if shown.
2. Membership: the association must require outstanding achievements of its members, judged by
   recognised national or international experts. Open membership, degree or experience thresholds,
   or paying dues do not qualify.
3. Published material: must be about the beneficiary and her work, in professional or major trade
   publications or major media, with title, date and author. Articles mainly about a company, or
   passing mentions, are weak. Blogs without editorial control do not qualify. Circulation or
   readership evidence matters.
4. Judging: judging the work of others in the same or an allied field, alone or on a panel. Peer
   review for a selective conference or journal is strong. Local or informal events are weak.
5. Original contributions of major significance: needs evidence of impact beyond the beneficiary's
   own employer: adoption by others, citations, independent expert letters with specifics, measured
   results. Pending patents alone do not show significance.
6. Scholarly articles: authorship in professional journals or major media. Peer review and the
   journal's standing matter.
7. Critical or essential role for organisations with a distinguished reputation: needs both the
   role and evidence of the organisation's distinguished reputation. Size alone does not show it.
8. High salary: needs the pay and reliable comparison data for the field and location. Pay figures
   without comparison data do not meet it.

For each criterion output: claim, do not claim, or claim only with more evidence. List the
supporting rows from the facts table, the main weakness, and a strength rating (strong, moderate,
weak). Weigh letters by independence: independent experts first, customers next, employer and
co-founders last.

Then check the required filing elements under 8 CFR 214.2(o)(2)(ii) and (o)(5): written advisory
opinion (consultation) from a peer group or labour organisation, copy of the contract or a summary
of the terms, explanation of the events or activities (itinerary), Form I-129 with the O and P
supplement, and identity documents. Mark each as present, missing or unclear.

## Message 3: draft

Pass 3: draft the documents, using only facts from the pass 1 table and the conclusions of pass 2.

1. The petition support letter from the petitioner to USCIS. Argue only the criteria marked
   "claim". Every sentence that states a fact must end with its citation, for example (Ex. C, p. 1).
   Where documents conflict, use the later or more authoritative figure and do not repeat the
   superseded one. Attribute each number to its source rather than merging different figures. Do
   not use promotional statements as facts. End with a final merits section that argues sustained
   acclaim from the evidence as a whole.
2. The criteria map from pass 2, as a table.
3. The exhibit index in filing order: forms and required documents first, then evidence grouped by
   criterion, then supporting material. Leave out exhibits that should not be filed, and say why.
4. Gaps and risks: every missing required element, every weak criterion, every conflict, and the
   action the attorney should take for each.

## Message 4: verify and finalise

Pass 4: check your own work as a strict reviewer who did not write it.

1. Go through the support letter sentence by sentence. For each factual sentence, confirm that the
   cited exhibit and page contain that fact. List every sentence that is unsupported, mis-cited,
   overstated or uses a superseded figure.
2. Check that no weak or excluded evidence is being used to claim a criterion.
3. Check that every missing required element appears in the gaps list.
4. Fix every problem you found, then output the final versions of all four documents, followed by a
   short list of the corrections you made in this pass.
