import { apiUser, viewer } from "@/lib/session";
import { caseById } from "@/lib/queries";
import { loadPage } from "@/lib/storage";
import { recordAccess } from "@/lib/access";

// Client pages are never public files. They are decrypted only for a signed in member of the firm
// that owns the case, and only if that member may see the case.
export async function GET(_: Request, { params }: { params: Promise<{ caseId: string; n: string }> }) {
  const s = await apiUser();
  if (!s) return new Response("Sign in first", { status: 401 });
  const { caseId, n } = await params;
  const c = caseById(s.firm.id, caseId, viewer(s.user));
  const page = Number(n);
  if (!c || !Number.isInteger(page) || page < 1 || page > c.pages) return new Response("Not found", { status: 404 });
  const data = loadPage(s.firm.id, c.id, page);
  if (!data) return new Response("Not found", { status: 404 });
  await recordAccess(s.firm.id, s.user.id, "page_viewed", c.id, `Client pages of ${c.client}`);
  return new Response(new Uint8Array(data), { headers: { "Content-Type": "image/jpeg", "Cache-Control": "private, no-store" } });
}
