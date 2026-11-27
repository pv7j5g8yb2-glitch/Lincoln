import { AREAS, CONNECTORS, WORK } from "@/components/landing/content";
import { MAIN_HOST, NAME, SITE, SUMMARY, hostOf } from "@/lib/seo/site";

// A plain summary of Lincoln for AI tools (the llms.txt convention). Only true, current facts.
export function GET(req: Request) {
  if (hostOf(req.headers) !== MAIN_HOST) return new Response("Not found", { status: 404 });
  const body = `# ${NAME}

> ${SUMMARY}

${NAME} (also searched for as Lincoln AI and Lincoln Legal AI) is a legal AI platform for US immigration law firms, at ${SITE}. It is not a law firm and gives no legal advice: everything it prepares is reviewed and approved by a licensed attorney.

## What ${NAME} does
${WORK.map((w) => `- ${w.title}: ${w.line}`).join("\n")}

## Case types
Any immigration case: ${AREAS.replace(/\.$/, "").toLowerCase()}.

## Works with
${CONNECTORS.map(([who, list]) => `- ${who}: ${list.join(", ")}`).join("\n")}

## Privacy
- Encrypted: the database and every file, at rest.
- Client files are not used to train AI models.
- Two-step sign in with an authenticator app is available on every account.
- Firms can export or delete everything at any time.

## Contact
- Pricing is quoted per firm: ${SITE}/start
- Email: hello@uselincoln.com
`;
  return new Response(body, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" } });
}
