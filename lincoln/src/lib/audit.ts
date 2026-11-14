import { headers } from "next/headers";
import { db, uid } from "./db";

/** The client's address as seen by our own proxy: the last entry, which a client cannot forge. */
export async function clientIp() {
  const h = await headers();
  const xff = (h.get("x-forwarded-for") ?? "").split(",").map((s) => s.trim()).filter(Boolean);
  return xff[xff.length - 1] ?? "local";
}

/** Security record: sign ins, failures, password and two step changes, connections, deletions. */
export async function securityEvent(firmId: string, userId: string | null, kind: string, detail?: string) {
  let ip = "";
  try { ip = await clientIp(); } catch { ip = ""; }
  db().prepare("INSERT INTO security_events (id, firm_id, user_id, at, kind, detail, ip) VALUES (?, ?, ?, ?, ?, ?, ?)").run(uid(), firmId, userId, new Date().toISOString(), kind, detail?.slice(0, 300) ?? null, ip);
}
