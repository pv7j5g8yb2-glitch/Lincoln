// Restores the database from one of Lincoln's own backups.
//   node --experimental-strip-types scripts/restore.mts            lists the backups
//   node --experimental-strip-types scripts/restore.mts <file>     checks that copy, then puts it in place
// Run it with the same DATA_DIR and LINCOLN_SECRET as the server (on Render: the service's Shell), then restart the
// service. The current database is kept beside it as lincoln.db.before-restore-<time>, so a restore can be undone.
import fs from "node:fs";
import path from "node:path";
import Database from "better-sqlite3-multiple-ciphers";
import { derivedKey } from "../src/lib/keys.ts";

const dir = process.env.DATA_DIR || path.join(process.cwd(), "data");
const backups = path.join(dir, "backups");
const pick = process.argv[2];

if (!pick) {
  const list = fs.existsSync(backups) ? fs.readdirSync(backups).filter((f) => f.endsWith(".db")).sort().reverse() : [];
  console.log(list.length ? list.join("\n") : "No backups yet.");
  process.exit(0);
}

const copy = path.isAbsolute(pick) ? pick : path.join(backups, pick);
let check: unknown, firms = 0;
try {
  const c = new Database(copy, { readonly: true, fileMustExist: true });
  c.pragma(`key='${derivedKey("database")}'`);
  check = c.pragma("quick_check", { simple: true });
  firms = (c.prepare("SELECT COUNT(*) AS n FROM firms").get() as { n: number }).n;
  c.close();
} catch (e) {
  console.error(`This copy cannot be opened with this server's key (${e instanceof Error ? e.message : e}). Check LINCOLN_SECRET. Nothing was changed.`);
  process.exit(1);
}
if (check !== "ok") { console.error(`This copy failed its check (${String(check)}). Nothing was changed.`); process.exit(1); }

const live = path.join(dir, "lincoln.db");
const kept = `${live}.before-restore-${new Date().toISOString().replace(/[:.]/g, "-")}`;
if (fs.existsSync(live)) fs.renameSync(live, kept);
for (const x of ["-wal", "-shm"]) fs.rmSync(live + x, { force: true });
fs.copyFileSync(copy, live);
console.log(`Restored ${path.basename(copy)} (${firms} firms). The previous database is at ${kept}. Restart the service now.`);
