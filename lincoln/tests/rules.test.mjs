// Date rules: run with npm test. Pure code, no model.
import { dateRules, longDate } from "../src/lib/rules.ts";
import assert from "node:assert";
const t = "2026-11-14";
const r = (d) => dateRules(d, t);
assert.equal(longDate("2027-03-02"), "2 March 2027");
// passport before period end
let x = r([{ kind: "passport_expires", date: "2027-03-02", source: "Passport, p. 5" }, { kind: "period_ends", date: "2029-12-31", source: "Agreement, p. 7" }]);
assert.equal(x.length, 1); assert.equal(x[0].rule, "passport_before_period"); assert.deepEqual(x[0].pages, [5, 7]);
// renewed passport replaces old
x = r([{ kind: "passport_expires", date: "2025-01-01", source: "p. 3" }, { kind: "passport_expires", date: "2033-01-01", source: "p. 4" }, { kind: "period_ends", date: "2029-12-31", source: null }]);
assert.equal(x.length, 0);
// expired passport
x = r([{ kind: "passport_expires", date: "2026-11-01", source: "p. 2" }]);
assert.equal(x[0].rule, "passport_expired"); assert.equal(x[0].severity, "high");
// stay ended 1 day ago
x = r([{ kind: "stay_ends", date: "2026-11-13", source: "I-94, page 6" }]);
assert.equal(x[0].rule, "stay_ended"); assert.match(x[0].title, /1 day ago/); assert.match(x[0].detail, /14 November 2026: 1 day/); assert.deepEqual(x[0].pages, [6]);
// stay ended 200 days ago
x = r([{ kind: "stay_ends", date: "2026-04-28", source: null }]); assert.match(x[0].title, /200 days/);
// stay ends today, in 20 days, in 60 days, in 120 days
assert.match(r([{ kind: "stay_ends", date: t, source: null }])[0].title, /ends today/);
x = r([{ kind: "stay_ends", date: "2026-12-04", source: null }]); assert.equal(x[0].severity, "high"); assert.match(x[0].title, /20 days/);
x = r([{ kind: "stay_ends", date: "2027-01-13", source: null }]); assert.equal(x[0].severity, "medium");
assert.equal(r([{ kind: "stay_ends", date: "2027-03-14", source: null }]).length, 0);
// H-1B: first start 2021-02-01 -> limit 2027-02-01 within a year
x = r([{ kind: "h1b_first_start", date: "2023-01-01", source: null }, { kind: "h1b_first_start", date: "2021-02-01", source: "p. 9" }]);
assert.equal(x[0].rule, "h1b_six_years"); assert.match(x[0].title, /1 February 2027/);
// H-1B far off, period ends before limit: nothing
assert.equal(r([{ kind: "h1b_first_start", date: "2025-01-01", source: null }, { kind: "period_ends", date: "2028-01-01", source: null }]).length, 0);
// period past limit
assert.equal(r([{ kind: "h1b_first_start", date: "2025-01-01", source: null }, { kind: "period_ends", date: "2031-06-01", source: null }])[0].rule, "h1b_six_years");
// bad dates ignored
assert.equal(r([{ kind: "stay_ends", date: "2026-13-45", source: null }, { kind: "passport_expires", date: "soon", source: null }]).length, 0);
console.log("all rule tests passed");
