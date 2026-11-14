/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["better-sqlite3-multiple-ciphers", "pdfjs-dist", "@napi-rs/canvas", "exceljs", "pptxgenjs"],
  experimental: { serverActions: { bodySizeLimit: "30mb" } },
  poweredByHeader: false,
  devIndicators: false,
  async rewrites() {
    return [{ source: "/.well-known/microsoft-identity-association.json", destination: "/api/ms-identity" }];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Only Lincoln's own code, styles and images run here; nothing may frame it; forms post only to Lincoln.
          { key: "Content-Security-Policy", value: "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'; object-src 'none'" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "same-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(self), geolocation=(), payment=(), usb=()" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};
export default nextConfig;
