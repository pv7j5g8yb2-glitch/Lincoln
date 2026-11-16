"use client";

import { useState, useTransition } from "react";
import { setMemberAdmin } from "@/lib/actions";
import { notify } from "./Toaster";

/** An admin's switch for whether someone at the firm is an admin. Saves on change. */
export default function AdminSwitch({ userId, on }: { userId: string; on: boolean }) {
  const [value, setValue] = useState(on);
  const [pending, start] = useTransition();
  return (
    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-[12.5px] text-muted">
      <span>Admin</span>
      <button
        type="button"
        role="switch"
        aria-checked={value}
        aria-label="Admin"
        disabled={pending}
        onClick={() => {
          const next = !value;
          setValue(next);
          start(async () => {
            const r = await setMemberAdmin(userId, next);
            if ("error" in r) { setValue(!next); notify(r.error ?? "Not changed"); } else notify("Saved");
          });
        }}
        className={`relative h-[22px] w-[38px] rounded-full transition disabled:opacity-50 ${value ? "bg-ink" : "bg-line"}`}
      >
        <span className={`absolute top-[3px] h-4 w-4 rounded-full bg-canvas shadow transition-all ${value ? "left-[19px]" : "left-[3px]"}`} />
      </button>
    </label>
  );
}
