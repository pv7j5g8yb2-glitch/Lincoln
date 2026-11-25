import { MAIN_HOST, PUBLIC_PAGES, SITE, hostOf } from "@/lib/seo/site";

// The public pages, for search engines. Only on uselincoln.com.
export function GET(req: Request) {
  if (hostOf(req.headers) !== MAIN_HOST) return new Response("Not found", { status: 404 });
  const day = new Date().toISOString().slice(0, 10);
  const urls = PUBLIC_PAGES.map((p) => `  <url><loc>${SITE}${p.path === "/" ? "/" : p.path}</loc><lastmod>${day}</lastmod><priority>${p.priority}</priority></url>`).join("\n");
  return new Response(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
