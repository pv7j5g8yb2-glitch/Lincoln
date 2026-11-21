// A long model reply with an unescaped quote or a raw line break is repaired, not thrown away.
import assert from "node:assert";
const { repairJson } = await import("../src/lib/json.ts");
const fix = (s) => JSON.parse(repairJson(s));
assert.deepStrictEqual(fix('{"a": "ok", "b": [1, 2]}'), { a: "ok", b: [1, 2] });
assert.deepStrictEqual(fix('{"note": "Boston Tech Review spells it "Amina" once", "n": 2}'), { note: 'Boston Tech Review spells it "Amina" once', n: 2 });
assert.deepStrictEqual(fix('{"title": "The "national" award", "pages": [20]}'), { title: 'The "national" award', pages: [20] });
assert.deepStrictEqual(fix('{"d": "line one\nline two"}'), { d: "line one\nline two" });
assert.deepStrictEqual(fix('{"x": [ {"t": "a"}, {"t": "b"}, ], "y": "z",}'), { x: [{ t: "a" }, { t: "b" }], y: "z" });
assert.deepStrictEqual(fix('{"q": "she said \\"yes\\" then"}'), { q: 'she said "yes" then' });
console.log("all json tests passed");
// Page ranges, page prefixes and missing commas, as long readings sometimes write them.
assert.deepStrictEqual(fix('{"issues": [{"title": "Weiss letter", "pages": [48-49]}]}'), { issues: [{ title: "Weiss letter", pages: [48, 49] }] });
assert.deepStrictEqual(fix('{"pages": [p. 12, pp. 14]}'), { pages: [12, 14] });
assert.deepStrictEqual(fix('{"a": [{"x": 1} {"x": 2}], "b": "c" "d": 4}'), { a: [{ x: 1 }, { x: 2 }], b: "c", d: 4 });
assert.deepStrictEqual(fix('{"pages": [10 11 12], "page_from": 3}'), { pages: [10, 11, 12], page_from: 3 });
assert.deepStrictEqual(fix('{"n": -2.5e3, "ok": true, "z": null}'), { n: -2500, ok: true, z: null });
assert.deepStrictEqual(fix('{"date": "2026-11-30", "detail": "pp. 48-49 conflict"}'), { date: "2026-11-30", detail: "pp. 48-49 conflict" });
// Valid JSON passes through unchanged in meaning.
const big = { documents: [{ title: 'He said "fine"', page_from: 1, page_to: 2 }], issues: [{ pages: [1, 2, 3], detail: "a, b; c: d" }] };
assert.deepStrictEqual(fix(JSON.stringify(big, null, 2)), big);
console.log("all json repair tests passed");
// The slip that broke the live comparison: a quoted phrase followed by a comma and more words.
assert.deepStrictEqual(fix('{"issues": [{"title": "Award", "detail": "HR calls it a "national innovation award", but it is internal", "pages": [20]}, {"title": "Next"}]}'),
  { issues: [{ title: "Award", detail: 'HR calls it a "national innovation award", but it is internal', pages: [20] }, { title: "Next" }] });
assert.deepStrictEqual(fix('{"a": ["one "two", three", "four"]}'), { a: ['one "two", three', "four"] });
console.log("all quote repair tests passed");
