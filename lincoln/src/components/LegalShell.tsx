import Link from "next/link";
import type { ReactNode } from "react";
import { COMPANY } from "@/lib/company";

export type Clause = { h: string; p: (string | string[])[] };

export default function LegalShell({ title, intro, clauses }: { title: string; intro: ReactNode; clauses: Clause[] }) {
  return (
    <main className="min-h-dvh bg-canvas px-5 pb-20">
      <header className="mx-auto flex max-w-[720px] items-center justify-between py-6">
        <Link href="/signin" className="wordmark text-[22px] leading-none">Lincoln</Link>
        <nav className="flex gap-5 text-[13px] text-muted">
          <Link href="/privacy" className="hover:text-ink">Privacy</Link>
          <Link href="/terms" className="hover:text-ink">Terms</Link>
          <Link href="/signin" className="hover:text-ink">Sign in</Link>
        </nav>
      </header>
      <article className="mx-auto max-w-[720px] pt-8">
        <h1 className="serif text-[32px] font-medium leading-tight">{title}</h1>
        <p className="mt-2 text-[13px] text-faint">Effective {COMPANY.effective}</p>
        <p className="mt-6 text-[14.5px] leading-[1.75] text-muted">{intro}</p>
        {clauses.map((c, i) => (
          <section key={c.h} className="mt-9">
            <h2 className="mb-2 text-[15.5px] font-medium">{i + 1}. {c.h}</h2>
            {c.p.map((x, k) =>
              Array.isArray(x) ? (
                <ul key={k} className="mb-3 flex flex-col gap-1.5 pl-1">
                  {x.map((li) => <li key={li} className="flex gap-2.5 text-[14.5px] leading-[1.7] text-muted"><span className="mt-[11px] h-1 w-1 shrink-0 rounded-full bg-faint" />{li}</li>)}
                </ul>
              ) : (
                <p key={k} className="mb-3 text-[14.5px] leading-[1.75] text-muted">{x}</p>
              ),
            )}
          </section>
        ))}
      </article>
    </main>
  );
}
