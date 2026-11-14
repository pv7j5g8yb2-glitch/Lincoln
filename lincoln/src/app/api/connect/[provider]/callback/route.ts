import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { connect, isProvider, signInWith } from "@/lib/integrations";
import { appUrl } from "@/lib/integrations/http";
import { apiUser } from "@/lib/session";
import { securityEvent } from "@/lib/audit";
import { beginChallenge, createSession } from "@/lib/login";
import { db } from "@/lib/db";

// One return address for both uses: connecting accounts from Settings, and signing in or up.
export async function GET(req: Request, { params }: { params: Promise<{ provider: string }> }) {
  const { provider } = await params;
  const go = (path: string) => NextResponse.redirect(new URL(path, appUrl()));
  const url = new URL(req.url);
  const jar = await cookies();
  const expected = jar.get("lincoln_oauth")?.value ?? "";
  jar.delete("lincoln_oauth");
  const [mode, p, state] = expected.split(".");
  const code = url.searchParams.get("code");
  // Google and Microsoft send ?error=... when access was refused on their screen.
  const refused = url.searchParams.get("error");
  if (refused) {
    console.error("Provider refused", provider, refused, url.searchParams.get("error_description") ?? "");
    return go(mode === "connect" ? `/integrations?error=connect&code=${encodeURIComponent(refused.slice(0, 40))}` : `/signin?error=provider&code=${encodeURIComponent(refused.slice(0, 40))}`);
  }
  if (!isProvider(provider) || p !== provider || !code || !state || url.searchParams.get("state") !== state) {
    console.error("Sign in state mismatch", provider, { hasCookie: Boolean(expected), mode, cookieProvider: p, hasCode: Boolean(code) });
    return go(mode === "connect" ? "/integrations?error=state" : "/signin?error=provider&code=expired_or_cookie");
  }

  if (mode === "auth") {
    try {
      const r = await signInWith(provider, code);
      if ("error" in r) return go(r.error === "exists" ? "/signin?error=linked" : `/signin?error=provider&code=${r.error}`);
      await securityEvent(r.firmId, r.userId, r.created ? "account_created" : "sign_in", `with ${provider === "google" ? "Google" : "Microsoft"}`);
      const u = db().prepare("SELECT totp_enc FROM users WHERE id = ?").get(r.userId) as { totp_enc: string | null };
      if (u.totp_enc) return go(await beginChallenge(r.userId));
      await createSession(r.userId);
      return go("/");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.error("Sign in failed", provider, msg);
      // A short reason, never a secret: e.g. invalid_client, redirect_uri_mismatch.
      const reason = /invalid_client|redirect_uri_mismatch|invalid_grant|unauthorized_client|access_denied/.exec(msg)?.[0] ?? (/ replied (\d{3})/.exec(msg)?.[1] ? `http_${/ replied (\d{3})/.exec(msg)![1]}` : "exchange_failed");
      return go(`/signin?error=provider&code=${reason}`);
    }
  }

  const s = await apiUser();
  if (!s) return go("/signin");
  if (s.firm.demo) return go("/integrations?error=sample");
  try {
    const email = await connect(provider, s.firm.id, s.user.id, code);
    await securityEvent(s.firm.id, s.user.id, "connected", `${provider} ${email}`);
    return go(`/integrations?connected=${provider}`);
  } catch (e) {
    console.error("Connection failed", provider, e instanceof Error ? e.message : e);
    return go("/integrations?error=connect");
  }
}
