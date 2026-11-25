import { MAIN_HOST, SITE, hostOf } from "@/lib/seo/site";

// uselincoln.com is open to search engines and AI search (named so their crawlers are welcome, not merely allowed);
// app.uselincoln.com, where firms work, is closed to all of them.
const AI = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "Google-Extended", "PerplexityBot", "Perplexity-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "Applebot-Extended", "Bingbot", "DuckAssistBot", "meta-externalagent", "MistralAI-User"];

export function GET(req: Request) {
  const open = hostOf(req.headers) === MAIN_HOST || hostOf(req.headers) === `www.${MAIN_HOST}`;
  const body = open
    ? [
        "User-agent: *", "Allow: /", "Disallow: /terms", "Disallow: /privacy", "",
        ...AI.flatMap((a) => [`User-agent: ${a}`, "Allow: /", ""]),
        `Sitemap: ${SITE}/sitemap.xml`, "",
      ].join("\n")
    : "User-agent: *\nDisallow: /\n";
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
