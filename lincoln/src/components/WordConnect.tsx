"use client";

import { useState, useTransition } from "react";
import { disconnectWordAction, newWordCodeAction } from "@/lib/actions";
import { notify } from "./Toaster";
import { btn } from "./ui";

/** The Word add-in: its manifest, and a one time code to connect it. */
export default function WordConnect({ connected }: { connected: boolean }) {
  const [code, setCode] = useState<string | null>(null);
  const [on, setOn] = useState(connected);
  const [pending, start] = useTransition();
  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <a href="/word/manifest.xml" className={btn.secondary} download>Manifest</a>
        <button disabled={pending} onClick={() => start(async () => { const r = await newWordCodeAction(); if (r.code) { setCode(r.code); setOn(false); } })} className={btn.primary}>{on ? "New code" : "Code"}</button>
        {on && <button disabled={pending} onClick={() => start(async () => { await disconnectWordAction(); setOn(false); notify("Disconnected"); })} className={btn.ghost}>Disconnect</button>}
      </div>
      {code && (
        <button onClick={() => { void navigator.clipboard?.writeText(code).then(() => notify("Copied"), () => undefined); }} className="mt-4 w-full rounded-xl border border-line bg-panel py-3 text-center font-mono text-[20px] tracking-[0.18em] transition hover:border-edge" title="Copy">{code}</button>
      )}
    </div>
  );
}
