import Link from "next/link";
import AuthShell, { Notice, field, submit } from "@/components/AuthShell";
import { resetPassword } from "@/lib/actions";
import PasswordInput from "@/components/PasswordInput";

export const dynamic = "force-dynamic";

export default async function Reset({ params, searchParams }: { params: Promise<{ token: string }>; searchParams: Promise<{ error?: string }> }) {
  const { token } = await params;
  const { error } = await searchParams;
  return (
    <AuthShell title="Set a new password" footer={<Link href="/signin" className="font-medium text-ink hover:underline">Back to sign in</Link>}>
      {error === "password" && <Notice>The password needs at least 10 characters.</Notice>}
      {error === "breached" && <Notice>This password appears in known data breaches. Choose another.</Notice>}
      <form action={resetPassword} className="flex flex-col gap-2.5">
        <input type="hidden" name="token" value={token} />
        <PasswordInput />
        <button className={submit}>Update password</button>
      </form>
    </AuthShell>
  );
}
