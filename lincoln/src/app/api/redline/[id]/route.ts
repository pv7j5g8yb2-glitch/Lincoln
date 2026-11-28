import { recordAccess } from "@/lib/access";
import { caseById } from "@/lib/queries";
import { redlineFile } from "@/lib/redline";
import { apiUser, viewer } from "@/lib/session";

// A marked up Word document, with Lincoln's tracked changes and comments, for the attorney to open in Word.
export async function GET(_: Request, { params }: { params: Promise<{ id: string }> }) {
  const s = await apiUser();
  if (!s) return new Response("Sign in first", { status: 401 });
  const f = redlineFile(s.firm.id, (await params).id);
  if (!f || !caseById(s.firm.id, f.caseId, viewer(s.user))) return new Response("Not found", { status: 404 });
  await recordAccess(s.firm.id, s.user.id, "exported", f.caseId, `${f.name} (downloaded)`);
  const file = f.name.normalize("NFKD").replace(/[^\w\s().-]/g, "").trim() || "Marked up.docx";
  return new Response(new Uint8Array(f.data), { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "Content-Disposition": `attachment; filename="${file}"`, "Cache-Control": "no-store" } });
}
