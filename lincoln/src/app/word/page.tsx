import type { Metadata } from "next";
import Script from "next/script";
import Toaster from "@/components/Toaster";
import WordPane from "@/components/word/WordPane";

export const metadata: Metadata = { title: "Lincoln", robots: { index: false, follow: false } };

// The Word add-in's task pane. Office.js replaces the browser's history functions with null; they are kept here
// first and put back once it has loaded, so the page keeps working.
const KEEP = "window.__hist={p:history.pushState,r:history.replaceState};";
const BACK = "if(window.__hist){history.pushState=history.pushState||window.__hist.p;history.replaceState=history.replaceState||window.__hist.r;}";

export default function WordPage() {
  return (
    <>
      <Script id="keep-history" strategy="beforeInteractive">{KEEP}</Script>
      <Script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" strategy="afterInteractive" />
      <Script id="restore-history" strategy="afterInteractive">{`(function w(){ if (window.Office) { ${BACK} } else setTimeout(w, 50); })();`}</Script>
      <WordPane />
      <Toaster />
    </>
  );
}
