"use client";

import { useEffect, useState, useTransition, type ReactNode } from "react";
import { X } from "lucide-react";
import { disconnectWordAction, newWordCodeAction } from "@/lib/actions";
import { notify } from "./Toaster";
import { confirmBox } from "./Confirm";
import { btn } from "./ui";

const APPS = {
  word: { key: "lincoln-word-downloaded", manifest: "/word/manifest.xml", title: "Add Lincoln to Word", steps: ["In Word: Home, Add-ins, More Add-ins.", "My Add-ins, Upload My Add-in, then the downloaded file.", "Open Lincoln from the Home tab and enter the code."] },
  outlook: { key: "lincoln-outlook-downloaded", manifest: "/outlook/manifest.xml", title: "Add Lincoln to Outlook", steps: ["In Outlook: Get Add-ins, then My add-ins.", "Add a custom add-in, Add from file, then the downloaded file.", "Open an email, select Lincoln and enter the code."] },
};

/** An Office add-in (Word or Outlook): download it, then a one time code connects it. The steps open once the file is downloaded. */
/** The card header (logo and name) is drawn here so Disconnect sits top right, as on the Google and Microsoft cards. */
export default function WordConnect({ connected, app = "word", head }: { connected: boolean; app?: keyof typeof APPS; head: ReactNode }) {
  const A = APPS[app];
  const [code, setCode] = useState<string | null>(null);
  const [on, setOn] = useState(connected);
  const [downloaded, setDownloaded] = useState(connected);
  const [guide, setGuide] = useState(false);
  const [pending, start] = useTransition();
  useEffect(() => { try { if (localStorage.getItem(A.key)) setDownloaded(true); } catch { /* private window */ } }, [A.key]);
  const getCode = async () => {
    const ok = await confirmBox({ password: true });
    if (!ok) return;
    start(async () => { const r = await newWordCodeAction(ok.password); if (r.code) { setCode(r.code); setOn(false); } else if ("error" in r && r.error) notify(r.error); });
  };
  const codeBox = code && (
    <button onClick={() => { void navigator.clipboard?.writeText(code).then(() => notify("Copied"), () => undefined); }} className="mt-4 w-full border border-line bg-panel py-3 text-center font-mono text-[20px] tracking-[0.18em] transition hover:border-edge" title="Copy">{code}</button>
  );
  return (
    <div>
      <div className="flex items-center gap-3">
        {head}
        {on && <button disabled={pending} onClick={async () => { if (!(await confirmBox())) return; start(async () => { await disconnectWordAction(app); setOn(false); notify("Disconnected"); }); }} className={btn.ghost}>Disconnect</button>}
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <a href={A.manifest} download onClick={() => { try { localStorage.setItem(A.key, "1"); } catch { /* fine */ } setDownloaded(true); setGuide(true); }} className={downloaded ? btn.secondary : btn.primary}>Download</a>
        {downloaded && <button disabled={pending} onClick={() => void getCode()} className={btn.primary}>{on ? "New code" : "Code"}</button>}
        {downloaded && <button onClick={() => setGuide(true)} className={btn.ghost}>Steps</button>}
      </div>
      {!guide && codeBox}
      {guide && (
        <div className="fixed inset-0 z-[90] flex items-center justify-center bg-black/40 p-6 backdrop-blur-[2px]" onMouseDown={(e) => { if (e.target === e.currentTarget) setGuide(false); }}>
          <div role="dialog" aria-modal="true" aria-labelledby="word-guide" className="rise w-full max-w-[420px] border border-line bg-card p-6 text-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]">
            <div className="flex items-center justify-between">
              <h2 id="word-guide" className="text-[17px] font-medium">{A.title}</h2>
              <button onClick={() => setGuide(false)} aria-label="Close" className="p-1 text-faint transition hover:text-ink"><X size={18} /></button>
            </div>
            <ol className="mt-5 flex flex-col gap-3.5 text-[14px] leading-relaxed">
              {A.steps.map((t, i) => (
                <li key={i} className="flex gap-3"><span className="flex h-6 w-6 shrink-0 items-center justify-center bg-panel text-[12px] font-medium">{i + 1}</span><span className="pt-0.5">{t}</span></li>
              ))}
            </ol>
            {code ? codeBox : <button disabled={pending} onClick={() => void getCode()} className={`${btn.primary} mt-6 w-full justify-center`}>Code</button>}
            <p className="mt-5 border-t border-line pt-4 text-[12.5px] leading-relaxed text-muted">For the whole firm at once: Microsoft 365 admin center, Settings, Integrated apps, Upload custom apps.</p>
          </div>
        </div>
      )}
    </div>
  );
}
