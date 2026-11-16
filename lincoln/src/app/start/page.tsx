import type { Metadata } from "next";
import StartForm from "@/components/landing/StartForm";
import "../welcome/landing.css";

export const metadata: Metadata = { title: "Get started · Lincoln", description: "Tell us about your firm.", robots: { index: false, follow: false } };

export default function Start() {
  return <StartForm />;
}
