import { redirect } from "next/navigation";
import AuthShell, { Notice, SocialButtons, field, fieldLabel, submit } from "@/components/AuthShell";
import PasswordInput from "@/components/PasswordInput";
import { joinFirm } from "@/lib/actions";
import { findInvite } from "@/lib/invites";
import { ROLES } from "@/lib/roles";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
const ERR: Record<string, string> = { fields: "Name and role are required.", password: "The password needs at least 10 characters.", exists: "An account with this email already exists.", breached: "This password appears in known data breaches. Choose another.", limited: "Too many attempts. Try again later.", expired: "This invite has expired or was already used." };

export const metadata = { title: "Join" };

export default async function Join({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  if (await currentUser()) redirect("/");
  const { token } = await params;
  const { error } = await searchParams;
  const inv = findInvite(token);
  if (!inv) {
    return <AuthShell title="Invite expired"><Notice>This invite has expired or was already used. Ask the firm for a new one.</Notice></AuthShell>;
  }
  return (
    <AuthShell title={`Join ${inv.firm}`}>
      {error && ERR[error] && <Notice>{ERR[error]}</Notice>}
      <SocialButtons />
      <form action={joinFirm.bind(null, token)} className="flex flex-col gap-4">
        <label className="block"><span className={fieldLabel}>Email address</span><input value={inv.email} disabled className={`${field} opacity-70`} /></label>
        <label className="block"><span className={fieldLabel}>Full name</span><input name="name" required maxLength={100} autoComplete="name" placeholder="Sam Smith" className={field} /></label>
        <label className="block"><span className={fieldLabel}>Role</span>
          <select name="role" defaultValue={inv.role ?? ""} required className={field}>
            {!inv.role && <option value="" disabled>Choose</option>}
            {ROLES.map((r) => <option key={r} value={r}>{r}</option>)}
          </select>
        </label>
        <label className="block"><span className={fieldLabel}>Password</span><PasswordInput /></label>
        <button className={`${submit} mt-1`}>Join</button>
      </form>
    </AuthShell>
  );
}
