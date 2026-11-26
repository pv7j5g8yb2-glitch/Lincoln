"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ABOUT, GROUPS, type Field, type Matter } from "@/lib/intake-matters";
import { READABLE } from "@/lib/accept";

// The page a client opens from their law firm's link. Plain questions, then their documents, then Send.
// Progress stays on the phone, so a client can stop and come back. Nothing here gives legal answers.

type Up = { id: string; item: string; name: string; warn?: string };
type Saved = { step: string; matter: string | null; answers: Record<string, string>; session: string | null; files: Up[] };

const field = "w-full bg-card px-4 py-3.5 font-sans text-[16px] ring-1 ring-edge outline-none transition placeholder:text-faint focus:ring-2 focus:ring-ink";
const pill = (on: boolean) => `px-4 py-2.5 font-sans text-[15px] transition ${on ? "bg-ink text-canvas" : "bg-card ring-1 ring-edge hover:ring-faint"}`;

/** A quick look at a photo before it is sent: too small or too blurry to read is caught on the phone. */
async function checkPhoto(file: File): Promise<string | undefined> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) return undefined;
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
    if (Math.min(img.naturalWidth, img.naturalHeight) < 700) return "This photo is small and may be hard to read.";
    const k = 480 / Math.max(img.naturalWidth, img.naturalHeight);
    const w = Math.round(img.naturalWidth * k), h = Math.round(img.naturalHeight * k);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true }); if (!g) return undefined;
    g.drawImage(img, 0, 0, w, h);
    const px = g.getImageData(0, 0, w, h).data;
    const gray = new Float32Array(w * h);
    for (let i = 0; i < w * h; i++) gray[i] = 0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2];
    // Sharp text has strong edges; a blurred photo has almost none.
    let sum = 0, sq = 0, n = 0;
    for (let y = 1; y < h - 1; y++) for (let x = 1; x < w - 1; x++) {
      const i = y * w + x;
      const l = 4 * gray[i] - gray[i - 1] - gray[i + 1] - gray[i - w] - gray[i + w];
      sum += l; sq += l * l; n++;
    }
    const variance = sq / n - (sum / n) ** 2;
    return variance < 35 ? "This photo looks blurry." : undefined;
  } catch { return undefined; } finally { URL.revokeObjectURL(url); }
}

