# Final round results, case 2 (2026-11-11)

Blind labels: X = plain Claude (Opus 5.5, thinking, Claude Docs, one self check), Y = Lincoln method
v0.2 (Opus 5.5, four passes), Z = plain ChatGPT (Thinking, one self check).

| Judge | X plain Claude | Y Lincoln | Z plain ChatGPT | Lincoln minus plain Claude |
|---|---|---|---|---|
| Claude (Opus 5.5) | 96.9 | 98.6 | 90.5 | +1.7 |
| ChatGPT (Thinking) | 85.5 | 94.5 | 99.0 | +9.0 |
| Average | 91.2 | 96.55 | 94.75 | +5.35 |

Pass bar set before the runs: Lincoln beats plain Claude by at least 5 points with BOTH judges.
Result: not met (the Claude judge gives +1.7). By the rule, Lincoln stops.

Judge reliability, checked against the outputs:
* Confirmed in X (plain Claude): cites the Hungarian award "with certified translation" when none exists;
  "is enclosed as required" for a consultation not obtained (with a bracketed note after it).
* Confirmed in Z (plain ChatGPT): the letter to USCIS says the petitioner "does not use the higher,
  uncorroborated figures", "recognizes that the record should be strengthened", and is "subject to the
  completion of the consultation"; a page header carried a fragment of the account holder's name (now
  removed from the repo copies).
* The ChatGPT judge scored its own company's output 99 and missed those letter problems, and deducted 5
  from Lincoln for a bracketed attorney note. The Claude judge's findings all checked out. Even taking
  only the Claude judge, the margin is +1.7.
* Lincoln's letter had no accuracy defects per the Claude judge; it ranked first or second with both
  judges and had the best average. The edge over plain Claude exists but is small.

Lesson: plain frontier models with thinking already produce expert level O-1 drafts from a messy file
(91 to 97 out of 100). A method on top adds a few points, not enough to justify a separate paid product.
