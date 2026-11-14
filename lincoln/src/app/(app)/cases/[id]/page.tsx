import Link from "next/link";
import { notFound } from "next/navigation";
import clsx from "clsx";
import { Check, ChevronLeft, ChevronRight, Lock } from "lucide-react";
import DraftView from "@/components/DraftView";
import MessageList from "@/components/MessageList";
import FormReview from "@/components/FormReview";
import { formsFor } from "@/lib/forms";
import AskBox from "@/components/AskBox";
import Refresher from "@/components/Refresher";
import { Empty, btn, field } from "@/components/ui";
import { addFile, refillForms, requestDraft, resolveIssue } from "@/lib/actions";
import FileDrop from "@/components/FileDrop";
import ExportMenu from "@/components/ExportMenu";
import { exportItems } from "@/lib/exports";
import { connectionsOf } from "@/lib/integrations";
import { requireUser } from "@/lib/session";
import { caseActivity, caseApprovals, caseById, caseDates, caseDrafts, caseForms, caseMessages, criteria, documents, issues } from "@/lib/queries";
import { ago, inDays, longDate } from "@/lib/format";
import { llmConfigured, modelName } from "@/lib/llm";
import type { LetterContent } from "@/lib/letter";
import { recordAccess } from "@/lib/access";

const DOC_STATUS: Record<string, string> = { ok: "Usable", weak: "Low weight", excluded: "Excluded", draft: "Unsigned draft", duplicate: "Duplicate", superseded: "Superseded", needs_translation: "Translation required" };
const GRADES = ["Excluded", "In the file", "Relevant", "Supports the fact", "Meets the standard", "Approved by attorney"];
const REC: Record<string, string> = { claim: "Claim", more: "More evidence required", no: "Do not claim", met: "Met", partial: "Partial", missing: "Missing" };
const KIND: Record<string, string> = { date: "Date", conflict: "Conflict", missing: "Missing", risk: "Risk", bar: "Bar" };
const pageLink = "text-muted underline decoration-line underline-offset-4 transition hover:text-ink hover:decoration-ink";

