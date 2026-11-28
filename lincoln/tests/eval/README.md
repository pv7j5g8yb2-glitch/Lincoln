# Accuracy record

`run.mts` sends every case in `tests/adversarial` and `tests/case-types` to Lincoln as a client email with its
file, waits until Lincoln has finished all the work it starts on its own, and grades what it wrote against
`checks.json` (the answer keys in machine form). A dated scorecard goes to `results/`.

* Required findings: what a careful immigration attorney must see in that file.
* Bad failures: what must never happen (a bar missed, a false email, anything sent or decided without an attorney).

Run from `lincoln/` (live runs spend Anthropic credits and need Ismael's approval first):

    node --import ./tests/eval/register.mjs tests/eval/run.mts --label sonnet --parallel 3

`--only a1-injection,02-spouse-i130` runs some cases; `--minutes 25` caps each case.
