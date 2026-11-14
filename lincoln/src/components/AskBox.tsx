"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Composer from "./Composer";
import { startCase } from "@/lib/actions";

/**
 * The ask box on Home and on each case. A question opens the chat; files (with or without words) are
 * handed to Lincoln as work, on the case when there is one.
 */
export default function AskBox({ caseId, placeholder }: { caseId?: string; placeholder?: string }) {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const send = (files: File[]) => {
    const t = text.trim();
    if (!files.length) { router.push(`/assistant?${caseId ? `case=${encodeURIComponent(caseId)}&` : ""}q=${encodeURIComponent(t)}`); return; }
    const fd = new FormData();
    fd.set("text", t);
    if (caseId) fd.set("case", caseId);
    files.forEach((f) => fd.append("file", f));
    start(() => startCase(fd));
  };
  return <Composer value={text} onChange={setText} onSend={send} busy={pending} placeholder={placeholder} autoFocus={!caseId} />;
}