export default async function CasePage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ tab?: string; draft?: string }> }) {
  const { user, firm, viewer } = await requireUser();
  const { id } = await params;
  const { tab = "overview", draft } = await searchParams;
  const c = caseById(firm.id, id, viewer);
  if (!c) notFound();
  await recordAccess(firm.id, user.id, "case_viewed", c.id, `Case of ${c.client}`);
  const docs = documents(firm.id, id);
  const iss = issues(firm.id, id);
  const openAll = iss.filter((i) => i.status === "open");
  // Low severity items stay folded so the list holds what matters.
  const open = openAll.filter((i) => i.severity !== "low");
  const minor = openAll.filter((i) => i.severity === "low");
  const resolved = iss.filter((i) => i.status !== "open");
  const drafts = caseDrafts(firm.id, id);
  const msgs = caseMessages(firm.id, id);
  const pending = caseApprovals(firm.id, id);
  const dates = caseDates(firm.id, id);
  const todayIso = new Date().toISOString().slice(0, 10);
  const upcoming = dates.filter((d) => d.date >= todayIso);
  const past = dates.filter((d) => d.date < todayIso).reverse();
  const crit = criteria(firm.id, id);
  const forms = caseForms(firm.id, id);
  const all: [string, string, number | undefined, boolean][] = [["overview", "Overview", undefined, true], ["documents", "Documents", docs.length, docs.length > 0 || llmConfigured()], ["evidence", "Evidence", undefined, crit.length > 0], ["forms", "Forms", forms.length, forms.length > 0], ["drafts", "Drafts", drafts.length, drafts.length > 0 || c.pages > 0], ["messages", "Messages", msgs.length, msgs.length > 0], ["activity", "Activity", undefined, true]];
  const tabs = all.filter((t) => t[3] || t[0] === tab);
  const none = <Empty>No records</Empty>;

  return (
    <div className="rise">
      {c.processing ? <Refresher /> : null}
      <Link href="/cases" className="mb-5 inline-flex items-center gap-1 text-[12.5px] text-muted transition hover:text-ink"><ChevronLeft size={14} /> Cases</Link>
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="serif flex items-center gap-2 text-[27px] font-medium leading-tight">{c.sensitive ? <Lock size={17} className="text-faint" /> : null}{c.client}</h1>
          <p className="mt-1.5 text-[13px] text-muted">
            {c.type_code}{c.counterpart ? ` · ${c.counterpart}` : ""} · {c.stage}{c.sensitive ? " · Restricted" : ""}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {docs.length > 0 && <ExportMenu label="Export" items={[...exportItems(firm.id, user.id, "case", id).map((i) => ({ ...i, label: i.label.replace(/^Open in (\w+.*)$/, "Exhibit index in $1").replace(/^Download \.xlsx$/, "Exhibit index .xlsx") })), ...exportItems(firm.id, user.id, "deck", id).map((i) => ({ ...i, label: i.label.replace(/^Open in (\w+.*)$/, "Summary deck in $1").replace(/^Download \.pptx$/, "Summary deck .pptx") }))]} />}
        </div>
      </div>

      <div className="max-w-[720px]">
        {c.processing ? (
          <div>
            <p className="text-[14px]">Reading the client file</p>
            <div className="mt-3 h-[3px] w-full max-w-[320px] overflow-hidden rounded-full bg-line"><div className="sweep h-full w-1/3 rounded-full bg-ink" /></div>
          </div>
        ) : (
          <>
            <p className="text-[14.5px] leading-relaxed">{c.summary}</p>
            {c.note && <p className="mt-2 text-[13px] text-risk">{c.note}</p>}
          </>
        )}
      </div>

      {pending.length > 0 && (
        <ul className="mt-6 overflow-hidden rounded-xl border border-line">
          {pending.map((a) => (
            <li key={a.id} className="border-b border-line last:border-0">
              <Link href={`/approvals?id=${a.id}`} className="group flex items-center gap-3 px-4 py-3 transition hover:bg-side">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-ink" />
                <span className="min-w-0 flex-1 truncate text-[13.5px] font-medium">{a.title}</span>
                <ChevronRight size={15} className="shrink-0 text-faint transition group-hover:text-ink" />
              </Link>
            </li>
          ))}
        </ul>
      )}

      {!c.processing && <>
      <div className="edge-fade mb-6 mt-8 flex gap-5 overflow-x-auto border-b border-line pr-6">
        {tabs.map(([k, text, count]) => (
          <Link key={k} href={`/cases/${id}?tab=${k}`} scroll={false} className={clsx("-mb-px whitespace-nowrap border-b-[1.5px] pb-2.5 text-[13px] transition", tab === k ? "border-ink font-medium text-ink" : "border-transparent text-muted hover:text-ink")}>
            {text}{count ? <span className="ml-1.5 text-[12px] font-normal text-faint">{count}</span> : null}
          </Link>
        ))}
      </div>

      {tab === "overview" && (openAll.length + resolved.length + dates.length === 0 ? null : (
        <div className={openAll.length + resolved.length > 0 && dates.length > 0 ? "grid gap-12 lg:grid-cols-[1.6fr_1fr]" : "max-w-[720px]"}>
          <section>
            {open.length > 0 && <h2 className="mb-1 text-[13px] font-medium">Open issues<span className="ml-1.5 font-normal text-faint">{open.length}</span></h2>}
            {open.length > 0 && (
              <ul className="border-t border-line">
                {open.map((i) => (
                  <li key={i.id} className="border-b border-line py-3.5">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-[13.5px] font-medium">{i.title}</span>
                      <span className="flex shrink-0 items-center gap-2 text-[12px] text-faint">{KIND[i.kind] ?? "Risk"}{i.severity === "high" ? " · High" : ""}
                        <form action={resolveIssue.bind(null, i.id)}><button aria-label="Resolve" title="Resolve" className="flex h-6 w-6 items-center justify-center rounded-md text-faint transition hover:bg-panel hover:text-ink"><Check size={14} /></button></form>
                      </span>
                    </div>
                    <p className="mt-0.5 text-[13px] leading-relaxed text-muted">{i.detail}</p>
                    {(JSON.parse(i.sources) as number[]).length > 0 && (
                      <p className="mt-1 flex flex-wrap gap-x-2.5 text-[12px]">
                        {(JSON.parse(i.sources) as number[]).map((p) => <a key={p} href={`/api/pages/${id}/${p}`} target="_blank" className={pageLink}>p. {p}</a>)}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
            {minor.length > 0 && (
              <details className="mt-3 text-[13px]">
                <summary className="cursor-pointer text-muted transition hover:text-ink">{minor.length} minor</summary>
                <ul className="mt-2 border-t border-line">
                  {minor.map((i) => <li key={i.id} className="flex items-start gap-3 border-b border-line py-2.5"><div className="min-w-0 flex-1"><div className="text-[13px]">{i.title}</div><div className="text-[12px] text-muted">{i.detail}</div></div><form action={resolveIssue.bind(null, i.id)}><button aria-label="Resolve" title="Resolve" className="flex h-6 w-6 items-center justify-center rounded-md text-faint transition hover:bg-panel hover:text-ink"><Check size={14} /></button></form></li>)}
                </ul>
              </details>
            )}
            {resolved.length > 0 && (
              <details className="mt-3 text-[13px]">
                <summary className="cursor-pointer text-muted transition hover:text-ink">{resolved.length} resolved</summary>
                <ul className="mt-2 border-t border-line">
                  {resolved.map((i) => <li key={i.id} className="border-b border-line py-2.5"><div className="text-[13px] text-muted">{i.title}</div><div className="text-[12px] text-faint">{i.resolution}</div></li>)}
                </ul>
              </details>
            )}
          </section>
          {dates.length > 0 && (
            <section>
              <h2 className="mb-1 text-[13px] font-medium">Dates</h2>
              {upcoming.length > 0 && (
                <ul className="border-t border-line">
                  {upcoming.map((d) => (
                    <li key={d.id} className="flex items-baseline gap-3 border-b border-line py-2.5">
                      <span className="min-w-0 flex-1"><span className="block truncate text-[13px]">{d.label}</span>{d.source && <span className="block truncate text-[12px] text-faint">{d.source}</span>}</span>
                      <span className="shrink-0 text-right"><span className="block text-[13px] tabular-nums">{longDate(d.date)}</span><span className="block text-[12px] text-faint">{inDays(d.date)}</span></span>
                    </li>
                  ))}
                </ul>
              )}
              {past.length > 0 && (
                <details className="mt-3 text-[13px]">
                  <summary className="cursor-pointer text-muted transition hover:text-ink">{past.length} past</summary>
                  <ul className="mt-2 border-t border-line">
                    {past.map((d) => <li key={d.id} className="flex items-baseline gap-3 border-b border-line py-2"><span className="min-w-0 flex-1 truncate text-[12.5px] text-muted">{d.label}</span><span className="shrink-0 text-[12.5px] tabular-nums text-faint">{longDate(d.date)}</span></li>)}
                  </ul>
                </details>
              )}
            </section>
          )}
        </div>
      ))}

      {tab === "documents" && llmConfigured() && (
        <div className="mb-6 max-w-[640px]">
          <form action={addFile.bind(null, id)} className="flex items-start gap-2">
            <div className="flex-1"><FileDrop /></div>
            <button className={btn.secondary}>Add file</button>
          </form>
          {connectionsOf(firm.id, user.id).length > 0 && (
            <p className="mt-2 flex gap-4 text-[12.5px]">
              {connectionsOf(firm.id, user.id).map((x) => <Link key={x.provider} href={`/cases/${id}/import?from=${x.provider}`} className="text-muted underline decoration-line underline-offset-4 hover:text-ink">{x.provider === "google" ? "Import from Google Drive" : "Import from OneDrive or SharePoint"}</Link>)}
            </p>
          )}
        </div>
      )}
      {tab === "documents" && (docs.length === 0 ? none : (
        <>
          <p className="mb-3 text-[12.5px] text-faint">{c.pages} pages · {docs.length} documents</p>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-[13px]">
              <thead><tr className="border-b border-line text-left text-[12px] text-faint"><th className="w-9 py-2 font-normal">No.</th><th className="px-3 font-normal">Document</th><th className="px-3 font-normal">Pages</th><th className="px-3 font-normal">Source</th><th className="py-2 pl-3 font-normal">Assessment</th></tr></thead>
              <tbody>
                {docs.map((d) => (
                  <tr key={d.id} className="border-b border-line align-top">
                    <td className="py-3 tabular-nums text-faint">{d.n}</td>
                    <td className="max-w-[440px] px-3 py-3">
                      <div className="font-medium">{d.title}</div>
                      {d.note && <p className="mt-0.5 text-[12.5px] leading-relaxed text-muted">{d.note}</p>}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">{d.page_from ? <a href={`/api/pages/${id}/${d.page_from}`} target="_blank" className={pageLink}>{d.page_from === d.page_to || !d.page_to ? d.page_from : `${d.page_from} to ${d.page_to}`}</a> : null}</td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted">{d.source}{d.language && d.language !== "English" ? <span className="block text-[12px] text-faint">{d.language}</span> : null}</td>
                    <td className={clsx("whitespace-nowrap py-3 pl-3", d.status === "ok" ? "text-muted" : "font-medium")}>{DOC_STATUS[d.status] ?? d.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ))}

      {tab === "evidence" && (() => {
        if (crit.length === 0) return none;
        return (
          <div className="flex flex-col">
            {crit.map((k) => {
              const ev = JSON.parse(k.evidence) as { doc: number; page: number; grade: number; note?: string }[];
              return (
                <section key={k.id} className="border-t border-line py-5 first:border-0 first:pt-0">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <h3 className="text-[14.5px] font-medium">{k.name}{k.citation ? <span className="ml-2 text-[12px] font-normal text-faint">{k.citation}</span> : null}</h3>
                    <span className="text-[12.5px] font-medium">{REC[k.recommendation] ?? k.recommendation}{k.strength ? <span className="font-normal text-faint"> · {k.strength}</span> : null}</span>
                  </div>
                  <p className="mt-1 max-w-[680px] text-[13px] leading-relaxed">{k.summary}</p>
                  {k.weakness && <p className="mt-1 max-w-[680px] text-[13px] leading-relaxed text-muted">{k.weakness}</p>}
                  {ev.length > 0 && (
                    <ul className="mt-3">
                      {ev.map((e, i) => {
                        const d = docs.find((x) => x.n === e.doc);
                        return (
                          <li key={i} className="flex items-center gap-3 py-1.5 text-[12.5px]">
                            <a href={`/api/pages/${id}/${e.page}`} target="_blank" className={clsx("min-w-0 flex-1 truncate transition hover:underline", e.grade === 0 && "text-faint line-through")}>{d?.title ?? "Document"} <span className="text-faint">p. {e.page}</span></a>
                            <span className="hidden w-[170px] shrink-0 truncate text-right text-[12px] text-faint md:block">{e.note ?? GRADES[e.grade]}</span>
                            <span className="flex shrink-0 items-center gap-[3px]" title={GRADES[e.grade]}>
                              {[1, 2, 3, 4, 5].map((g) => <span key={g} className={clsx("h-[5px] w-3 rounded-full", g <= e.grade ? "bg-ink" : "bg-line")} />)}
                            </span>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </section>
              );
            })}
          </div>
        );
      })()}

      {tab === "forms" && (
        <div>
          <div className="mb-4 flex justify-end gap-2">
            {!firm.demo && formsFor(c.type_code).length > 0 && <form action={refillForms.bind(null, id)}><button className={btn.ghost}>Fill again from the file</button></form>}
            {forms.some((f) => f.status === "ready") && <a href={`/api/packet?case=${id}`} target="_blank" className={btn.secondary}>Filing packet</a>}
          </div>
          <ul className="border-t border-line">
            {forms.map((f) => {
              const answers = JSON.parse(f.answers) as { name: string; label: string; value: string; source: string }[];
              return (
                <li key={f.id} className="border-b border-line">
                  <details className="group">
                    <summary className="flex cursor-pointer list-none items-center gap-3 py-3.5 [&::-webkit-details-marker]:hidden">
                      <span className="w-[64px] shrink-0 text-[13px] font-medium">{f.code}</span>
                      <span className="min-w-0 flex-1 truncate text-[13.5px]">{f.title}</span>
                      <span className="shrink-0 text-[12px] text-faint">
                        {f.status === "ready" ? `${answers.length} of ${f.fields}` : f.status === "filling" ? "Filling" : f.status === "no_template" ? "Blank form not added" : "Not filled"}
                      </span>
                      {f.status === "ready" && <a href={`/api/form?id=${f.id}`} target="_blank" className="shrink-0 rounded-md border border-line px-2.5 py-1 text-[12.5px] font-medium transition hover:bg-panel">PDF</a>}
                    </summary>
                    {f.status === "ready" && <FormReview formId={f.id} caseId={id} layout={JSON.parse(f.layout)} answers={answers} />}
                  </details>
                </li>
              );
            })}
          </ul>
          {forms.some((f) => f.status === "filling") && <Refresher />}
        </div>
      )}

      {tab === "drafts" && (() => {
        const dr = drafts.find((x) => x.id === draft) ?? drafts[0];
        const L = dr ? (JSON.parse(dr.content) as LetterContent & { generic?: boolean; error?: string; model?: string | null }) : null;
        const decisions = pending.find((a) => a.kind === "decisions");
        return (
          <div>
            {llmConfigured() && c.pages > 0 && !c.processing && (
              <form action={requestDraft.bind(null, id)} className="mb-6 flex max-w-[640px] gap-2">
                <input name="request" required maxLength={600} placeholder="New draft" className={field} />
                <button className={btn.primary}>Draft</button>
              </form>
            )}
            {drafts.length > 1 && (
              <div className="mb-5 flex flex-wrap gap-1.5">
                {drafts.map((x) => <Link key={x.id} href={`/cases/${id}?tab=drafts&draft=${x.id}`} scroll={false} className={clsx("max-w-[260px] truncate rounded-lg border px-2.5 py-1 text-[12.5px] transition", x.id === dr?.id ? "border-ink text-ink" : "border-line text-muted hover:text-ink")}>{x.title}</Link>)}
              </div>
            )}
            {!dr || !L ? (
              decisions ? <Empty>Awaiting strategy decisions. <Link href={`/approvals?id=${decisions.id}`} className="text-ink underline underline-offset-4">Open decisions</Link></Empty> : null
            ) : dr.status === "drafting" ? (
              <div className="py-6"><Refresher /><p className="text-[14px]">Drafting</p><div className="mt-3 h-[3px] w-full max-w-[320px] overflow-hidden rounded-full bg-line"><div className="sweep h-full w-1/3 rounded-full bg-ink" /></div></div>
            ) : dr.status === "failed" ? (
              <p className="text-[13px] text-risk">The draft could not be produced. {L.error}</p>
            ) : (
              <DraftView caseId={id} draftId={dr.id} title={dr.title} subtitle={`${c.type_code} · ${c.client}${c.counterpart ? ` · ${c.counterpart}` : ""}`} sections={L.sections} facts={L.facts} calls={L.calls} notes={L.notes} status={dr.status} generic={Boolean(L.generic)} by={L.model ? modelName(L.model) : undefined} exports={exportItems(firm.id, user.id, "draft", dr.id)} />
            )}
          </div>
        );
      })()}

      {tab === "messages" && (msgs.length === 0 ? none : <MessageList items={msgs} />)}

      {tab === "activity" && (
        <ul className="border-t border-line">
          {caseActivity(firm.id, id).map((a) => (
            <li key={a.id} className="flex items-baseline gap-4 border-b border-line py-2.5">
              <span className="w-[84px] shrink-0 truncate text-[12.5px] text-faint">{a.actor === "Lincoln" ? "Lincoln" : a.actor.split(" ")[0]}</span>
              <p className="min-w-0 flex-1 text-[13px] leading-relaxed">{a.text}</p>
              <span className="shrink-0 text-[12px] text-faint">{ago(a.at)}</span>
            </li>
          ))}
        </ul>
      )}

      </>}

      {llmConfigured() && !c.processing && (
        <div className="mt-12 max-w-[640px]">
          <AskBox caseId={id} placeholder={`Ask about ${c.client}`} />
        </div>
      )}
    </div>
  );
}
