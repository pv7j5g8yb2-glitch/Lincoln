"use client";

import { useRef, useState } from "react";
import clsx from "clsx";
import { FileText, Upload, X } from "lucide-react";

export default function FileDrop() {
  const input = useRef<HTMLInputElement>(null);
  const [file, setFile] = useState<{ name: string; size: number } | null>(null);
  const [over, setOver] = useState(false);
  const set = (list: FileList | null) => {
    const fs = Array.from(list ?? []);
    setFile(fs.length ? { name: fs.length === 1 ? fs[0].name : `${fs.length} files`, size: fs.reduce((s, f) => s + f.size, 0) } : null);
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setOver(false);
        if (input.current && e.dataTransfer.files.length) {
          input.current.files = e.dataTransfer.files;
          set(e.dataTransfer.files);
        }
      }}
      className={clsx("rounded-lg border border-dashed transition", over ? "border-ink bg-side" : "border-edge")}
    >
      <input ref={input} type="file" name="file" multiple accept="application/pdf,image/jpeg,image/png,image/webp,image/heic,image/heif,.heic" className="hidden" onChange={(e) => set(e.target.files)} />
      {file ? (
        <div className="flex items-center gap-3 px-3.5 py-3">
          <FileText size={16} className="shrink-0 text-muted" />
          <span className="min-w-0 flex-1"><span className="block truncate text-[13px]">{file.name}</span><span className="block text-[12px] text-faint">{(file.size / 1048576).toFixed(1)} MB</span></span>
          <button type="button" aria-label="Remove file" onClick={() => { if (input.current) input.current.value = ""; setFile(null); }} className="rounded-md p-1 text-faint transition hover:bg-panel hover:text-ink"><X size={15} /></button>
        </div>
      ) : (
        <button type="button" onClick={() => input.current?.click()} className="flex w-full items-center justify-center gap-2 px-4 py-3 text-[13px] text-muted transition hover:text-ink">
          <Upload size={15} />
          Choose files
        </button>
      )}
    </div>
  );
}
