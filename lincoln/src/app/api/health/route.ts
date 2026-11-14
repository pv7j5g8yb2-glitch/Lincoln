import { db } from "@/lib/db";

// For uptime pings. Keeps the server awake so background work never pauses.
export function GET() {
  db();
  return Response.json({ ok: true, at: new Date().toISOString() });
}
