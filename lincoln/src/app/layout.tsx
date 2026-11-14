import type { Metadata, Viewport } from "next";
import "@fontsource-variable/inter";
import "@fontsource-variable/literata";
import "./globals.css";

export const metadata: Metadata = {
  title: "Lincoln",
  applicationName: "Lincoln",
  appleWebApp: { capable: true, title: "Lincoln", statusBarStyle: "default" },
  description: "Lincoln runs immigration cases for law firms. A licensed attorney reviews and signs everything.",
  robots: { index: false, follow: false },
};
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  colorScheme: "light dark",
  themeColor: [{ media: "(prefers-color-scheme: light)", color: "#ffffff" }, { media: "(prefers-color-scheme: dark)", color: "#0e0e0e" }],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Restores the sidebar state before the first paint, so it never jumps. */}
        <script dangerouslySetInnerHTML={{ __html: `try{if(localStorage.getItem("lincoln.sidebar")==="closed")document.documentElement.dataset.sidebar="closed"}catch(e){}` }} />
      </head>
      <body>{children}</body>
    </html>
  );
}
