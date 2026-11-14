// Renders the made up Halász client file to page images for the demo workspace.
// Output goes to data/pages (not in git, never served as a public file).
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const pdf = path.resolve("../demo/o1-halasz/case/Halasz_client_documents.pdf");
const out = path.resolve("data/pages/c_halasz");
fs.mkdirSync(out, { recursive: true });
execFileSync("pdftoppm", ["-jpeg", "-jpegopt", "quality=72", "-r", "82", pdf, path.join(out, "p")]);
console.log(fs.readdirSync(out).length, "pages rendered to", out);
