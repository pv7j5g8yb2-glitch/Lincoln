import Link from "next/link";
import type { ReactNode } from "react";
import { COMPANY } from "@/lib/company";

export type Clause = { h: string; p: (string | string[])[] };

// Terms and Privacy, in the landing page's look: pitch black, the light serif for the title, plain sans text. Top left
// goes back to Lincoln like the Get In Touch page; top right is only the other legal page.
export default function LegalShell({ title, intro, clauses, other }: { title: string; intro: ReactNode; clauses: Clause[]; other: { href: string; label: string } }) {
  return (
    <div className="landing-root min-h-dvh bg-black font-sans text-white antialiased selection:bg-white/20">
      <header className="mx-auto flex h-16 max-w-[1320px] items-center justify-between px-5 md:h-20 md:px-10">
        <Link href="/" aria-label="Back to Lincoln" className="-ml-2 flex h-10 w-10 items-center justify-center text-white/70 transition hover:text-white">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M19 12H5" /><path d="m12 19-7-7 7-7" /></svg>
        </Link>
        <Link href={other.href} className="text-[13px] text-white/60 transition hover:text-white">{other.label}</Link>
      </header>
      <main className="mx-auto max-w-[720px] px-5 pb-28 pt-10 md:px-8 md:pt-16">
        <h1 className="font-serif text-[40px] font-light leading-[1.05] tracking-[-0.02em] md:text-[60px]">{title}</h1>
        <p className="mt-5 text-[11px] uppercase tracking-[0.18em] text-white/45">Last updated: {COMPANY.updated}</p>
        <p className="mt-10 text-[17px] leading-[1.7] text-white/75">{intro}</p>
        {clauses.map((c, i) => (
          <section key={c.h} className="mt-12 border-t border-white/12 pt-8">
            <h2 className="mb-4 text-[16px] font-medium">
              <span className="mr-3 tabular-nums text-white/35">{String(i + 1).padStart(2, "0")}</span>{c.h}
            </h2>
            {c.p.map((x, k) =>
              Array.isArray(x) ? (
                <ul key={k} className="mb-4 flex flex-col gap-2">
                  {x.map((li) => <li key={li} className="flex gap-3 text-[15px] leading-[1.75] text-white/60"><span className="mt-[11px] h-1 w-1 shrink-0 bg-white/40" />{li}</li>)}
                </ul>
              ) : (
                <p key={k} className="mb-4 text-[15px] leading-[1.75] text-white/60">{x}</p>
              ),
            )}
          </section>
        ))}
      </main>
    </div>
  );
}
