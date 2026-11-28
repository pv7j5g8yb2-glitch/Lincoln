import type { Metadata } from "next";
import StartForm from "@/components/landing/StartForm";
import "../welcome/landing.css";

// Pitch black browser bar to match the page, in light and dark mode alike.
export const viewport = { themeColor: "#000000" };

export const metadata: Metadata = { title: "Get In Touch", description: "Tell us about your firm. We reply by email with a quote within 48 hours.", alternates: { canonical: "https://uselincoln.com/start" }, robots: { index: true, follow: true } };

export default function Start() {
  return <StartForm />;
}
