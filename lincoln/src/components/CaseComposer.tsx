"use client";

import { useState, useTransition } from "react";
import Composer from "./Composer";
import { startCase } from "@/lib/actions";

/** One box: what the case is, and the client's files if there are any. Lincoln opens and works it. */
export default function CaseComposer() {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const send = (files: File[]) => {
    const fd = new FormData();
    fd.set("text", text.trim());
    files.forEach((f) => fd.append("file", f));
    start(() => startCase(fd));
  };
  return <Composer value={text} onChange={setText} onSend={send} busy={pending} placeholder="Describe the case or attach files" autoFocus />;
}
