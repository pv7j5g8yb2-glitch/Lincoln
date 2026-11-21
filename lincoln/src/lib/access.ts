import { db, uid } from "./db";
import { clientIp } from "./audit";

// A record of who looked at or took out what: cases opened, client pages viewed, files exported, the
// firm exported. Viewing is recorded once an hour per person and item, so the record stays readable.

const recent = new Map<string, number>();

export async function recordAccess(firmId: string, userId: string, action: "case_viewed" | "page_viewed" | "exported" | "firm_exported", target: string, label: string) {
  const key = `${userId}|${action}|${target}`;
  const now = Date.now();
  if (action !== "exported" && action !== "firm_exported" && now - (recent.get(key) ?? 0) < 3600_000) return;
  recent.set(key, now);
  if (recent.size > 5000) recent.clear();
  db().prepare("INSERT INTO access_log (id, firm_id, user_id, at, action, target, label, ip) VALUES (?, ?, ?, ?, ?, ?, ?, ?)").run(uid(), firmId, userId, new Date(now).toISOString(), action, target, label.slice(0, 200), await clientIp());
}

export function accessRecord(firmId: string, limit = 40) {
  return db().prepare("SELECT a.at, a.action, a.label, a.ip, u.name FROM access_log a LEFT JOIN users u ON u.id = a.user_id WHERE a.firm_id = ? ORDER BY a.at DESC LIMIT ?").all(firmId, limit) as { at: string; action: string; label: string; ip: string | null; name: string | null }[];
}
