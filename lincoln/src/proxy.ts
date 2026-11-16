import { NextResponse, type NextRequest } from "next/server";

// uselincoln.com is the public site, app.uselincoln.com is the app; both are served by this one Next app.
// On the main domain the home page shows the landing page, the legal pages stay, and every other address goes to
// the same path on the app.
const APP = "https://app.uselincoln.com";
const MAIN = "uselincoln.com";
const PUBLIC = new Set(["/terms", "/privacy", "/start"]);

export function proxy(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].split(":")[0].trim().toLowerCase();
  if (host !== MAIN && host !== `www.${MAIN}`) return NextResponse.next();
  const { pathname, search } = req.nextUrl;
  if (host !== MAIN) return NextResponse.redirect(`https://${MAIN}${pathname}${search}`, 308);
  if (pathname === "/") return NextResponse.rewrite(new URL(`/welcome${search}`, req.url));
  if (pathname === "/welcome") return NextResponse.redirect(`https://${MAIN}/${search}`, 308);
  if (PUBLIC.has(pathname)) return NextResponse.next();
  return NextResponse.redirect(`${APP}${pathname}${search}`, 308);
}

export const config = {
  // Pages only: scripts, styles, images, fonts and the API pass straight through.
  matcher: ["/((?!_next/|api/|.*\\.(?:png|jpg|jpeg|svg|ico|webp|gif|js|css|txt|xml|webmanifest|woff2?|json)$).*)"],
};
