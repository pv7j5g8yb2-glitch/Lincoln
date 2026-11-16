import { NextResponse } from "next/server";
import { db, uid } from "@/lib/db";
import { limited } from "@/lib/auth";
import { clientIp } from "@/lib/audit";
import { recordAccess } from "@/lib/access";
import { checkDocument } from "@/lib/intake";
import { checkCite, citationMatches, searchLaw } from "@/lib/law";
import { llmConfigured } from "@/lib/llm";
import { packetPlan } from "@/lib/packet";
import { caseById, caseDrafts, cases, draftById } from "@/lib/queries";
import { viewer } from "@/lib/session";
import { draftBlocks, endWord, redeemWordCode, wordUser } from "@/lib/word";

// What the Word add-in reads and checks. Every call but "pair" carries the add-in's own token.

const no = (error: string, status: number) => NextResponse.json({ error }, { status });

export async function GET(req: Request) {
  const s = wordUser(req);
  if (!s) return no("Not connected", 401);
  const q = new URL(req.url).searchParams;
  const F = s.firm.id, V = viewer(s.user);
  const op = q.get("op");
  if (op === "me") return NextResponse.json({ name: s.user.name, firm: s.firm.name });
  if (op === "cases") return NextResponse.json(cases(F, V).map((c) => ({ id: c.id, client: c.client, type: c.type_code })));
  if (op === "drafts") {
    const c = caseById(F, q.get("case") ?? "", V);
    if (!c) return no("Not found", 404);
    return NextResponse.json(caseDrafts(F, c.id).filter((d) => d.status !== "drafting" && d.status !== "failed").map((d) => ({ id: d.id, title: d.title, status: d.status, version: d.version })));
  }
  if (op === "draft") {
    const d = draftById(F, q.get("id") ?? "");
    if (!d || !caseById(F, d.case_id, V) || d.status === "drafting" || d.status === "failed") return no("Not found", 404);
    await recordAccess(F, s.user.id, "exported", d.case_id, `${d.title} (inserted into Word)`);
    return NextResponse.json({ blocks: draftBlocks(d.title, d.content) });
  }
  if (op === "law") return NextResponse.json(searchLaw(q.get("q") ?? "", 12).map((h) => ({ cite: h.cite, alias: h.alias, heading: h.heading, snippet: h.snippet, text: h.text, url: h.url })));
  return no("Unknown request", 400);
}

export async function POST(req: Request) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { return no("Invalid request", 400); }
  if (body.op === "pair") {
    let ip = "";
    try { ip = await clientIp(); } catch { ip = ""; }
    if (limited(`word-pair:${ip}`, 10, 15 * 60_000)) return no("Too many tries. Wait a few minutes.", 429);
    const token = redeemWordCode(String(body.code ?? ""));
    return token ? NextResponse.json({ token }) : no("Code not valid", 400);
  }
  const s = wordUser(req);
  if (!s) return no("Not connected", 401);
  if (body.op === "disconnect") { endWord(s.user.id); return NextResponse.json({ ok: true }); }
  if (body.op === "saveDraft") {
    // The document as edited in Word becomes the draft's next version; headings start new sections.
    const dr = draftById(s.firm.id, String(body.draft ?? ""));
    if (!dr || !caseById(s.firm.id, dr.case_id, viewer(s.user))) return no("Not found", 404);
    const blocks = (Array.isArray(body.blocks) ? body.blocks : []).slice(0, 3000) as { heading?: boolean; title?: boolean; text?: string }[];
    const sections: { heading: string; paras: string[] }[] = [{ heading: "", paras: [] }];
    for (const b of blocks) {
      const text = String(b.text ?? "").trim();
      if (!text || b.title || text.toLowerCase() === dr.title.toLowerCase()) continue;
      if (b.heading) sections.push({ heading: text, paras: [] }); else sections[sections.length - 1].paras.push(text);
    }
    const { applyDraftEdit } = await import("@/lib/memory");
    if (!applyDraftEdit(s.firm.id, dr.id, sections.filter((x) => x.heading || x.paras.length), !s.firm.demo)) return no("Not saved", 400);
    db().prepare("INSERT INTO activity (id, firm_id, case_id, at, actor, kind, text, minutes) VALUES (?, ?, ?, ?, ?, 'draft', ?, 0)").run(uid(), s.firm.id, dr.case_id, new Date().toISOString(), s.user.name, `Saved ${dr.title} from Word as a new version.`);
    return NextResponse.json({ ok: true });
  }
  if (body.op === "check") {
    const c = caseById(s.firm.id, String(body.case ?? ""), viewer(s.user));
    if (!c) return no("Not found", 404);
    const paras = (Array.isArray(body.paras) ? body.paras : []).map(String).slice(0, 3000);
    if (paras.join("").length > 400_000) return no("Document too long", 400);
    if (limited(`word-check:${s.user.id}`, 20, 60 * 60_000)) return no("Too many checks. Try again later.", 429);
    const all = paras.join("\n");
    // Law: every INA and CFR citation against the current official text.
    const law = citationMatches(all).map((m) => ({ text: m.raw, cite: m.cite, state: checkCite(m.cite) })).filter((x) => x.state === "missing").map((x) => ({ text: x.text, problem: `${x.cite} is not in the current ${/CFR/i.test(x.cite) ? "CFR" : "INA"}` }));
    // Exhibits: every exhibit number against the case's exhibit index.
    const count = packetPlan(s.firm.id, c.id).exhibits.length;
    const exhibits: { text: string; problem: string }[] = [];
    for (const m of all.matchAll(/\bExhibits?\s+(\d{1,3})(?:\s*(?:-|–|to|through|and)\s*(\d{1,3}))?/gi)) {
      const hi = Math.max(Number(m[1]), Number(m[2] ?? 0));
      if (hi > count && !exhibits.some((e) => e.text === m[0])) exhibits.push({ text: m[0], problem: count ? `The exhibit index has ${count} ${count === 1 ? "exhibit" : "exhibits"}` : "The case has no exhibit index yet" });
    }
    // Facts: every sentence that cites a page of the client file, against that page.
    const pages = llmConfigured() && c.pages > 0 ? await checkDocument(s.firm.id, c.id, paras).catch(() => null) : null;
    return NextResponse.json({ law, exhibits, pages: pages ? { checked: pages.checked, problems: pages.problems.map((p) => ({ text: p.text, problem: p.problem.replace(/^p\. /, "Page ").replace(/^pp\. /, "Pages ").replace(/^not shown on pp\. /, "Not shown on pages ").replace(/^not shown on p\. /, "Not shown on page ") })) } : null });
  }
  return no("Unknown request", 400);
}
