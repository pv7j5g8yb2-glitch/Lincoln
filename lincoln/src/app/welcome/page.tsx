import type { Metadata } from "next";
import Landing from "@/components/landing/Landing";
import { ALSO, LINE, NAME, PROFILES, SITE, SUMMARY } from "@/lib/seo/site";
import "./landing.css";

// Pitch black browser bar to match the page, in light and dark mode alike.
export const viewport = { themeColor: "#000000" };

// The public landing page (uselincoln.com). Open to search engines and AI search since 2026-11-25 (Ismael).
// The link card on WhatsApp, iMessage, LinkedIn and the rest: the wordmark, the name and one short line.
export const metadata: Metadata = {
  metadataBase: new URL("https://uselincoln.com"),
  title: { absolute: "Lincoln | Legal AI" },
  description: LINE,
  openGraph: { type: "website", url: "https://uselincoln.com", siteName: "Lincoln", title: "Lincoln | Legal AI", description: LINE, images: [{ url: "/og.png", width: 1200, height: 630, alt: "Lincoln" }] },
  twitter: { card: "summary_large_image", title: "Lincoln | Legal AI", description: LINE, images: ["/og.png"] },
  alternates: { canonical: `${SITE}/` },
  robots: { index: true, follow: true },
};

/** Who Lincoln is, in the terms search engines use: the site's name, the company and the product. */
const DATA = {
  "@context": "https://schema.org",
  "@graph": [
    { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: NAME, alternateName: ALSO, publisher: { "@id": `${SITE}/#organization` } },
    { "@type": "Organization", "@id": `${SITE}/#organization`, name: NAME, alternateName: ALSO, url: `${SITE}/`, logo: `${SITE}/icon-512.png`, description: SUMMARY, email: "hello@uselincoln.com", sameAs: PROFILES },
    { "@type": "SoftwareApplication", "@id": `${SITE}/#software`, name: NAME, alternateName: ALSO, url: `${SITE}/`, applicationCategory: "BusinessApplication", applicationSubCategory: "Legal AI", operatingSystem: "Web, iOS, Android", description: SUMMARY, audience: { "@type": "BusinessAudience", audienceType: "US immigration law firms" }, publisher: { "@id": `${SITE}/#organization` } },
  ],
};

export default function Welcome() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(DATA).replace(/</g, "\\u003c") }} />
      <Landing />
    </>
  );
}
