"use client";

import { useState } from "react";
import { field } from "./AuthShell";

/** Password with a minimum length. The rule shows, in red, only after a too short attempt. */
export default function PasswordInput({ name = "password", autoComplete = "new-password", placeholder = "10 characters min." }: { name?: string; autoComplete?: string; placeholder?: string }) {
  const [short, setShort] = useState(false);
  return (
    <>
      <input
        name={name}
        type="password"
        required
        minLength={10}
        autoComplete={autoComplete}
        placeholder={placeholder}
        className={field}
        onInvalid={(e) => { e.preventDefault(); setShort(true); }}
        onChange={(e) => short && e.target.value.length >= 10 && setShort(false)}
      />
      {short && <span className="mt-1.5 block text-[12px] text-risk">The password needs at least 10 characters.</span>}
    </>
  );
}
