import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";
import "./landing.css";

// A draft of the public landing page, open at /welcome for review but kept out of search until it is approved.
// The link card on WhatsApp, iMessage, LinkedIn and the rest: the wordmark, the name and one short line.
const LINE = "Lincoln is the platform built to meet the standards of the United States' leading immigration firms.";
export const metadata: Metadata = {
  metadataBase: new URL("https://uselincoln.com"),
  title: { absolute: "Lincoln | Legal AI" },
  description: LINE,
  openGraph: { type: "website", url: "https://uselincoln.com", siteName: "Lincoln", title: "Lincoln | Legal AI", description: LINE, images: [{ url: "/og.png", width: 1200, height: 630, alt: "Lincoln" }] },
  twitter: { card: "summary_large_image", title: "Lincoln | Legal AI", description: LINE, images: ["/og.png"] },
  robots: { index: false, follow: false },
};

export default function Welcome() {
  return <Landing />;
}
