import JSZip from "jszip";
import { db } from "@/lib/db";
import { apiUser, isAdmin } from "@/lib/session";
import { verifyPassword, limited } from "@/lib/auth";
import { loadPage } from "@/lib/storage";
import { recordAccess } from "@/lib/access";
import { securityEvent } from "@/lib/audit";

// Everything the firm has in Lincoln, in one file: every record as JSON and every client page as an
// image. Administrators only, with their password, from Lincoln's own pages. Secrets never leave:
// password hashes, two step secrets, recovery codes, mailbox tokens and the firm's key are left out.
const OMIT: Record<string, string[]> = {
  users: ["password_hash", "totp_enc", "totp_pending_enc", "totp_last_step", "recovery"],
  mailboxes: ["refresh_enc", "access_enc", "token_enc", "settings", "inbound_token_hash"],
  firms: ["key_enc"],
};
const TABLES = ["firms", "users", "cases", "documents", "criteria", "issues", "dates", "drafts", "messages", "approvals", "activity", "chat", "mailboxes", "security_events", "access_log", "usage"];

export async function POST(req: Request) {
  const s = await apiUser();
  if (!s) return new Response("Sign in first", { status: 401 });
  if (req.headers.get("sec-fetch-site") && req.headers.get("sec-fetch-site") !== "same-origin") return new Response("Refused", { status: 403 });
  if (s.firm.demo || !isAdmin(s.user.role)) return new Response("Administrators only", { status: 403 });
  const form = await req.formData();
  const d = db();
  const row = d.prepare("SELECT password_hash FROM users WHERE id = ?").get(s.user.id) as { password_hash: string | null };
  if (limited(`exp:${s.user.id}`, 5) || !verifyPassword(String(form.get("password") ?? ""), row.password_hash)) {
    return Response.redirect(new URL("/settings?tab=firm&error=export", req.url), 303);
  }
  const zip = new JSZip();
  for (const t of TABLES) {
    const cols = (d.prepare(`PRAGMA table_info(${t})`).all() as { name: string }[]).map((c) => c.name);
    if (!cols.length) continue;
    const keep = cols.filter((c) => !(OMIT[t] ?? []).includes(c));
    const rows = t === "firms" ? d.prepare(`SELECT ${keep.join(", ")} FROM firms WHERE id = ?`).all(s.firm.id) : d.prepare(`SELECT ${keep.join(", ")} FROM ${t} WHERE firm_id = ?`).all(s.firm.id);
    zip.file(`records/${t}.json`, JSON.stringify(rows, null, 2));
  }
  for (const c of d.prepare("SELECT id, client, pages FROM cases WHERE firm_id = ?").all(s.firm.id) as { id: string; client: string; pages: number }[]) {
    const folder = `${c.client.replace(/[^\w\s.-]/g, "").trim().slice(0, 60) || "Case"} (${c.id})`;
    for (let n = 1; n <= c.pages; n++) {
      const page = loadPage(s.firm.id, c.id, n);
      if (page) zip.file(`files/${folder}/page-${String(n).padStart(3, "0")}.jpg`, page);
    }
  }
  const data = await zip.generateAsync({ type: "uint8array", compression: "DEFLATE" });
  await recordAccess(s.firm.id, s.user.id, "firm_exported", s.firm.id, "Everything in the firm");
  await securityEvent(s.firm.id, s.user.id, "firm_exported");
  const name = `${s.firm.name.replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").slice(0, 60) || "Lincoln"}_export_${new Date().toISOString().slice(0, 10)}.zip`;
  return new Response(data as unknown as BodyInit, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${name}"`, "Cache-Control": "no-store" } });
}
