"use client";

import { useEffect, useState } from "react";

/** Good morning (5:00 to 11:59), afternoon (12:00 to 19:59) or evening (20:00 to 4:59), by the device's own clock. */
export function partOfDay(h: number) {
  return h >= 5 && h < 12 ? "morning" : h >= 12 && h < 20 ? "afternoon" : "evening";
}

export default function Greeting({ name }: { name: string }) {
  // Only the device knows its time zone, so the greeting is chosen in the browser and checked every minute.
  const [part, setPart] = useState<string | null>(null);
  useEffect(() => {
    const on = () => setPart(partOfDay(new Date().getHours()));
    on();
    const t = setInterval(on, 60_000);
    return () => clearInterval(t);
  }, []);
  return (
    <h1 className={`text-center font-serif text-[32px] font-light leading-tight tracking-[-0.02em] transition-opacity duration-500 md:text-[40px] ${part ? "opacity-100" : "opacity-0"}`}>
      Good {part ?? "morning"}, {name}
    </h1>
  );
}
