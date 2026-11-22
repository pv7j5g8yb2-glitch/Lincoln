# Real case test set (USCIS AAO appeal decisions)

Ten real, public, redacted decisions of the USCIS Administrative Appeals Office (PDFs and text in `pdf/`). Each case
folder in `cases/` has `case.md` (the facts and evidence as described in the decision, written as a firm would receive
them, with no outcome or reasoning) and `key.md` (what USCIS actually found, as required findings and bad failures).

Lincoln gets `case.md` only. Its assessment is graded against `key.md`. The answer key is USCIS's own decision, not
ours. Limits: the decisions describe the evidence but do not include the documents, so this tests legal judgement, not
reading messy files (the made up cases in tests/adversarial and tests/case-types cover that). Most are refusals,
because approvals are rarely appealed. Running Lincoln on these spends credits and needs Ismael's approval first.

| Folder | Case type | Decision | Outcome |
|---|---|---|---|
| 01-eb1a-producer | EB-1A extraordinary ability | AAO 21 Oct 2026 | dismissed |
| 02-eb1a-jiujitsu | EB-1A, final merits | AAO 15 Apr 2024 | dismissed |
| 03-niw-ai-researcher | EB-2 national interest waiver | AAO 12 Dec 2024 | dismissed |
| 04-h1b-nursing-assistant | H-1B specialty occupation | AAO 25 Sep 2026 | dismissed |
| 05-eb1c-wallcoverings | EB-1C multinational manager | AAO 23 Apr 2024 | dismissed |
| 06-waiver-fraud-bahamas | I-601, 212(i) | AAO 14 Oct 2026 | remanded, hardship met |
| 07-waiver-criminal-ghana | I-601, 212(h) and 212(i) | AAO 6 Oct 2026 | dismissed |
| 08-u-visa-robbery | U visa, substantial abuse | AAO 13 Feb 2017 | dismissed |
| 09-vawa-marriage-status | VAWA I-360 | AAO 13 Feb 2025 | remanded, marriage shown |
| 10-t-visa-hotel-worker | T visa, physical presence | AAO 16 Dec 2022 | remanded, presence shown |
