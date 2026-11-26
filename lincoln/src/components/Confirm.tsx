"use client";

import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";

// The one confirmation box for important actions: "Are you sure?", Yes (black in light mode, white in dark) and an
// always red No. Sensitive actions also ask for the account password, which the server checks.

type Result = false | { password?: string };

function Box({ password, done }: { password: boolean; done: (r: Result) => void }) {
  const [value, setValue] = useState("");
  const input = useRef<HTMLInputElement>(null);
  const yes = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    (password ? input.current : yes.current)?.focus();
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") done(false); };
    window.addEventListener("keydown", key);
    return () => window.removeEventListener("keydown", key);
  }, [password, done]);
  const ok = () => { if (password && !value) { input.current?.focus(); return; } done(password ? { password: value } : {}); };
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 p-6 backdrop-blur-[2px]" onMouseDown={(e) => { if (e.target === e.currentTarget) done(false); }}>
      <form role="alertdialog" aria-modal="true" aria-labelledby="confirm-title" onSubmit={(e) => { e.preventDefault(); ok(); }} className="rise w-full max-w-[300px] border border-line bg-card p-5 text-ink shadow-[0_24px_60px_-20px_rgba(0,0,0,0.45)]">
        <h2 id="confirm-title" className="text-center text-[17px] font-medium">Are you sure?</h2>
        {password && <input ref={input} type="password" value={value} onChange={(e) => setValue(e.target.value)} autoComplete="current-password" placeholder="Password" className="mt-4 h-11 w-full border border-line bg-canvas px-3 text-[15px] outline-none transition placeholder:text-faint focus:border-ink" />}
        <div className="mt-5 grid grid-cols-2 gap-2.5">
          <button ref={yes} type="submit" className="h-11 bg-ink text-[15px] font-medium text-canvas transition hover:opacity-90 active:scale-[0.98]">Yes</button>
          <button type="button" onClick={() => done(false)} className="h-11 bg-[#d92d20] text-[15px] font-medium text-white transition hover:opacity-90 active:scale-[0.98]">No</button>
        </div>
      </form>
    </div>
  );
}

/** Asks before an important action. Resolves false for No, or an object (with the password when asked for). */
export function confirmBox(opts: { password?: boolean } = {}): Promise<Result> {
  return new Promise((resolve) => {
    const host = document.createElement("div");
    document.body.appendChild(host);
    const root = createRoot(host);
    const done = (r: Result) => { resolve(r); setTimeout(() => { root.unmount(); host.remove(); }, 0); };
    root.render(<Box password={Boolean(opts.password)} done={done} />);
  });
}

/**
 * A form's submit button that asks first. With password, the password goes in as "confirm_password". With
 * passwordIf, the password is asked only when that checkbox in the form is ticked; askIf does the same for the box.
 */
export function ConfirmButton({ children, className, password, passwordIf, askIf, name, value, disabled }: { children: React.ReactNode; className?: string; password?: boolean; passwordIf?: string; askIf?: string; name?: string; value?: string; disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      className={className}
      onClick={async (e) => {
        const form = e.currentTarget.form;
        if (!form) return;
        const ticked = (n: string) => Boolean((form.elements.namedItem(n) as HTMLInputElement | null)?.checked);
        if (askIf && !ticked(askIf)) { form.requestSubmit(); return; }
        const needs = password || (passwordIf ? ticked(passwordIf) : false);
        const r = await confirmBox({ password: needs });
        if (!r) return;
        form.querySelectorAll("input[data-confirm]").forEach((x) => x.remove());
        const add = (k: string, v: string) => { const i = document.createElement("input"); i.type = "hidden"; i.name = k; i.value = v; i.dataset.confirm = "1"; form.appendChild(i); };
        if (r.password !== undefined) add("confirm_password", r.password);
        if (name) add(name, value ?? "");
        form.requestSubmit();
      }}
    >
      {children}
    </button>
  );
}
