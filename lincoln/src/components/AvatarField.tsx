"use client";

import { useRef, useState } from "react";
import { Avatar } from "./ui";

/** Picks a photo, crops it to a 256 px square in the browser and submits it with the form. */
export default function AvatarField({ initials, current }: { initials: string; current: string | null }) {
  const [value, setValue] = useState("");
  const [preview, setPreview] = useState<string | null>(current);
  const [error, setError] = useState(false);
  const input = useRef<HTMLInputElement>(null);

  function pick(file: File | undefined) {
    if (!file) return;
    setError(false);
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const side = Math.min(img.width, img.height);
      const c = document.createElement("canvas");
      c.width = c.height = 256;
      c.getContext("2d")!.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, 256, 256);
      const data = c.toDataURL("image/jpeg", 0.86);
      URL.revokeObjectURL(url);
      setValue(data);
      setPreview(data);
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      setError(true);
    };
    img.src = url;
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar initials={initials} src={preview} size={64} />
      <input type="hidden" name="avatar" value={value} />
      <input ref={input} type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => pick(e.target.files?.[0])} />
      <div className="flex flex-col gap-1">
        <div className="flex gap-2">
          <button type="button" onClick={() => input.current?.click()} className="h-8 rounded-lg border border-line bg-card px-3 text-[12.5px] font-medium transition hover:bg-panel">Upload photo</button>
          {preview && <button type="button" onClick={() => { setValue("remove"); setPreview(null); }} className="h-8 rounded-lg px-2.5 text-[12.5px] text-muted transition hover:bg-panel hover:text-ink">Remove</button>}
        </div>
        <span className={error ? "text-[12px] text-risk" : "text-[12px] text-faint"}>{error ? "The image could not be read" : ""}</span>
      </div>
    </div>
  );
}
