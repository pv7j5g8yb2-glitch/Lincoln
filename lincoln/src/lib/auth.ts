export { hashPassword, newToken, sha, verifyPassword } from "./passwords";

export const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e) && e.length <= 200;
export const validPassword = (p: string) => p.length >= 10 && p.length <= 200;
export const initialsOf = (name: string) => name.split(/\s+/).filter(Boolean).map((w) => w[0]!.toUpperCase()).slice(0, 2).join("") || "U";

// Small in-memory limiter: enough to stop password guessing on a single server.
const hits = new Map<string, number[]>();
export function limited(key: string, max = 8, windowMs = 15 * 60_000) {
  const now = Date.now();
  // Old visitors are forgotten, so the count never grows for as long as the server runs.
  if (hits.size > 20_000) for (const [k, v] of hits) if (!v.length || now - v[v.length - 1] > 60 * 60_000) hits.delete(k);
  const list = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
  list.push(now);
  hits.set(key, list);
  return list.length > max;
}
