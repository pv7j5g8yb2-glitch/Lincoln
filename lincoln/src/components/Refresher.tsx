"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

/** Reloads the page data on an interval while background work is running. */
export default function Refresher({ every = 4000 }: { every?: number }) {
  const router = useRouter();
  useEffect(() => {
    const t = setInterval(() => router.refresh(), every);
    return () => clearInterval(t);
  }, [router, every]);
  return null;
}
