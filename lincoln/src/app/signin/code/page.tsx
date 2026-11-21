import Link from "next/link";
import AuthShell, { Notice, field, submit } from "@/components/AuthShell";
import { verifySignInCode } from "@/lib/actions";

export const dynamic = "force-dynamic";

export default async function SignInCode({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams;
  return (
    <AuthShell title="Two step sign in" footer={<Link href="/signin" className="font-medium text-ink hover:underline">Back to sign in</Link>}>
      {error === "code" && <Notice>Wrong code.</Notice>}
      <form action={verifySignInCode} className="flex flex-col gap-2.5">
        <input name="code" required autoFocus autoComplete="one-time-code" inputMode="text" maxLength={20} placeholder="6 digit code or a recovery code" className={field} />
        <button className={submit}>Continue</button>
      </form>
    </AuthShell>
  );
}
