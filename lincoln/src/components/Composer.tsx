"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUp, FileText, Mic, Plus, Square, X } from "lucide-react";
import { READABLE } from "@/lib/accept";

const ACCEPT = READABLE;

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
export default function Composer({ value, onChange, onSend, onStop, busy, placeholder = "Ask Lincoln anything", autoFocus, attach = true, accept = ACCEPT }: { value: string; onChange: (v: string) => void; onSend: (files: File[]) => void; onStop?: () => void; busy?: boolean; placeholder?: string; autoFocus?: boolean; attach?: boolean; accept?: string }) {
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

  const iconBtn = "flex h-8 w-8 shrink-0 items-center justify-center text-muted transition hover:bg-panel hover:text-ink";
  return (
    <form onSubmit={(e) => { e.preventDefault(); go(); }} className="border border-line bg-card shadow-[0_2px_12px_-6px_rgba(22,22,20,0.18)] transition focus-within:border-edge md:">
      {files.length > 0 && (
        <ul className="flex flex-wrap gap-1.5 px-3 pt-3">
          {files.map((f, i) => (
            <li key={i} className="fade-in flex max-w-[220px] items-center gap-1.5 bg-panel py-1 pl-2 pr-1 text-[12.5px]">
              <FileText size={13} className="shrink-0 text-muted" />
              <span className="truncate">{f.name}</span>
              <button type="button" aria-label={`Remove ${f.name}`} onClick={() => setFiles(files.filter((_, k) => k !== i))} className="p-0.5 text-faint transition hover:text-ink"><X size={13} /></button>
            </li>
          ))}
        </ul>
      )}
      {/* Phones: one line, a pill. Larger screens: the text above, the controls in a row below, like Claude. */}
      <div className="flex items-end gap-1 py-2 pl-2 pr-2 md:flex-wrap md:px-2.5 md:pb-2.5 md:pt-3">
        {attach && (
          <>
            <button type="button" onClick={() => picker.current?.click()} aria-label="Add files" className={`${iconBtn} md:order-1`}><Plus size={18} strokeWidth={1.8} /></button>
            <input ref={picker} type="file" aria-label="Attach files" multiple accept={accept} className="hidden" onChange={(e) => { setFiles([...files, ...Array.from(e.target.files ?? [])].slice(0, 40)); e.target.value = ""; }} />
          </>
        )}
        <span className="hidden md:order-2 md:block md:flex-1" />
        <textarea
          ref={ref}
          aria-label={placeholder}
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
          className={`block max-h-[220px] min-h-[24px] flex-1 resize-none bg-transparent py-[4px] text-[16px] leading-6 outline-none placeholder:text-faint md:order-first md:mb-2 md:min-h-[48px] md:basis-full md:px-1.5 ${attach ? "px-1" : "pl-2"}`}
        />
        {canSpeak && (
          <button type="button" onClick={toggleMic} aria-label={listening ? "Stop dictation" : "Dictate"} aria-pressed={listening} className={`${listening ? "flex h-8 w-8 shrink-0 items-center justify-center bg-ink/[0.08] text-ink" : iconBtn} md:order-3`}>
            {listening ? <span className="mic-live flex items-center gap-[2px]"><i /><i /><i /></span> : <Mic size={17} strokeWidth={1.8} />}
          </button>
        )}
        {busy && onStop
          ? <button type="button" onClick={onStop} aria-label="Stop" className="mb-px flex md:order-3 h-8 w-8 shrink-0 items-center justify-center bg-ink text-canvas transition hover:opacity-90"><Square size={12} fill="currentColor" /></button>
          : <button key={fly} disabled={!ready} aria-label="Send" className={`mb-px flex md:order-3 h-8 w-8 shrink-0 items-center justify-center overflow-hidden bg-ink text-canvas transition-colors hover:opacity-90 ${fly ? "send-pop" : ""} ${ready ? "" : "opacity-20"}`}><ArrowUp size={16} /></button>}
      </div>
    </form>
  );
}
