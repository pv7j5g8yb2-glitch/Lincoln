import type { Metadata } from "next";
import Script from "next/script";
import Toaster from "@/components/Toaster";
import OutlookPane from "@/components/outlook/OutlookPane";

export const metadata: Metadata = { title: { absolute: "Lincoln" }, robots: { index: false, follow: false } };

// The Outlook add-in's pane. Office.js replaces the browser's history functions with null; they are kept first and
// put back once it has loaded, as in the Word pane.
const KEEP = "window.__hist={p:history.pushState,r:history.replaceState};";
const BACK = "if(window.__hist){history.pushState=history.pushState||window.__hist.p;history.replaceState=history.replaceState||window.__hist.r;}";

export default function OutlookPage() {
  return (
    <>
      <Script id="keep-history" strategy="beforeInteractive">{KEEP}</Script>
      <Script src="https://appsforoffice.microsoft.com/lib/1/hosted/office.js" strategy="afterInteractive" />
      <Script id="restore-history" strategy="afterInteractive">{`(function w(){ if (window.Office) { ${BACK} } else setTimeout(w, 50); })();`}</Script>
      <OutlookPane />
      <Toaster />
    </>
  );
}
