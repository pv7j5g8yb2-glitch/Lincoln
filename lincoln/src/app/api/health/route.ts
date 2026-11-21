import { db } from "@/lib/db";

// For uptime pings. Keeps the server awake so background work never pauses. The version is the deployed
// commit (Render sets RENDER_GIT_COMMIT), so a deploy can be confirmed from outside.
export function GET() {
  db();
  return Response.json({ ok: true, at: new Date().toISOString(), version: (process.env.RENDER_GIT_COMMIT ?? "").slice(0, 7) || null });
}
