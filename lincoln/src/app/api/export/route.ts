import { NextResponse } from "next/server";
import { db, uid } from "@/lib/db";
import { connection, isProvider, upload, type OfficeKind } from "@/lib/integrations";
import { OFFICE_EXT, OFFICE_MIME } from "@/lib/integrations/types";
import { caseDeck, caseXlsx, casesXlsx, draftDocx } from "@/lib/office";
import { caseById, draftById } from "@/lib/queries";
import { apiUser, viewer } from "@/lib/session";
import { recordAccess } from "@/lib/access";

// One route for every export: a draft as a document, the case list or a case index as a
// spreadsheet, a case summary as a presentation. "to" is download, google or microsoft.
export async function GET(req: Request) {
  const s = await apiUser();
  if (!s) return new Response("Sign in first", { status: 401 });
  const q = new URL(req.url).searchParams;
  const what = q.get("what") ?? "", id = q.get("id") ?? "", to = q.get("to") ?? "download";
  const F = s.firm.id;
  const V = viewer(s.user);
  let kind: OfficeKind, name: string, data: Buffer, caseId: string | null = null;
  if (what === "draft") {
    const dr = draftById(F, id);
    if (!dr || dr.status === "drafting" || dr.status === "failed") return new Response("Not found", { status: 404 });
    const c = caseById(F, dr.case_id, V);
    kind = "document"; name = `${c?.client ?? "Case"} ${dr.title} v${dr.version}`; data = await draftDocx(dr); caseId = dr.case_id;
  } else if (what === "cases") {
    kind = "spreadsheet"; name = `${s.firm.name} cases ${new Date().toISOString().slice(0, 10)}`; data = await casesXlsx(F);
  } else if (what === "case" || what === "deck") {
    const c = caseById(F, id, V);
    if (!c) return new Response("Not found", { status: 404 });
    caseId = c.id;
    if (what === "case") { kind = "spreadsheet"; name = `${c.client} exhibit index`; data = await caseXlsx(F, c.id); }
    else { kind = "presentation"; name = `${c.client} case summary`; data = await caseDeck(F, c.id); }
  } else return new Response("Unknown export", { status: 400 });

  await recordAccess(F, s.user.id, "exported", caseId ?? what, `${name} (${to === "download" ? "downloaded" : `sent to ${to}`})`);
  if (to === "download") {
    const file = `${name.normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/\s+/g, "_").slice(0, 100) || "Lincoln"}.${OFFICE_EXT[kind]}`;
    return new Response(new Uint8Array(data), { headers: { "Content-Type": OFFICE_MIME[kind], "Content-Disposition": `attachment; filename="${file}"` } });
  }
  if (!isProvider(to)) return new Response("Unknown destination", { status: 400 });
  // Writes to a connected account only when the request comes from Lincoln's own pages.
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin" && site !== "none") return new Response("Forbidden", { status: 403 });
  const conn = connection(F, s.user.id, to);
  if (!conn) return NextResponse.redirect(new URL("/integrations", req.url));
  try {
    const link = await upload(conn, name, kind, data);
    const app = to === "google" ? { document: "Google Docs", spreadsheet: "Google Sheets", presentation: "Google Slides" }[kind] : { document: "Word", spreadsheet: "Excel", presentation: "PowerPoint" }[kind];
    db().prepare("INSERT INTO activity (id, firm_id, case_id, at, actor, kind, text, minutes) VALUES (?, ?, ?, ?, 'Lincoln', 'file', ?, 2)").run(uid(), F, caseId, new Date().toISOString(), `Saved "${name}" to ${app}.`);
    return NextResponse.redirect(link);
  } catch (e) {
    return new Response(`The file could not be saved: ${e instanceof Error ? e.message : "error"}`, { status: 502 });
  }
}
