import fs from "node:fs";
import { apiUser, viewer } from "@/lib/session";
import { caseById } from "@/lib/queries";
import { db } from "@/lib/db";
import { fillPdf, hasTemplate, templatePath } from "@/lib/forms";
import { recordAccess } from "@/lib/access";

// A filled form as its official PDF, built from the blank form and the case's answers at download time.
export async function GET(req: Request) {
  const s = await apiUser();
  if (!s) return new Response("Sign in first", { status: 401 });
  const id = new URL(req.url).searchParams.get("id") ?? "";
  const f = db().prepare("SELECT case_id, code, answers FROM forms WHERE firm_id = ? AND id = ?").get(s.firm.id, id) as { case_id: string; code: string; answers: string } | undefined;
  const c = f ? caseById(s.firm.id, f.case_id, viewer(s.user)) : undefined;
  if (!f || !c || !hasTemplate(f.code)) return new Response("Not found", { status: 404 });
  const pdf = await fillPdf(new Uint8Array(fs.readFileSync(templatePath(f.code))), JSON.parse(f.answers));
  await recordAccess(s.firm.id, s.user.id, "exported", c.id, `Form ${f.code} for ${c.client}`);
  const name = `${f.code} ${c.client}.pdf`.replace(/[^\w .-]/g, "");
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${name}"`, "Cache-Control": "private, no-store" } });
}
