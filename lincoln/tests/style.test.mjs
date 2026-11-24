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
assert.ok(LEGAL_STYLE.includes('"&" never stands in for "and"') && LEGAL_STYLE.includes('§'));
assert.ok(EMAIL_STYLE.includes('rather than "&"'));
// The official names Lincoln shows and gives the model are written out in full.
assert.ok(!/ & /.test(JSON.stringify(OFFICIAL_CODES)), "an official name written with &");
console.log("all writing style tests passed");
