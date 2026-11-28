"use client";

import "./globals.css";

/** The last resort when even the page frame fails. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body>
        <main className="flex min-h-dvh flex-col items-center justify-center bg-canvas px-6 text-center text-ink">
          <p className="wordmark mb-14 text-[22px]">Lincoln</p>
          <h1 className="serif text-[34px] font-light tracking-[-0.02em]">Not loaded</h1>
          <button onClick={reset} className="mt-8 h-9 border border-line bg-card px-4 text-[13px] font-medium">Try again</button>
        </main>
      </body>
    </html>
  );
}
