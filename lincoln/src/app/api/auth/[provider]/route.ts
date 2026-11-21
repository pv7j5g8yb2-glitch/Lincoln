import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { PROVIDERS, authUrl, isProvider } from "@/lib/integrations";
import { appUrl } from "@/lib/integrations/http";
import { limited } from "@/lib/auth";
import { clientIp } from "@/lib/audit";
import { newToken } from "@/lib/passwords";

// "Continue with Google / Microsoft": sign in or create an account, and connect every service in one consent.
export async function GET(_: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  if (!isProvider(provider) || !PROVIDERS.find((p) => p.id === provider)!.configured()) return NextResponse.redirect(new URL("/signin?error=provider", appUrl()));
  if (limited(`sso:${await clientIp()}`, 30)) return NextResponse.redirect(new URL("/signin?error=limited", appUrl()));
  const state = newToken();
  (await cookies()).set("lincoln_oauth", `auth.${provider}.${state}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: 600 });
  return NextResponse.redirect(authUrl(provider, state, "auth"));
}
