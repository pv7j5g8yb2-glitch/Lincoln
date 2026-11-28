import crypto from "node:crypto";

/**
 * True when the password appears in a known data breach, checked against Have I Been Pwned by
 * k-anonymity: only the first five characters of its SHA-1 hash leave the server, never the password.
 * If the service cannot be reached the check is skipped rather than blocking sign up.
 */
export async function breached(password: string): Promise<boolean> {
  const hash = crypto.createHash("sha1").update(password).digest("hex").toUpperCase();
  try {
    const res = await fetch(`https://api.pwnedpasswords.com/range/${hash.slice(0, 5)}`, { headers: { "Add-Padding": "true", "User-Agent": "Lincoln" }, signal: AbortSignal.timeout(3000) });
    if (!res.ok) return false;
    const rest = hash.slice(5);
    return (await res.text()).split("\n").some((line) => {
      const [suffix, count] = line.trim().split(":");
      return suffix === rest && Number(count) > 0;
    });
  } catch {
    return false;
  }
}