export default function IntakeFlow({ token, firm, fixed, name, matters, more = false, tracked = false }: { token: string; firm: string; fixed: string | null; name: string | null; matters: Matter[]; more?: boolean; tracked?: boolean }) {
  // More documents for a case already sent: only the documents, then Send.
  const key = `lincoln_intake_${more ? "more_" : ""}${token}`;
  const [s, setS] = useState<Saved>({ step: more ? "documents" : fixed ? "about" : "matter", matter: fixed, answers: name ? { name } : {}, session: null, files: [] });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const pick = useRef<HTMLInputElement>(null);
  const [group, setGroup] = useState<string | null>(null);
  const target = useRef<string>("");

  // Pick up where the client left off on this phone.
  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) { const v = JSON.parse(raw) as Saved; setS({ ...v, matter: fixed ?? v.matter }); } } catch { /* fresh start */ }
  }, [key, fixed]);
  useEffect(() => { try { localStorage.setItem(key, JSON.stringify(s)); } catch { /* not saved */ } }, [key, s]);

  const matter = useMemo(() => matters.find((m) => m.id === s.matter) ?? null, [matters, s.matter]);
  const steps = more ? ["documents"] : [...(fixed ? [] : ["matter"]), "about", "case", "documents", "review"];
  const at = steps.indexOf(s.step);
  const go = (step: string) => { setError(""); setS((o) => ({ ...o, step })); window.scrollTo({ top: 0 }); };
  const set = (id: string, v: string) => setS((o) => ({ ...o, answers: { ...o.answers, [id]: v } }));

  const missing = (fields: Field[]) => fields.some((f) => !f.optional && !(s.answers[f.id] ?? "").trim()) || fields.some((f) => f.kind === "email" && s.answers[f.id] && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.answers[f.id]));
  const next = (fields: Field[], step: string) => { if (missing(fields)) { setError("Answer the questions marked above."); return; } go(step); };

  async function upload(files: FileList | null) {
    const item = target.current;
    if (!files?.length || !item) return;
    setError("");
    for (const file of Array.from(files)) {
      setBusy(item);
      const warn = await checkPhoto(file);
      const body = new FormData();
      body.set("file", file); body.set("item", item);
      const sess = s.session ?? (() => { try { return (JSON.parse(localStorage.getItem(key) ?? "{}") as Saved).session; } catch { return null; } })();
      if (sess) body.set("session", sess);
      try {
        const res = await fetch(`/api/intake/${token}`, { method: "POST", body });
        const out = await res.json().catch(() => ({}));
        if (!res.ok) { setError(out.error ?? "Not added. Try again."); continue; }
        setS((o) => ({ ...o, session: out.session, files: [...o.files, { id: out.id, item, name: file.name, warn }] }));
      } catch { setError("Not added. Check the connection and try again."); }
    }
    setBusy(null);
    if (pick.current) pick.current.value = "";
  }

  async function remove(id: string) {
    setS((o) => ({ ...o, files: o.files.filter((f) => f.id !== id) }));
    void fetch(`/api/intake/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "remove", session: s.session, id }) });
  }

  async function send() {
    if (!matter) return;
    setSending(true); setError("");
    try {
      const res = await fetch(`/api/intake/${token}`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(more ? { action: "more", session: s.session } : { action: "send", session: s.session, matter: matter.id, answers: s.answers }) });
      const out = await res.json().catch(() => ({}));
      if (!res.ok) { setError(out.error ?? "Not sent. Try again."); setSending(false); return; }
      try { localStorage.removeItem(key); } catch { /* fine */ }
      setSent(true); window.scrollTo({ top: 0 });
    } catch { setError("Not sent. Check the connection and try again."); setSending(false); }
  }

  // Plain render functions, not components, so a field keeps its focus while the client types.
  const input = (f: Field) => (
    <div key={f.id} className="flex flex-col gap-2">
      <span className="font-sans text-[14.5px] font-medium">{f.label}{f.optional && <span className="font-normal text-faint"> · optional</span>}</span>
      {f.hint && <span className="-mt-1 font-sans text-[13px] text-faint">{f.hint}</span>}
      {f.kind === "choice" ? (
        <div className="flex flex-wrap gap-2">{f.options!.map((o) => <button key={o} type="button" onClick={() => set(f.id, o)} className={pill(s.answers[f.id] === o)}>{o}</button>)}</div>
      ) : f.kind === "long" ? (
        <textarea rows={4} value={s.answers[f.id] ?? ""} onChange={(e) => set(f.id, e.target.value)} className={`${field} resize-none`} />
      ) : (
        <input type={f.kind === "date" ? "date" : f.kind === "email" ? "email" : f.kind === "tel" ? "tel" : "text"} value={s.answers[f.id] ?? ""} onChange={(e) => set(f.id, e.target.value)} className={field} autoComplete={f.id === "name" ? "name" : f.kind === "email" ? "email" : f.kind === "tel" ? "tel" : "off"} />
      )}
    </div>
  );

  const nav = (onNext: () => void, back?: string, label = "Continue") => (
    <div className="mt-10 flex items-center gap-3">
      <button type="button" onClick={onNext} disabled={sending || !!busy} className="bg-ink px-7 py-3.5 font-sans text-[15.5px] font-medium text-canvas transition hover:opacity-85 disabled:opacity-50">{label}</button>
      {back && <button type="button" onClick={() => go(back)} className="px-4 py-3.5 font-sans text-[15.5px] text-muted transition hover:text-ink">Back</button>}
    </div>
  );

  return (
    <div className="min-h-dvh bg-canvas font-serif text-ink antialiased selection:bg-panel">
      <header className="mx-auto max-w-[620px] px-5 pt-6 md:pt-10">
        <p className="font-sans text-[12.5px] font-medium uppercase tracking-[0.16em] text-faint">{firm}</p>
        {!sent && <div className="mt-4 h-[3px] w-full overflow-hidden bg-line"><div className="h-full bg-ink transition-[width] duration-500" style={{ width: `${((at + 1) / steps.length) * 100}%` }} /></div>}
      </header>

      <main className="mx-auto max-w-[620px] px-5 pb-24 pt-10">
        {sent ? (
          <div>
            <h1 className="text-[40px] font-light leading-[1.05] tracking-[-0.02em]">Thank you.</h1>
            <p className="mt-4 text-[18px] leading-[1.6] text-muted">Everything was sent to {firm}. They will be in touch if anything else is needed.</p>
            {tracked && <a href={`/intake/${token}`} className="mt-9 inline-block bg-ink px-6 py-3.5 font-sans text-[15.5px] font-medium text-canvas transition hover:opacity-85">Your case</a>}
          </div>
        ) : s.step === "matter" ? (
          <>
            {group && <button type="button" onClick={() => setGroup(null)} className="mb-5 font-sans text-[14.5px] text-muted transition hover:text-ink">← All topics</button>}
            <h1 className="text-[34px] font-light leading-[1.08] tracking-[-0.02em] md:text-[40px]">{group ?? "What do you need help with?"}</h1>
            <div className="mt-8 flex flex-col gap-2.5">
              {group
                ? matters.filter((m) => m.group === group).map((m) => (
                  <button key={m.id} type="button" onClick={() => { setS((o) => ({ ...o, matter: m.id })); go("about"); }} className={`px-5 py-4 text-left font-sans text-[16px] transition ${s.matter === m.id ? "bg-ink text-canvas" : "bg-card ring-1 ring-edge hover:ring-faint"}`}>{m.label}</button>
                ))
                : GROUPS.map((g) => (
                  <button key={g} type="button" onClick={() => { setGroup(g); window.scrollTo({ top: 0 }); }} className="flex items-center justify-between gap-3 bg-card px-5 py-4 text-left font-sans text-[16px] ring-1 ring-edge transition hover:ring-faint">
                    <span>{g}</span><span className="text-faint">›</span>
                  </button>
                ))}
            </div>
          </>
        ) : s.step === "about" ? (
          <>
            <h1 className="text-[34px] font-light leading-[1.08] tracking-[-0.02em] md:text-[40px]">About you</h1>
            <div className="mt-8 flex flex-col gap-6">{ABOUT.map(input)}</div>
            {error && <p className="mt-6 font-sans text-[14.5px] text-risk">{error}</p>}
            {nav(() => next(ABOUT, "case"), fixed ? undefined : "matter")}
          </>
        ) : s.step === "case" && matter ? (
          <>
            <h1 className="text-[34px] font-light leading-[1.08] tracking-[-0.02em] md:text-[40px]">{matter.label}</h1>
            <div className="mt-8 flex flex-col gap-6">{matter.questions.map(input)}</div>
            {error && <p className="mt-6 font-sans text-[14.5px] text-risk">{error}</p>}
            {nav(() => next(matter.questions, "documents"), "about")}
          </>
        ) : s.step === "documents" && matter ? (
          <>
            {more && <a href={`/intake/${token}`} className="mb-5 inline-block font-sans text-[14.5px] text-muted transition hover:text-ink">← Your case</a>}
            <h1 className="text-[34px] font-light leading-[1.08] tracking-[-0.02em] md:text-[40px]">{more ? "More documents" : "Your documents"}</h1>
            <p className="mt-3 text-[17px] leading-[1.6] text-muted">A clear photo of each page, or a PDF.</p>
            <input ref={pick} type="file" accept={`image/*,${READABLE}`} multiple className="hidden" onChange={(e) => void upload(e.target.files)} />
            <div className="mt-8 flex flex-col">
              {matter.documents.map((d, i) => {
                const mine = s.files.filter((f) => f.item === d.id);
                return (
                  <div key={d.id} className={`py-5 ${i ? "border-t border-line" : ""}`}>
                    <div className="flex items-start justify-between gap-4">
                      <div className="min-w-0">
                        <p className="font-sans text-[15.5px] font-medium">{d.label}{d.optional && <span className="font-normal text-faint"> · optional</span>}</p>
                        {d.hint && <p className="mt-0.5 font-sans text-[13px] text-faint">{d.hint}</p>}
                      </div>
                      <button type="button" disabled={!!busy} onClick={() => { target.current = d.id; pick.current?.click(); }} className="shrink-0 bg-card px-4 py-2 font-sans text-[14px] font-medium ring-1 ring-edge transition hover:ring-faint disabled:opacity-50">
                        {busy === d.id ? "Adding" : mine.length ? "Add more" : "Add"}
                      </button>
                    </div>
                    {mine.length > 0 && (
                      <ul className="mt-3 flex flex-col gap-2">
                        {mine.map((f) => (
                          <li key={f.id} className="bg-card px-4 py-3 font-sans text-[14px] ring-1 ring-line">
                            <div className="flex items-center justify-between gap-3"><span className="min-w-0 truncate">{f.name}</span><button type="button" onClick={() => void remove(f.id)} className="shrink-0 text-[13px] text-faint hover:text-ink">Remove</button></div>
                            {f.warn && <p className="mt-1.5 text-[13px] text-risk">{f.warn} <button type="button" onClick={() => { void remove(f.id); target.current = f.item; pick.current?.click(); }} className="font-medium underline underline-offset-2">Take another</button></p>}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                );
              })}
            </div>
            {error && <p className="mt-6 font-sans text-[14.5px] text-risk">{error}</p>}
            {more ? nav(() => { if (!s.files.length) { setError("Add a document first."); return; } void send(); }, undefined, sending ? "Sending" : "Send") : nav(() => go("review"), "case")}
          </>
        ) : s.step === "review" && matter ? (
          <>
            <h1 className="text-[34px] font-light leading-[1.08] tracking-[-0.02em] md:text-[40px]">Check and send</h1>
            <div className="mt-8 flex flex-col">
              {[["Matter", matter.label], ["Name", s.answers.name ?? ""], ["Email", s.answers.email ?? ""], ["Documents", `${s.files.length}`]].map(([a, b], i) => (
                <div key={a} className={`flex justify-between gap-4 py-4 font-sans text-[15px] ${i ? "border-t border-line" : ""}`}><span className="text-faint">{a}</span><span className="text-right">{b}</span></div>
              ))}
            </div>
            {matter.documents.filter((d) => !d.optional && !s.files.some((f) => f.item === d.id)).length > 0 && (
              <p className="mt-5 font-sans text-[14px] leading-[1.6] text-faint">Not added yet: {matter.documents.filter((d) => !d.optional && !s.files.some((f) => f.item === d.id)).map((d) => d.label).join("; ")}. The firm may ask you for them.</p>
            )}
            {error && <p className="mt-6 font-sans text-[14.5px] text-risk">{error}</p>}
            {nav(() => void send(), "documents", sending ? "Sending" : "Send")}
          </>
        ) : null}
      </main>
    </div>
  );
}
