import { NextResponse, type NextRequest } from "next/server";

// uselincoln.com is the public site, app.uselincoln.com is the app; both are served by this one Next app.
// On the main domain the home page shows the landing page, the legal pages stay, and every other address goes to
// the same path on the app.
const APP = "https://app.uselincoln.com";
const MAIN = "uselincoln.com";
const PUBLIC = new Set(["/terms", "/privacy", "/start"]);
const APP_ROUTES = new Set(["signin", "signup", "forgot", "reset", "join", "intake", "setup", "ops", "word", "outlook", "cases", "approvals", "assistant", "help", "inbox", "integrations", "library", "settings"]);

export function proxy(req: NextRequest) {
  const host = (req.headers.get("x-forwarded-host") ?? req.headers.get("host") ?? "").split(",")[0].split(":")[0].trim().toLowerCase();
  // The app (and anything that is not the public site) is kept out of search engines entirely.
  if (host !== MAIN && host !== `www.${MAIN}`) { const res = NextResponse.next(); res.headers.set("X-Robots-Tag", "noindex, nofollow"); return res; }
  const { pathname, search } = req.nextUrl;
  if (host !== MAIN) return NextResponse.redirect(`https://${MAIN}${pathname}${search}`, 308);
  if (pathname === "/") return NextResponse.rewrite(new URL(`/welcome${search}`, req.url));
  if (pathname === "/welcome") return NextResponse.redirect(`https://${MAIN}/${search}`, 308);
  if (PUBLIC.has(pathname)) return NextResponse.next();
  // Addresses of the app (a sign in link, an invitation, a client's intake link) go to the app; anything else is a
  // page that does not exist and shows Page not found here, never the app's sign in.
  if (APP_ROUTES.has(pathname.split("/")[1] ?? "")) return NextResponse.redirect(`${APP}${pathname}${search}`, 308);
  return NextResponse.next();
}

export const config = {
  // Pages only: scripts, styles, images, fonts, video, sound and the API pass straight through.
  matcher: ["/((?!_next/|api/|.*\\.(?:png|jpg|jpeg|svg|ico|webp|gif|js|css|txt|xml|webmanifest|woff2?|json|mp4|webm|mp3|m4a)$).*)"],
};
