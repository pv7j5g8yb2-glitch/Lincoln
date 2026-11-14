import clsx from "clsx";
import type { ReactNode } from "react";

type Tone = "neutral" | "ok" | "warn" | "risk" | "ink";

/** A quiet label. Tone is accepted for older callers; only "ink" changes the look. */
export function Chip({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return <span className={clsx("inline-flex items-center gap-1 whitespace-nowrap rounded-[5px] px-1.5 py-[1px] text-[11.5px] font-medium", tone === "ink" ? "bg-ink text-canvas" : "bg-panel text-muted", className)}>{children}</span>;
}

export function Dot({ tone = "neutral" }: { tone?: Tone }) {
  return <span className={clsx("inline-block h-1.5 w-1.5 shrink-0 rounded-full", tone === "neutral" ? "bg-faint" : "bg-ink")} />;
}

export function Avatar({ initials, src, size = 22 }: { initials: string; src?: string | null; size?: number }) {
  if (src) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={src} alt="" width={size} height={size} className="shrink-0 rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-ink font-medium text-canvas" style={{ width: size, height: size, fontSize: Math.max(9, size * 0.4) }}>
      {initials}
    </span>
  );
}

export function PageHead({ title, sub, right }: { title: ReactNode; sub?: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-7 flex flex-wrap items-center justify-between gap-3">
      <div className="min-w-0">
        <h1 className="serif text-[24px] font-medium leading-tight">{title}</h1>
        {sub && <p className="mt-1 text-[13px] text-muted">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={clsx("rounded-xl border border-line bg-card", className)}>{children}</div>;
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h2 className="text-[12.5px] font-medium text-muted">{children}</h2>
      {right}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="border-y border-line py-10 text-center text-[13px] text-faint">{children}</div>;
}

export const btn = {
  primary: "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg bg-ink px-3.5 text-[13px] font-medium text-canvas transition hover:opacity-90 active:scale-[0.98] disabled:opacity-40",
  secondary: "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg border border-line bg-card px-3.5 text-[13px] font-medium text-ink transition hover:bg-panel active:scale-[0.98] disabled:opacity-40",
  ghost: "inline-flex h-9 items-center justify-center gap-1.5 whitespace-nowrap rounded-lg px-2.5 text-[13px] font-medium text-muted transition hover:bg-panel hover:text-ink",
};
export const field = "h-10 w-full rounded-lg border border-line bg-card px-3 text-[13.5px] outline-none transition placeholder:text-faint focus:border-ink";
export const label = "mb-1.5 block text-[12.5px] font-medium text-muted";

export const STAGES = ["Intake", "Evidence", "Strategy", "Drafting", "Review", "Filed", "Decision"];

export function StageBar({ stage }: { stage: string }) {
  const i = Math.max(0, STAGES.indexOf(stage));
  return (
    <ol className="flex items-center gap-5 overflow-x-auto text-[12.5px]">
      {STAGES.map((s, k) => (
        <li key={s} className={clsx("whitespace-nowrap border-b pb-1.5", k === i ? "border-ink font-medium text-ink" : "border-transparent", k < i && "text-muted", k > i && "text-faint")}>{s}</li>
      ))}
    </ol>
  );
}

export function stateTone(state: string): Tone {
  return state === "needs_you" ? "ink" : "neutral";
}
export function stateLabel(state: string) {
  return state === "needs_you" ? "For review" : state === "moving" ? "In progress" : state === "waiting" ? "Awaiting others" : "Filed";
}
