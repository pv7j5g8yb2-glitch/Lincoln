"use client";

import { useEffect } from "react";
import { btn } from "@/components/ui";

/** A page that failed to load: a few words and a way to try again, never the framework's own error screen. */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex min-h-[60dvh] flex-col items-center justify-center text-center">
      <h1 className="serif text-[28px] font-light tracking-[-0.02em]">Not loaded</h1>
      <button onClick={reset} className={`${btn.secondary} mt-6`}>Try again</button>
    </div>
  );
}
