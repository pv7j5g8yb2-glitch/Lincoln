"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Composer from "./Composer";
import { notify } from "./Toaster";
import { startCase } from "@/lib/actions";

// Case files, plus an old system's case list (CSV or Excel) or a zip of client folders, for moving to Lincoln.
const ACCEPT = "application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic,.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document,.csv,text/csv,.xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,.zip,application/zip";
const isImport = (f: File) => /\.(csv|xlsx|zip)$/i.test(f.name);

/** One box: what the case is, and the client's files if there are any. Lincoln opens and works it. */
export default function CaseComposer() {
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const router = useRouter();
  const send = (files: File[]) => start(async () => {
    const imports = files.filter(isImport), rest = files.filter((f) => !isImport(f));
    if (imports.length) {
      let opened = 0, folders = 0;
      for (const f of imports) {
        const res = await fetch(`/api/import?name=${encodeURIComponent(f.name)}`, { method: "POST", body: f }).catch(() => null);
        const out = res ? await res.json().catch(() => ({})) : {};
        if (!res?.ok) { notify(out.error ?? "Not imported"); return; }
        opened += out.created ?? 0; folders += out.folders ?? 0;
      }
      const said = [opened || !folders ? (opened === 1 ? "1 case" : `${opened} cases`) : "", folders ? (folders === 1 ? "1 folder" : `${folders} folders`) : ""].filter(Boolean).join(", ");
      if (!rest.length && !text.trim()) { notify(`${said} imported`); router.push("/cases"); return; }
    }
    const fd = new FormData();
    fd.set("text", text.trim());
    rest.forEach((f) => fd.append("file", f));
    await startCase(fd);
  });
  return <Composer value={text} onChange={setText} onSend={send} busy={pending} placeholder="Describe the case or attach files" accept={ACCEPT} autoFocus />;
}
