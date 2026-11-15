# Model comparison on a long O-1A case (2026-11-15)

Case: `lincoln/tests/long-case` (56 made up pages in 5 PDFs, identity pages scanned, 22 planted problems,
answer key in KEY.md). Run on the live app, each firm on one model for every step. Total spent: about $6.89.

## Outcome

* **Sonnet 5.5: full case, $1.37** (forms refilled after fixes: +$0.42). Caught about 20.5 of 22 planted problems,
  flagged the misfiled passport, the duplicate and the template, wrote a careful support letter with few citation
  slips, a human client email, and answered the change of status question correctly. Two form errors in the first
  fill (ticked change of status; ticked the "No" box for a valid passport); after the new form rules the refill
  had none.
* **Haiku 5.5: full case, $0.135** (on the fixed version). Caught about 18.5 of 22, plus two real extras (an
  impossible date in the visa control number, a change of status versus consular history conflict); three or four
  false alarms. Client email as good as Sonnet's. Weak at drafting: asked for a support letter, wrote a package
  worksheet; the citation check flagged about a dozen claims not on the cited page. Serious action error: read the
  old 2023 H-1B approval as this case's approval, and Lincoln moved the case to Approved (now guarded). One form
  question with Yes and No both ticked (now guarded).
* **Opus 5.5: no complete run.** Three readings were lost to a Lincoln bug ($4.80): the model's thinking counts
  towards the length limit, and Opus thought long enough that each answer was cut off. Sonnet thinks less and got
  through. Reading the same 56 pages cost Opus $1.26 against Sonnet's $0.47 (2.7 times).

## Cost by step (56 pages)

| Step | Sonnet | Haiku |
|---|---|---|
| Opening the case from the instruction | $0.010 | $0.001 |
| Reading the file (5 batches and a merge) | $0.471 | $0.041 |
| Second check | $0.083 | $0.006 |
| Forms (G-28, I-129, I-907) | $0.42 | $0.030 |
| Support letter | $0.159 | $0.016 |
| Citation check | $0.109 | $0.035 |
| Chat (two questions) | $0.121 | $0.007 |
| **Total** | **$1.37** | **$0.135** |

## Lincoln bugs found and fixed (all pushed)

1. Reading, drafting and form calls now have room for the model's thinking; a cut off answer is reported as such.
2. Model JSON is repaired (quotes inside text, page ranges, missing commas) and a failed reading is retried once.
3. Old notices in a client's file never change the case (stage, receipt, deadlines).
4. Forms: phone numbers kept, receipt numbers keep their letters, empty answers dropped, Yes and No both ticked
   keeps neither, a "Check No." box is ticked only to mean no, eligibility answers follow the record, not a request.
5. Emails go through draft_email, not the cited document drafter (no page numbers in client emails).
6. Security: the profile title can no longer grant or remove admin rights.

## Step by step choice (pending the Opus run)

| Step | Model | Why |
|---|---|---|
| Sorting mail, reading instructions, choosing form sections | Haiku | Right every time, about a tenth of a cent |
| Reading the file | Sonnet | Fewer false alarms; Haiku misread an old notice. Next test: Haiku batches with a Sonnet merge |
| Second check, letters, citation checks, chat, client emails | Sonnet | Haiku miscites and writes the wrong document |
| Forms | Sonnet, through the half price batch | No wrong answers after the new rules; Haiku is a candidate after more cases |
| Opus | Not yet | Only worth 2.7 times the price if it catches what Sonnet missed (the J-1 years in Tunis, unsupported letter claims) |
