import { cookies, headers } from "next/headers";
import { db } from "./db";
import { newToken, sha } from "./passwords";
import { COOKIE, MFA_COOKIE, SESSION_HOURS } from "./session";
import { clientIp } from "./audit";
import { deviceName } from "./device";
import { mailConfigured, sendSystemMail } from "./mailer";

// Not a server action file: nothing here can be called from the browser directly.

export const cookieOpts = (maxAge: number) => ({ httpOnly: true, sameSite: "lax" as const, secure: process.env.NODE_ENV === "production", path: "/", maxAge });

export async function createSession(userId: string) {
  const token = newToken();
  const agent = ((await headers()).get("user-agent") ?? "").slice(0, 200);
  const at = new Date().toISOString();
  const ip = await clientIp();
  const d = db();
  d.prepare("INSERT INTO sessions (id, user_id, created_at, ip, agent, last_seen) VALUES (?, ?, ?, ?, ?, ?)").run(sha(token), userId, at, ip, agent, at);
  (await cookies()).set(COOKIE, token, cookieOpts(60 * 60 * SESSION_HOURS));
  // A sign in from a device this account has not used before is reported to the account's email.
  const device = deviceName(agent);
  const seenBefore = d.prepare("SELECT COUNT(*) AS n FROM known_devices WHERE user_id = ?").get(userId) as { n: number };
  const added = d.prepare("INSERT OR IGNORE INTO known_devices (user_id, device, first_seen) VALUES (?, ?, ?)").run(userId, device, at).changes > 0;
  if (added && seenBefore.n > 0 && mailConfigured()) {
    const u = d.prepare("SELECT email FROM users WHERE id = ?").get(userId) as { email: string } | undefined;
    if (u) {
      const when = new Date(at).toUTCString();
      void sendSystemMail(u.email, "New sign in to Lincoln", `Your Lincoln account was signed in to from a new device.\n\nDevice: ${device}\nAddress: ${ip ?? "unknown"}\nTime: ${when}\n\nIf this was you, nothing needs doing. If not, change your password and sign out all other devices in Settings, Security.`).catch(() => {});
    }
  }
}

/** Starts the second step for a user with two step sign in. Returns where to send the browser. */
export async function beginChallenge(userId: string) {
  const token = newToken();
  db().prepare("INSERT INTO login_challenges (token_hash, user_id, expires_at) VALUES (?, ?, ?)").run(sha(token), userId, new Date(Date.now() + 5 * 60_000).toISOString());
  (await cookies()).set(MFA_COOKIE, token, cookieOpts(300));
  return "/signin/code";
}
