"use client";

import { useState, useTransition } from "react";
import { setAutomation } from "@/lib/actions";
import { notify } from "./Toaster";
import { choice } from "./ui";

/** Automatic (Lincoln does it and says nothing) or Approval (it waits in Review and the device is notified). Saves on change. */
export default function AutoSelect({ rule, value: initial, disabled }: { rule: string; value: "auto" | "approval"; disabled?: boolean }) {
  const [value, setValue] = useState(initial);
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Automation"
      value={value}
      disabled={pending || disabled}
      onChange={(e) => {
        const next = e.target.value as "auto" | "approval", before = value;
        setValue(next);
        start(async () => {
          const r = await setAutomation(rule, next);
          if ("error" in r) { setValue(before); notify(r.error ?? "Not changed"); } else notify("Saved");
        });
      }}
      className={choice}
    >
      <option value="auto">Automatic</option>
      <option value="approval">Approval</option>
    </select>
  );
}
