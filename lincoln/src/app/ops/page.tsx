import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CopyLink from "@/components/CopyLink";
import { PageHead, btn, field, label } from "@/components/ui";
import { setUpFirmAction } from "@/lib/actions";
import { db } from "@/lib/db";
import { inviteUrl, isOps } from "@/lib/invites";
import { requireUser } from "@/lib/session";

// For Lincoln's own staff only (LINCOLN_OPS_EMAILS): set up a firm for the person who contacted us. They get an
// admin invite; everyone else at their firm is invited by them.
export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Set up a firm · Lincoln", robots: { index: false, follow: false } };

export default async function Ops({ searchParams }: { searchParams: Promise<{ invite?: string; firm?: string; error?: string }> }) {
  const { user } = await requireUser();
  if (!isOps(user.email)) notFound();
  const { invite, firm, error } = await searchParams;
  const firms = db().prepare("SELECT f.name, COUNT(u.id) AS members FROM firms f LEFT JOIN users u ON u.firm_id = f.id WHERE f.demo = 0 GROUP BY f.id ORDER BY f.rowid DESC LIMIT 30").all() as { name: string; members: number }[];
  return (
    <div className="mx-auto max-w-[560px] px-5 py-12">
      <PageHead title="Set up a firm" />
      {error && <p className="mb-4 text-[13px] text-risk">{error === "exists" ? "This email already has an account." : "Firm name and a valid email are needed."}</p>}
      <form action={setUpFirmAction} className="flex flex-col gap-4">
        <label className="block"><span className={label}>Firm</span><input name="firm" required maxLength={120} className={field} /></label>
        <label className="block"><span className={label}>Admin email</span><input name="email" type="email" required className={field} /></label>
        <div><button className={btn.primary}>Create</button></div>
      </form>
      {invite && /^[\w-]{20,80}$/.test(invite) && (
        <div className="mt-8"><span className={label}>Admin invite for {firm}</span><CopyLink inline url={inviteUrl(invite)} /></div>
      )}
      {firms.length > 0 && (
        <div className="mt-12 border-t border-line">
          {firms.map((f, i) => <div key={i} className="flex justify-between border-b border-line py-2.5 text-[13px]"><span>{f.name}</span><span className="text-faint">{f.members}</span></div>)}
        </div>
      )}
    </div>
  );
}
