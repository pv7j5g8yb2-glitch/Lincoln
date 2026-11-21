"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const COOKIE = "lincoln_toast";
const SHOW_MS = 5000;

/** Shows a notice from anywhere in the app: window.dispatchEvent(new CustomEvent("lincoln:toast", { detail: "Saved" })). */
export const notify = (text: string) => window.dispatchEvent(new CustomEvent("lincoln:toast", { detail: text }));

/**
 * A soft rectangle that drops from the top of the screen, stays five seconds and goes back up.
 * It can be pushed up with a finger or the mouse at any time.
 */
export default function Toaster({ initial }: { initial?: string | null }) {
  const [item, setItem] = useState<{ text: string; key: number } | null>(null);
  const [shown, setShown] = useState(false);
  const [drag, setDrag] = useState(0);
  const start = useRef<number | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    setShown(false);
    setDrag(0);
  }, []);

  const show = useCallback((text: string) => {
    if (timer.current) clearTimeout(timer.current);
    setItem({ text, key: Date.now() });
    setDrag(0);
    requestAnimationFrame(() => setShown(true));
    timer.current = setTimeout(hide, SHOW_MS);
  }, [hide]);

  // From the server: shown once, then the cookie is cleared so a reload does not repeat it.
  useEffect(() => {
    if (!initial) return;
    const text = initial.split("|")[0];
    document.cookie = `${COOKIE}=; Max-Age=0; path=/`;
    if (text) show(text);
  }, [initial, show]);

  useEffect(() => {
    const on = (e: Event) => show(String((e as CustomEvent).detail ?? ""));
    window.addEventListener("lincoln:toast", on);
    return () => window.removeEventListener("lincoln:toast", on);
  }, [show]);

  if (!item) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[80] flex justify-center px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <div
        key={item.key}
        role="status"
        aria-live="polite"
        onPointerDown={(e) => { start.current = e.clientY; (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId); if (timer.current) clearTimeout(timer.current); }}
        onPointerMove={(e) => { if (start.current !== null) setDrag(Math.min(0, e.clientY - start.current)); }}
        onPointerUp={() => {
          const pulled = drag < -18;
          start.current = null;
          if (pulled) hide();
          else { setDrag(0); timer.current = setTimeout(hide, SHOW_MS / 2); }
        }}
        onPointerCancel={() => { start.current = null; setDrag(0); timer.current = setTimeout(hide, SHOW_MS / 2); }}
        style={{
          transform: `translateY(${shown ? drag : -120}px)`,
          opacity: shown ? 1 : 0,
          transition: start.current !== null ? "none" : "transform 420ms cubic-bezier(0.22, 1, 0.36, 1), opacity 300ms ease",
        }}
        className="pointer-events-auto min-w-[160px] max-w-[420px] cursor-grab touch-none select-none rounded-2xl border border-line bg-card px-5 py-3 text-center text-[13.5px] font-medium text-ink shadow-[0_12px_36px_-12px_rgba(22,22,20,0.35)] active:cursor-grabbing"
      >
        {item.text}
      </div>
    </div>
  );
}
