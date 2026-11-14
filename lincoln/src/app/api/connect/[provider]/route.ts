import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PROVIDERS, authUrl, isProvider } from "@/lib/integrations";
import { appUrl } from "@/lib/integrations/http";
import { newToken } from "@/lib/passwords";
import { apiUser } from "@/lib/session";

// One sign in per company connects every Google or every Microsoft service at once.
export async function GET(_: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const s = await apiUser();
  if (!s) return NextResponse.redirect(new URL("/signin", appUrl()));
  if (s.firm.demo) return NextResponse.redirect(new URL("/integrations?error=sample", appUrl()));
  if (!isProvider(provider) || !PROVIDERS.find((p) => p.id === provider)!.configured()) return NextResponse.redirect(new URL(`/integrations?error=${provider}`, appUrl()));
  const state = newToken();
  (await cookies()).set("lincoln_oauth", `connect.${provider}.${state}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return NextResponse.redirect(authUrl(provider, state));
}
