import { apiUser, viewer } from "@/lib/session";
import { caseById } from "@/lib/queries";
import { buildPacket } from "@/lib/packet";
import { recordAccess } from "@/lib/access";

// The filing packet as one PDF, built at download time from the case as it stands.
export async function GET(req: Request) {
  const s = await apiUser();
  if (!s) return new Response("Sign in first", { status: 401 });
  const c = caseById(s.firm.id, new URL(req.url).searchParams.get("case") ?? "", viewer(s.user));
  if (!c) return new Response("Not found", { status: 404 });
  const pdf = await buildPacket(s.firm.id, c.id);
  await recordAccess(s.firm.id, s.user.id, "exported", c.id, `Filing packet for ${c.client}`);
  const name = `${c.type_code} ${c.client} packet.pdf`.replace(/[^\w .-]/g, "");
  return new Response(new Uint8Array(pdf), { headers: { "Content-Type": "application/pdf", "Content-Disposition": `inline; filename="${name}"`, "Cache-Control": "private, no-store" } });
}
