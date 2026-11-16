import type { Metadata } from "next";
import { lookup } from "@/lib/client-intake";
import { MATTERS } from "@/lib/intake-matters";
import IntakeFlow from "@/components/intake/IntakeFlow";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Start your case", robots: { index: false, follow: false } };

export default async function Intake({ params }: { params: Promise<{ token: string }> }) {
  const link = lookup((await params).token);
  if (!link) {
    return (
      <main className="flex min-h-dvh items-center justify-center bg-[#faf9f6] px-6 text-center">
        <div><h1 className="font-serif text-[30px] font-semibold tracking-[-0.02em] text-[#161614]">This link is no longer active.</h1><p className="mt-3 font-serif text-[17px] text-[#6b6862]">Ask your law firm for a new one.</p></div>
      </main>
    );
  }
  return <IntakeFlow token={link.token} firm={link.firm} fixed={link.matter?.id ?? null} name={link.client} matters={MATTERS} />;
}
