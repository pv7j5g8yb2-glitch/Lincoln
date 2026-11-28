import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PROVIDERS, authUrl, isProvider } from "@/lib/integrations";
import { appUrl } from "@/lib/integrations/http";
import { newToken } from "@/lib/passwords";
import { apiUser } from "@/lib/session";

// One sign in per company connects every Google or every Microsoft service at once.
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const s = await apiUser();
  if (!s) return NextResponse.redirect(new URL("/signin", appUrl()));
  if (s.firm.demo) return NextResponse.redirect(new URL("/integrations?error=sample", appUrl()));
  if (!isProvider(provider) || !PROVIDERS.find((p) => p.id === provider)!.configured()) return NextResponse.redirect(new URL(`/integrations?error=${provider}`, appUrl()));
  const state = newToken();
  // ?teams=1 (Microsoft) or ?chat=1 (Google): the same sign in, also asking to read the firm's Lincoln channel
  // in Teams or space in Google Chat.
  const q = new URL(req.url).searchParams;
  const teams = provider === "microsoft" ? q.get("teams") === "1" : q.get("chat") === "1";
  (await cookies()).set("lincoln_oauth", `${teams ? "teams" : "connect"}.${provider}.${state}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return NextResponse.redirect(authUrl(provider, state, "connect", teams));
}
