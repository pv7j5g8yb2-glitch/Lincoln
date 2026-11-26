"use client";

import { useState, useTransition } from "react";
import { setMemberRole } from "@/lib/actions";
import { notify } from "./Toaster";

/** An admin's control for someone's role at the firm. Saves on change. */
export default function RoleSelect({ userId, role, roles }: { userId: string; role: string; roles: string[] }) {
  const [value, setValue] = useState(role);
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Role"
      value={value}
      disabled={pending}
      onChange={(e) => {
        const next = e.target.value, before = value;
        setValue(next);
        start(async () => {
          const r = await setMemberRole(userId, next);
          if ("error" in r) { setValue(before); notify(r.error ?? "Not changed"); } else notify("Saved");
        });
      }}
      className="h-8 shrink-0 border border-line bg-card px-2 text-[12.5px] text-ink outline-none focus:border-ink disabled:opacity-50"
    >
      {[...new Set([...roles, role])].map((r) => <option key={r} value={r}>{r}</option>)}
    </select>
  );
}
