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
