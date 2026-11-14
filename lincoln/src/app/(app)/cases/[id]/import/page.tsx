import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, Search } from "lucide-react";
import { Empty, PageHead, btn } from "@/components/ui";
import { importFromCloud } from "@/lib/actions";
import { connection, isProvider, searchFiles, type FileHit } from "@/lib/integrations";
import { caseById } from "@/lib/queries";
import { requireUser } from "@/lib/session";
import { ago } from "@/lib/format";

export default async function ImportPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ from?: string; q?: string; error?: string }> }) {
  const { user, firm, viewer } = await requireUser();
  const { id } = await params;
  const { from = "", q = "", error } = await searchParams;
  const c = caseById(firm.id, id, viewer);
  if (!c || !isProvider(from)) notFound();
  const conn = connection(firm.id, user.id, from);
  let hits: FileHit[] = [];
  let failed: string | null = null;
  if (conn) {
    try { hits = await searchFiles(conn, q.trim().slice(0, 100)); } catch (e) { failed = e instanceof Error ? e.message : "Search failed"; }
  }
  return (
    <div className="rise max-w-[720px]">
      <Link href={`/cases/${id}?tab=documents`} className="mb-5 inline-flex items-center gap-1 text-[12.5px] text-muted hover:text-ink"><ChevronLeft size={14} /> {c.client}</Link>
      <PageHead title={from === "google" ? "Import from Google Drive" : "Import from OneDrive and SharePoint"} />
      {!conn ? <Empty><Link href="/integrations" className="text-ink underline underline-offset-4">Connect {from === "google" ? "Google" : "Microsoft"}</Link></Empty> : (
        <>
          <form className="relative mb-5 max-w-[360px]">
            <input type="hidden" name="from" value={from} />
            <Search size={14} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-faint" />
            <input name="q" defaultValue={q} placeholder="Search PDFs" className="h-9 w-full rounded-lg border border-line bg-card pl-8 pr-3 text-[13px] outline-none focus:border-ink" />
          </form>
          {error && <p className="mb-4 text-[13px] text-risk">The file is not a PDF under 25 MB.</p>}
          {failed && <p className="mb-4 text-[13px] text-risk">{failed}</p>}
          {hits.length === 0 && !failed ? <Empty>No PDFs found</Empty> : (
            <ul className="border-t border-line">
              {hits.map((f) => (
                <li key={f.id} className="flex items-center gap-4 border-b border-line py-3">
                  <span className="min-w-0 flex-1"><span className="block truncate text-[13.5px]">{f.name}</span><span className="block text-[12px] text-faint">{f.where}{f.modified ? ` · ${ago(f.modified)}` : ""}</span></span>
                  <form action={importFromCloud.bind(null, id, from, f.id, f.name)}><button disabled={Boolean(c.processing)} className={btn.secondary}>Import</button></form>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
