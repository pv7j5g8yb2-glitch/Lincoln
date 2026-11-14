import Link from "next/link";
import AuthShell, { Notice, field, submit } from "@/components/AuthShell";
import { requestReset } from "@/lib/actions";

export const dynamic = "force-dynamic";
const ERR: Record<string, string> = { limited: "Too many requests. Try again later.", expired: "Link expired." };

export default async function Forgot({ searchParams }: { searchParams: Promise<{ error?: string; sent?: string; preview?: string }> }) {
  const { error, sent, preview } = await searchParams;
  return (
    <AuthShell title="Reset password" footer={<Link href="/signin" className="font-medium text-ink hover:underline">Back to sign in</Link>}>
      {error && ERR[error] && <Notice>{ERR[error]}</Notice>}
      {sent ? (
        <>
          <Notice tone="ok">If the account exists, a reset link is on its way.</Notice>
          {preview && (
            <p className="rounded-xl border border-dashed border-edge bg-card px-3.5 py-3 text-[12.5px] leading-relaxed text-muted">
              Email delivery is not connected in this environment. Preview link:{" "}
              <Link href={`/reset/${preview}`} className="font-medium text-ink underline">set a new password</Link>
            </p>
          )}
        </>
      ) : (
        <form action={requestReset} className="flex flex-col gap-2.5">
          <input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={field} />
          <button className={submit}>Send reset link</button>
        </form>
      )}
    </AuthShell>
  );
}
