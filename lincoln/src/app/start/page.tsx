import type { Metadata } from "next";
import StartForm from "@/components/landing/StartForm";
import "../welcome/landing.css";

export const metadata: Metadata = { title: "Get In Touch · Lincoln", description: "Tell us about your firm. We reply by email with a quote within 48 hours.", alternates: { canonical: "https://uselincoln.com/start" }, robots: { index: true, follow: true } };

export default function Start() {
  return <StartForm />;
}
