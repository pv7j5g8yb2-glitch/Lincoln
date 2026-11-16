import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { limited } from "@/lib/auth";
import { importSheet, importZip, isSheet, isZip } from "@/lib/import";
import { llmConfigured } from "@/lib/llm";
import { apiUser } from "@/lib/session";

// Moving from other case software: a case list (CSV or Excel) or a zip of client folders, sent as the request body.
const MAX = 150 * 1024 * 1024;

export async function POST(req: Request) {
  const s = await apiUser();
  if (!s) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (s.firm.demo) return NextResponse.json({ error: "Not in the sample workspace" }, { status: 400 });
  if (!llmConfigured()) return NextResponse.json({ error: "Model not connected" }, { status: 503 });
  if (limited(`import:${s.user.id}`, 10, 60 * 60_000)) return NextResponse.json({ error: "Too many imports. Try later." }, { status: 429 });
  const name = (new URL(req.url).searchParams.get("name") ?? "").slice(0, 200);
  if (Number(req.headers.get("content-length") ?? 0) > MAX) return NextResponse.json({ error: "150 MB max per file" }, { status: 413 });
  const data = new Uint8Array(await req.arrayBuffer());
  if (!data.length || data.length > MAX) return NextResponse.json({ error: "150 MB max per file" }, { status: 413 });
  const member = { id: s.user.id, name: s.user.name };
  try {
    if (isSheet(name)) { const r = await importSheet(s.firm.id, member, name, data); revalidatePath("/", "layout"); return NextResponse.json(r); }
    if (isZip(name, data)) { const r = await importZip(s.firm.id, member, data); revalidatePath("/", "layout"); return NextResponse.json(r); }
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error && /client column/.test(e.message) ? "No client names found" : "Not imported" }, { status: 400 });
  }
  return NextResponse.json({ error: "CSV, Excel or zip only" }, { status: 400 });
}
