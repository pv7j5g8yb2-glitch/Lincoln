# Grades: real USCIS appeal cases, 2026-11-22

Model: Sonnet 5.5 for reading and drafting, Haiku 5.5 for light steps. Forms off. Graded against each `key.md` (USCIS's
own findings): one point per required finding, half a point where Lincoln got the substance but hedged or missed part.
Cost: $1.25 for the ten cases, then $0.14 to recheck two drafts after the fixes. Total $1.39.

## Before the fixes (results/sonnet/)

| Case | Score | Bad failures | Mistakes |
|---|---|---|---|
| 01 EB-1A producer | 3.5 / 4 | none | Called judging "the only criterion with a plausible basis" and left the allied field point for the attorney to weigh, when it decides the criterion. Did not say producing broadcasts is not a contribution of major significance. |
| 02 O-1A export director | 3 / 3 | none | None on the law. Noise: "[Attorney: not shown on p. 1.]" stuck after its own conclusions. |
| 03 NIW AI researcher | 4 / 5 | none | Did not say the letters describe past work and so cannot show the endeavour's national importance. Analysed every prong instead of saying prong one fails and the rest are not reached. |
| 04 H-1B nursing assistant | 5.5 / 6 | none | No mention of USCIS's nursing policy (only advanced practice nurses generally qualify; a nursing assistant is below a registered nurse). |
| 05 EB-1C wallcoverings | 4.5 / 5 | none | Advised rewriting the duties letter without warning that a later description that materially changes the duties is itself a problem. (Two key points, no project manager and staff departures, are not in the case file, so not graded.) |
| 06 I-601 fraud, Bahamas | 2.5 / 4 | none | Would not say hardship is met in both scenarios on a strong record; called prospects "cannot be rated". Said discretion is separate but did not weigh the fraud against the equities. |
| 07 I-601 criminal, Ghana | 3.5 / 5 | none | Reasoned "undocumented" rather than "not beyond the usual consequences of separation". Missed that failing separation fails the requirement whatever happens on relocation. The citation check stamped three correct legal statements "p. 1 says otherwise". |
| 08 U visa robbery | 4 / 5 | none | Counted the son's U approval as support for the father's case; another person's approval does not bind USCIS. Otherwise strong: all three inconsistencies and the certifying official point found. |
| 09 VAWA marriage | 1.5 / 3 | none | Called the marriage "unresolved" and asked for certainty, when the sworn petition and the support judgment show it subsists by a preponderance. |
| 10 T visa hotel worker | 2.5 / 5 | none | Did not name the two step test for someone who left and came back (8 CFR 214.11(g)(2) and (g)(1)); treated presence years after the escape as the central weakness instead of applying (g)(1)(iv); hedged on whether she is a trafficking victim. |
| **Total** | **34.5 / 45 (77%)** | **none in any case** | |

Across the set: Lincoln never called a losing case approvable and never made a key's listed bad failure. Its weakness is
the opposite: on cases USCIS remanded in the applicant's favour (06, 09, 10) it would not commit, because it treated a
summary of the evidence as no evidence. A second, mechanical problem: the citation check marked analysis and "the file
does not show" sentences as unsupported or contradicted (six false notes in case 07 alone), which makes correct work
look wrong to the attorney.

## Fixes (lincoln/src/lib/intake.ts)

1. Drafts put a page reference only on sentences that state a fact from the file, not on analysis, conclusions,
   statements of law or statements that something is missing.
2. The citation check marks analysis and "not in the file" statements as supported, and uses "contradicted" only when
   the page states a different fact.
3. Assessments (requests that ask for eligibility, an assessment, prospects or merits) get reasoning rules: weigh
   evidence as described and give a finding per requirement; apply the preponderance standard (Matter of Chawathe);
   when a requirement fails, say which later steps are not reached; another person's or another classification's
   approval never counts as support; hardship must exceed the usual consequences, both scenarios when the relative's
   intent is not stated, and discretion is a separate weighing; apply the specific regulatory test for the facts.

## After the fixes (results/sonnet-recheck/, drafting step only)

| Case | Before | After | False citation notes |
|---|---|---|---|
| 07 I-601 criminal, Ghana | 3.5 / 5 | 5 / 5 | 6 to 0 |
| 09 VAWA marriage | 1.5 / 3 | 3 / 3 | 1 to 0 |

Caution: these two were rechecked on the same cases the fixes were written from, so the gain is not independent
evidence. A full rerun of all ten (about $1.25) would show whether the other eight moved, and a new set of cases would
show whether the rules generalise.

## Full rerun after the fixes (results/sonnet-rerun/, 2026-11-26)

Same ten cases, same models and setup, whole pipeline (Lincoln opens the case from the email, reads it, then drafts the
assessment). Approved by Ismael; cost $1.36, plus $0.014 for a one case Haiku check first. Graded against the same keys
with the same half point rule.

| Case | Before | After | Mistakes left |
|---|---|---|---|
| 01 EB-1A producer | 3.5 / 4 | 3.5 / 4 | Judging still called "arguable" with the allied field point left open; the closing section says "criteria 2 and 3 are arguable" where it means judging and contributions (a slip in its own numbering). Now says producing broadcasts is not a contribution of major significance. |
| 02 O-1A export director | 3 / 3 | 3 / 3 | None. |
| 03 NIW AI researcher | 4 / 5 | 4.5 / 5 | Puts the letters under prong two but never says they cannot show national importance. Now says prong two and three are not reached. One "[Attorney: not shown on p. 1.]" note left after its own sentence. |
| 04 H-1B nursing assistant | 5.5 / 6 | 5.5 / 6 | Still no USCIS nursing policy. |
| 05 EB-1C wallcoverings | 4.5 / 5 | 4.5 / 5 | Still advises correcting the duties letter without warning that materially changed duties are themselves a problem. |
| 06 I-601 fraud, Bahamas | 2.5 / 4 | 3.5 / 4 | Now finds hardship likely met in both scenarios. Discretion is a separate step but the fraud is not named as a serious adverse factor to weigh. One false citation note ("a US citizen's husband" read as calling him a citizen). |
| 07 I-601 criminal, Ghana | 3.5 / 5 | 5 / 5 | None. False citation notes 6 to 0. |
| 08 U visa robbery | 4 / 5 | 5 / 5 | None. Now says the son's approval does not bind USCIS. |
| 09 VAWA marriage | 1.5 / 3 | 3 / 3 | None. Finds the marriage shown by a preponderance. |
| 10 T visa hotel worker | 2.5 / 5 | 3 / 5 | Now finds her a trafficking victim. Still no two step presence test by paragraph, treats the years after the escape as the weakness instead of finding presence on account of the ongoing harm and TVAP enrollment. |
| **Total** | **34.5 / 45 (77%)** | **40.5 / 45 (90%)** | **No bad failure in any case.** |

Caution: the fixes were written from these same ten cases, so this is not independent proof; a new set of cases is.

### Why four of the misses survived: the rulebooks never reached these cases

Every test case opened as "Consultation" (the email comes from a prospective client), and the rulebooks were chosen
by case type, so none of the ten got its own type's rulebook: the H-1B nursing trap, the EB-1C changed duties trap,
the NIW past work letters trap and the T visa presence test were written but never given. Fixed 2026-11-26 in
`rulebooksFor` (src/lib/rulebooks.ts): case types named in the case's own summary, issues and request ("H-1B",
"EB-2 NIW", "I-918", or by name: VAWA, national interest waiver, U visa, T visa) now bring their rulebooks, in the
order they appear. Tested in tests/rulebooks.test.mjs. Not yet measured on the model: a third run (about $1.40) would show it.
