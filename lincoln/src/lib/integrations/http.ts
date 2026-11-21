// Every call to Google or Microsoft goes through here. INTEGRATIONS_MOCK_URL points them at a local
// test server; it is never set in production.
export function api(url: string) {
  const mock = process.env.INTEGRATIONS_MOCK_URL?.replace(/\/$/, "");
  return mock ? `${mock}/${url.replace(/^https:\/\//, "")}` : url;
}

export async function json<T>(res: Response, what: string): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    const code = /"error"\s*:\s*"([\w.-]{1,60})"/.exec(body)?.[1];
    const desc = /"message"\s*:\s*"([^"]{1,160})"/.exec(body)?.[1] ?? /"error_description"\s*:\s*"([^"]{1,160})"/.exec(body)?.[1];
    const msg = [code, desc].filter(Boolean).join(": ");
    throw new Error(`${what} replied ${res.status}${msg ? `: ${msg}` : ""}`);
  }
  return (await res.json()) as T;
}

export const appUrl = () => (process.env.APP_URL ?? "http://localhost:3000").replace(/\/$/, "");
export const callback = (provider: string) => `${appUrl()}/api/connect/${provider}/callback`;
