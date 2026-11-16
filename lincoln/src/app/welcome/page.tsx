import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Landing from "@/components/landing/Landing";
import "./landing.css";

export const metadata: Metadata = { title: "Lincoln", description: "Immigration work, done before you ask." };

// A draft of the public landing page. Hidden on the live site until Ismael approves it; a local preview sets
// LANDING_PREVIEW=1.
export default function Welcome() {
  if (!process.env.LANDING_PREVIEW) notFound();
  return <Landing />;
}
