// Lincoln's writing: run with npm test. "&" never stands for "and"; names and citations stay exactly as written.
import assert from "node:assert";
import { formal, LEGAL_STYLE, EMAIL_STYLE } from "../src/lib/style.ts";
import { OFFICIAL_CODES } from "../src/lib/codes.ts";

assert.equal(formal("Her publications & citations show acclaim."), "Her publications and citations show acclaim.");
assert.equal(formal("judging & review of others' work"), "judging and review of others' work");
assert.equal(formal("Awards (2019 & 2021) and patents"), "Awards (2019 and 2021) and patents");
assert.equal(formal("She worked at Johnson & Johnson and Procter & Gamble."), "She worked at Johnson & Johnson and Procter & Gamble.");
assert.equal(formal("Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016); AT&T; R&D budget"), "Matter of Dhanasar, 26 I&N Dec. 884 (AAO 2016); AT&T; R&D budget");
assert.equal(formal("Fragomen, Del Rey, Bernsen & Loewy LLP"), "Fragomen, Del Rey, Bernsen & Loewy LLP");
assert.ok(LEGAL_STYLE.includes('reproduced exactly as its source writes it') && LEGAL_STYLE.includes('own sentences write "and"'));
assert.ok(EMAIL_STYLE.includes('rather than "&"'));
// Quoted and official text stays exactly as its source writes it.
assert.equal(formal('The class is "Temporary Visitor for Business & Pleasure" & the petition follows.'), 'The class is "Temporary Visitor for Business & Pleasure" and the petition follows.');
assert.equal(formal("The regulation reads \u201cmaterial in professional publications & other major media\u201d."), "The regulation reads \u201cmaterial in professional publications & other major media\u201d.");
// The official code table is kept as the State Department publishes it.
assert.ok(JSON.stringify(OFFICIAL_CODES).includes("Temporary Visitor for Business & Pleasure"));
console.log("all writing style tests passed");
