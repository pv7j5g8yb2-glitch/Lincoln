"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Mic, Plus, X } from "lucide-react";

const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic";

type Recognition = {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  start: () => void;
  stop: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<{ isFinal: boolean; 0: { transcript: string } }> }) => void) | null;
  onend: (() => void) | null;
  onerror: (() => void) | null;
};
const speechApi = () => {
  if (typeof window === "undefined") return null;
  const w = window as unknown as { SpeechRecognition?: new () => Recognition; webkitSpeechRecognition?: new () => Recognition };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
};

/**
 * One line that grows with the text. Enter sends, Shift and Enter adds a line. The + attaches files;
 * the microphone dictates into the box where the browser supports speech recognition.
 */
export default function Composer({ value, onChange, onSend, busy, placeholder = "Ask Lincoln anything", autoFocus, attach = true }: { value: string; onChange: (v: string) => void; onSend: (files: File[]) => void; busy?: boolean; placeholder?: string; autoFocus?: boolean; attach?: boolean }) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const picker = useRef<HTMLInputElement>(null);
  const [fly, setFly] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  const [listening, setListening] = useState(false);
  const [canSpeak, setCanSpeak] = useState(false);
  const rec = useRef<Recognition | null>(null);
  const base = useRef("");

  useEffect(() => setCanSpeak(Boolean(speechApi())), []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = "0px";
    el.style.height = `${Math.min(el.scrollHeight, 220)}px`;
  }, [value]);
  useEffect(() => () => rec.current?.stop(), []);

  const ready = !busy && (value.trim().length > 0 || files.length > 0);
  const go = () => {
    if (!ready) return;
    rec.current?.stop();
    setFly((n) => n + 1);
    onSend(files);
    setFiles([]);
  };

  const toggleMic = () => {
    if (listening) { rec.current?.stop(); return; }
    const Api = speechApi();
    if (!Api) return;
    const r = new Api();
    r.lang = navigator.language || "en-US";
    r.continuous = true;
    r.interimResults = true;
    base.current = value ? `${value.replace(/\s+$/, "")} ` : "";
    r.onresult = (e) => {
      let finals = "", interim = "";
      for (let i = 0; i < e.results.length; i++) {
        const res = e.results[i];
        if (res.isFinal) finals += res[0].transcript;
        else interim += res[0].transcript;
      }
      onChange(base.current + finals + interim);
    };
    r.onend = () => { setListening(false); rec.current = null; };
    r.onerror = () => { setListening(false); rec.current = null; };
    rec.current = r;
    try { r.start(); setListening(true); } catch { setListening(false); }
  };

  const iconBtn = "flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-muted transition hover:bg-panel hover:text-ink";
  return (
    <form onSubmit={(e) => { e.preventDefault(); go(); }} className="rounded-[22px] border border-line bg-card shadow-[0_2px_12px_-6px_rgba(22,22,20,0.18)] transition focus-within:border-edge">
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 px-3 pt-3">
          {files.map((f, i) => (
            <li key={i} className="fade-in flex max-w-[220px] items-center gap-1.5 rounded-lg bg-panel py-1 pl-2 pr-1 text-[12.5px]">
              <FileText size={13} className="shrink-0 text-muted" />
              <span className="truncate">{f.name}</span>
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, k) => k !== i))} className="rounded p-0.5 text-faint transition hover:text-ink"><X size={13} /></button>
            </li>
          ))}
        </ul>
      )}
      <div className="flex items-end gap-1 py-2 pl-2 pr-2">
        {attach && (
          <>
            <button type="button" onClick={() => picker.current?.click()} aria-label="Add files" className={iconBtn}><Plus size={18} strokeWidth={1.8} /></button>
            <input ref={picker} type="file" multiple accept={ACCEPT} className="hidden" onChange={(e) => { setFiles([...files, ...Array.from(e.target.files ?? [])].slice(0, 40)); e.target.value = ""; }} />
          </>
        )}
        <textarea
          ref={ref}
          rows={1}
          value={value}
          autoFocus={autoFocus}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
              e.preventDefault();
              go();
            }
          }}
          placeholder={listening ? "Listening" : placeholder}
          className={`block max-h-[220px] min-h-[24px] flex-1 resize-none bg-transparent py-[5px] text-[15px] leading-6 outline-none placeholder:text-faint ${attach ? "px-1" : "pl-2"}`}
        />
        {canSpeak && (
          <button type="button" onClick={toggleMic} aria-label={listening ? "Stop dictation" : "Dictate"} aria-pressed={listening} className={listening ? "flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink/[0.08] text-ink" : iconBtn}>
            {listening ? <span className="mic-live flex items-center gap-[2px]"><i /><i /><i /></span> : <Mic size={17} strokeWidth={1.8} />}
          </button>
        )}
        <button key={fly} disabled={!ready} aria-label="Send" className={`mb-px flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded-full bg-ink text-canvas transition-colors hover:opacity-90 ${fly ? "send-pop" : ""} ${ready ? "" : "opacity-20"}`}><ArrowUp size={16} /></button>
      </div>
    </form>
  );
}
