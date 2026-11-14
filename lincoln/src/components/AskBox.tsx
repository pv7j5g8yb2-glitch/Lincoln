"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import Composer from "./Composer";
import { startCase } from "@/lib/actions";

/** Home's box. A question opens the chat; files (with or without words) are handed to Lincoln as work. */
export default function AskBox() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const send = (files: File[]) => {
    const t = text.trim();
    if (!files.length) { router.push(`/assistant?q=${encodeURIComponent(t)}`); return; }
    const fd = new FormData();
    fd.set("text", t);
    files.forEach((f) => fd.append("file", f));
    start(() => startCase(fd));
  };
  return <Composer value={text} onChange={setText} onSend={send} busy={pending} autoFocus />;
}
