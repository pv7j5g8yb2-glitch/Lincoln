import Link from "next/link";
import { redirect } from "next/navigation";
import AuthShell, { Notice, SocialButtons, field, fieldLabel, submit } from "@/components/AuthShell";
import { signIn, signInDemo } from "@/lib/actions";
import { currentUser } from "@/lib/session";

export const dynamic = "force-dynamic";
const ERR: Record<string, string> = {
  invalid: "Email or password is incorrect.",
  limited: "Too many attempts. Try again in 15 minutes.",
  expired: "Sign in expired. Try again.",
  provider: "Sign in failed.",
  linked: "An account with this email exists. Sign in with its password.",
};

export default async function SignIn({ searchParams }: { searchParams: Promise<{ error?: string; code?: string; reset?: string; deleted?: string }> }) {
  if (await currentUser()) redirect("/");
  const { error, code, reset, deleted } = await searchParams;
  return (
    <AuthShell
      title="Welcome back"
      footer={<Link href="/signup" className="font-medium text-ink hover:underline">Create an account</Link>}
      below={<form action={signInDemo}><button className="text-[13px] font-medium text-muted underline decoration-edge underline-offset-4 transition hover:text-ink">View the demo account</button></form>}
    >
      {error && ERR[error] && <Notice>{ERR[error]}{code ? <span className="mt-1 block font-mono text-[11.5px] opacity-80">{code.replace(/[^\w.-]/g, "").slice(0, 40)}</span> : null}</Notice>}
      {reset && <Notice tone="ok">Password updated.</Notice>}
      {deleted && <Notice tone="ok">Firm deleted.</Notice>}
      <SocialButtons />
      <form action={signIn} className="flex flex-col gap-4">
        <label className="block"><span className={fieldLabel}>Email address</span><input name="email" type="email" required autoComplete="email" placeholder="you@example.com" className={field} /></label>
        <label className="block">
          <span className={fieldLabel}>Password<Link href="/forgot" className="text-[12px] font-medium text-muted hover:text-ink">Forgot password</Link></span>
          <input name="password" type="password" required autoComplete="current-password" placeholder="Enter password" className={field} />
        </label>
        <button className={`${submit} mt-1`}>Continue</button>
      </form>
    </AuthShell>
  );
}
