import Link from "next/link";
import { btn } from "@/components/ui";

export const metadata = { title: "Page not found" };

/** Any address that does not exist, on the site or in the app. */
export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center text-ink">
      <Link href="/" className="wordmark mb-14 text-[22px]">Lincoln</Link>
      <h1 className="serif text-[34px] font-light leading-tight tracking-[-0.02em]">Page not found</h1>
      <Link href="/" className={`${btn.secondary} mt-8`}>Back to Lincoln</Link>
    </main>
  );
}
