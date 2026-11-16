import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";
import "./landing.css";

// A draft of the public landing page, open at /welcome for review but kept out of search until it is approved.
export const metadata: Metadata = { title: "Lincoln", description: "Immigration work, done before you ask.", robots: { index: false, follow: false } };

export default function Welcome() {
  return <Landing />;
}
