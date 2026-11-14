"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import clsx from "clsx";
import { Check, FileText } from "lucide-react";
import { acceptAllRecommended, answerQuestion, decideApproval } from "@/lib/actions";
import type { Question } from "@/lib/halasz";

type Props = {
  id: string;
  caseId: string;
  kind: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload: any;
  message?: { party: string; party_role: string | null; subject: string; body: string } | null;
};

const box = "rounded-xl border border-line bg-card";

export default function ApprovalPanel({ id, caseId, kind, payload, message }: Props) {
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [subject, setSubject] = useState(message?.subject ?? "");
  const [body, setBody] = useState(message?.body ?? "");
  const decide = (d: "approved" | "rejected") =>
    start(async () => {
      setError(null);
      try {
        await decideApproval(id, d, kind === "message" && message ? { subject, body } : undefined);
      } catch (e) {
        setError(e instanceof Error ? e.message : "The action failed. Nothing was changed.");
      }
    });

  const footer = (text: string, disabled = false) => (
    <div className="sticky bottom-0 mt-6 flex flex-wrap items-center gap-2 border-t border-line bg-card/95 py-3 backdrop-blur">
      <button disabled={pending || disabled} onClick={() => decide("approved")} className="flex h-9 items-center gap-1.5 rounded-lg bg-ink px-4 text-[13px] font-medium text-canvas transition hover:opacity-90 active:scale-[0.98] disabled:opacity-35">
        <Check size={14} /> {text}
      </button>
      <button disabled={pending} onClick={() => decide("rejected")} className="h-9 rounded-lg border border-line bg-card px-3.5 text-[13px] font-medium transition hover:bg-panel disabled:opacity-40">{kind === "message" ? "Discard" : "Return"}</button>
      {error && <span className="text-[12.5px] text-risk">{error}</span>}
    </div>
  );

  if (kind === "decisions") {
    const qs = payload.questions as Question[];
    const done = qs.filter((q) => q.answer).length;
    return (
      <div>
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="h-[3px] w-24 overflow-hidden rounded-full bg-line"><div className="h-full rounded-full bg-ink transition-all" style={{ width: `${(done / qs.length) * 100}%` }} /></div>
            <span className="text-[12.5px] text-muted">{done} of {qs.length}</span>
          </div>
          {done < qs.length && <button disabled={pending} onClick={() => start(() => acceptAllRecommended(id))} className="h-8 rounded-lg border border-line bg-card px-3 text-[12.5px] font-medium transition hover:bg-panel">Accept recommendations</button>}
        </div>
        <ol className="border-t border-line">
          {qs.map((q, i) => (
            <li key={q.id} className="border-b border-line py-5">
              <div className="mb-1 text-[12px] text-faint">{i + 1} · {q.topic}</div>
              <p className="mb-2 text-[14.5px] font-medium leading-snug">{q.q}</p>
              <ul className="mb-2.5 flex flex-col gap-0.5">
                {q.evidence.map((e, k) => (
                  <li key={k} className="text-[13px] leading-relaxed text-muted">
                    {e.t}{e.page && <a href={`/api/pages/${caseId}/${e.page}`} target="_blank" className="ml-1.5 whitespace-nowrap text-[12px] underline decoration-line underline-offset-4 hover:text-ink hover:decoration-ink">p. {e.page}</a>}
                  </li>
                ))}
              </ul>
              <p className="mb-3 text-[13px] leading-relaxed"><span className="font-medium">Recommended: {q.recommend === "yes" ? "Yes" : "No"}.</span> <span className="text-muted">{q.why}</span></p>
              <div className="inline-flex rounded-lg border border-line p-0.5">
                {(["yes", "no", "change"] as const).map((a) => (
                  <button key={a} disabled={pending} onClick={() => start(() => answerQuestion(id, q.id, a))} className={clsx("h-7 rounded-md px-3.5 text-[12.5px] font-medium transition", q.answer === a ? "bg-ink text-canvas" : "text-muted hover:text-ink")}>
                    {a === "yes" ? "Yes" : a === "no" ? "No" : "More evidence"}
                  </button>
                ))}
              </div>
            </li>
          ))}
        </ol>
        {footer("Confirm and draft", done < qs.length)}
      </div>
    );
  }

  if (kind === "message" && message) {
    return (
      <div>
        <div className={box}>
          <div className="border-b border-line px-5 py-3 text-[13px]">
            <div className="flex gap-3"><span className="w-14 text-faint">To</span><span>{message.party} <span className="text-faint">{message.party_role}</span></span></div>
            <div className="flex items-center gap-3"><span className="w-14 shrink-0 text-faint">Subject</span><input value={subject} onChange={(e) => setSubject(e.target.value)} aria-label="Subject" className="min-w-0 flex-1 bg-transparent font-medium outline-none" /></div>
          </div>
          <textarea value={body} onChange={(e) => setBody(e.target.value)} aria-label="Message" rows={Math.min(30, Math.max(8, body.split("\n").length + 2))} className="block w-full resize-y bg-transparent px-5 py-5 text-[13.5px] leading-relaxed outline-none" />
        </div>
        {footer("Approve and send")}
      </div>
    );
  }

  if (kind === "draft_review") {
    return (
      <div>
        <Link href={`/cases/${caseId}?tab=drafts${payload?.draftId ? `&draft=${payload.draftId}` : ""}`} className={clsx(box, "flex items-center gap-3 px-4 py-4 transition hover:border-ink")}>
          <FileText size={18} className="text-muted" />
          <span className="flex-1 text-[14px] font-medium">Open draft</span>
        </Link>
        {footer("Approve")}
      </div>
    );
  }

  return null;
}
