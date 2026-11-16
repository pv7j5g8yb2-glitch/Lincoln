"use client";

import { Link2 } from "lucide-react";
import { notify } from "./Toaster";
import { btn, field } from "./ui";

/** A client link with a Copy button. "inline" shows the address itself; otherwise only the button. */
export default function CopyLink({ url, label = "Client link", inline = false }: { url: string; label?: string; inline?: boolean }) {
  const copy = async () => {
    try { await navigator.clipboard.writeText(url); notify("Copied"); } catch { notify("Not copied"); }
  };
  if (!inline) return <button type="button" onClick={() => void copy()} className={btn.secondary}><Link2 size={14} /> {label}</button>;
  return (
    <div className="flex gap-2">
      <input readOnly value={url} onFocus={(e) => e.currentTarget.select()} className={`${field} min-w-0 flex-1 text-muted`} />
      <button type="button" onClick={() => void copy()} className={btn.secondary}>Copy</button>
    </div>
  );
}
