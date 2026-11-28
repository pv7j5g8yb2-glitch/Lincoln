import type { Metadata } from "next";
import Link from "next/link";
import { STATUS_STEPS, caseStatus, lookup } from "@/lib/client-intake";
import { MATTERS } from "@/lib/intake-matters";
import IntakeFlow from "@/components/intake/IntakeFlow";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Your case", robots: { index: false, follow: false } };

const when = (iso: string) => new Date(iso).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });

export default async function Intake({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ more?: string }> }) {
  const link = lookup((await params).token);
  if (!link) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-canvas px-6 text-center">
        <div><h1 className="font-serif text-[30px] font-light tracking-[-0.02em] text-ink">This link is no longer active.</h1><p className="mt-3 font-serif text-[17px] text-muted">Ask your law firm for a new one.</p></div>
      </main>
    );
  }
  // A case link the client already used becomes their status page: where the case stands and what is still
  // needed. It never says whether they qualify or how the case will go.
  const status = caseStatus(link);
  if (!status) return <IntakeFlow token={link.token} firm={link.firm} fixed={link.matter?.id ?? null} name={link.client} matters={MATTERS} tracked={Boolean(link.case_id)} />;
  if ((await searchParams).more && link.matter) return <IntakeFlow token={link.token} firm={link.firm} fixed={link.matter.id} name={link.client} matters={MATTERS} more tracked />;

  const at = STATUS_STEPS.indexOf(status.stage);
  return (
    <div className="min-h-dvh bg-canvas font-serif text-ink antialiased selection:bg-panel">
      <header className="mx-auto max-w-[620px] px-5 pt-6 md:pt-10">
        <p className="font-sans text-[12.5px] font-medium uppercase tracking-[0.16em] text-faint">{link.firm}</p>
      </header>
      <main className="mx-auto max-w-[620px] px-5 pb-24 pt-10">
        <h1 className="text-[34px] font-light leading-[1.08] tracking-[-0.02em] md:text-[40px]">{status.first ? `${status.first}, your case` : "Your case"}</h1>
        {link.matter && <p className="mt-3 text-[17px] leading-[1.6] text-muted">{link.matter.label}</p>}

        <ol className="mt-10 flex flex-col">
          {STATUS_STEPS.map((step, i) => {
            const done = at >= 0 && i < at, now = i === at;
            return (
              <li key={step} className="relative flex gap-4 pb-6 last:pb-0">
                {i < STATUS_STEPS.length - 1 && <span className={`absolute left-[9px] top-6 h-[calc(100%-18px)] w-px ${done ? "bg-ink" : "bg-line"}`} />}
                <span className={`relative mt-1 flex h-[19px] w-[19px] shrink-0 items-center justify-center rounded-full ${done ? "bg-ink" : now ? "bg-card ring-2 ring-ink" : "bg-card ring-1 ring-edge"}`}>
                  {done && <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m5 12 5 5 9-10" /></svg>}
                  {now && <span className="h-[7px] w-[7px] rounded-full bg-ink" />}
                </span>
                <span className={`font-sans text-[16px] ${now ? "font-medium" : done ? "" : "text-faint"}`}>{step}</span>
              </li>
            );
          })}
        </ol>

        {(status.missing.length > 0 || status.received.length > 0) && (
          <div className="mt-12">
            {status.missing.length > 0 && (
              <>
                <h2 className="font-sans text-[13px] font-medium uppercase tracking-[0.12em] text-faint">Still needed</h2>
                <ul className="mt-3 flex flex-col">
                  {status.missing.map((m, i) => <li key={m} className={`py-3.5 font-sans text-[15.5px] ${i ? "border-t border-line" : ""}`}>{m}</li>)}
                </ul>
              </>
            )}
            {status.received.length > 0 && (
              <>
                <h2 className={`font-sans text-[13px] font-medium uppercase tracking-[0.12em] text-faint ${status.missing.length ? "mt-9" : ""}`}>Received</h2>
                <ul className="mt-3 flex flex-col">
                  {status.received.map((m, i) => <li key={m} className={`flex items-center justify-between gap-4 py-3.5 font-sans text-[15.5px] text-muted ${i ? "border-t border-line" : ""}`}><span>{m}</span><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><path d="m5 12 5 5 9-10" /></svg></li>)}
                </ul>
              </>
            )}
          </div>
        )}

        {link.matter && <Link href={`/intake/${link.token}?more=1`} className="mt-10 inline-block bg-ink px-6 py-3.5 font-sans text-[15.5px] font-medium text-canvas transition hover:opacity-85">Send more documents</Link>}
        <p className="mt-10 font-sans text-[13px] text-faint">Last sent {when(status.last)}</p>
      </main>
    </div>
  );
}
