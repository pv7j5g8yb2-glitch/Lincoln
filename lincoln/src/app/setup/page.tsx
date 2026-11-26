import { redirect } from "next/navigation";
import { Check } from "lucide-react";
import AuthShell, { field, fieldLabel, submit } from "@/components/AuthShell";
import AvatarField from "@/components/AvatarField";
import { saveSetupProfile, signOut } from "@/lib/actions";
import { connectionsOf } from "@/lib/integrations";
import { kv } from "@/lib/queries";
import { ROLES } from "@/lib/roles";
import { requireUser } from "@/lib/session";

export const dynamic = "force-dynamic";
export const metadata = { title: "Set up" };

// The first time someone opens Lincoln: their name and role, then their Microsoft 365 or Google Workspace account.
// Lincoln works from the firm's mail and files, so this step cannot be skipped.
export default async function Setup({ searchParams }: { searchParams: Promise<{ error?: string; step?: string }> }) {
  const { user, firm } = await requireUser({ setup: true });
  if (firm.demo || user.setup_at) redirect("/");
  const { error, step } = await searchParams;
  const profiled = kv(firm.id, `setup:${user.id}`) === "1" && step !== "profile";
  const conns = connectionsOf(firm.id, user.id);
  const out = (
    <form action={signOut}><button className="text-[13px] text-muted transition hover:text-ink">Sign out</button></form>
  );
  const option = "press flex h-12 w-full items-center justify-center gap-3 border border-line bg-card text-[14.5px] font-medium text-ink transition hover:bg-side";

  if (!profiled) {
    return (
      <AuthShell title="Welcome to Lincoln" footer={out}>
        {error === "name" && <p className="mb-4 bg-risk-bg px-3 py-2.5 text-[13px] text-risk">Name and role required</p>}
        <form action={saveSetupProfile} className="flex flex-col gap-4">
          <div className="flex justify-center"><AvatarField initials={user.initials} current={user.avatar} /></div>
          <label className="block"><span className={fieldLabel}>Full name</span><input name="name" required maxLength={100} defaultValue={user.name === "Administrator" ? "" : user.name} autoComplete="name" className={field} /></label>
          <label className="block"><span className={fieldLabel}>Role</span>
            <select name="role" required defaultValue={ROLES.includes(user.role) ? user.role : ""} className={field}>
              <option value="" disabled>Choose</option>
              {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </label>
          <button className={`${submit} mt-1`}>Continue</button>
        </form>
      </AuthShell>
    );
  }

  return (
    <AuthShell title="Connect the firm's work" footer={out}>
      {error === "connect" && <p className="mb-4 bg-risk-bg px-3 py-2.5 text-[13px] text-risk">Not connected. Try again.</p>}
      <div className="flex flex-col gap-2.5">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="/api/connect/microsoft" className={option}><img src="/logos/microsoft.svg" alt="" width={18} height={18} />Microsoft 365{conns.some((c) => c.provider === "microsoft") && <Check size={16} className="text-ok" />}</a>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <a href="/api/connect/google" className={option}><img src="/logos/google.svg" alt="" width={18} height={18} />Google Workspace{conns.some((c) => c.provider === "google") && <Check size={16} className="text-ok" />}</a>
      </div>
      <a href="/setup?step=profile" className="mt-6 block text-center text-[13px] text-muted transition hover:text-ink">Back</a>
    </AuthShell>
  );
}
