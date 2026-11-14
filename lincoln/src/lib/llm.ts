// One place for every model call, over Anthropic's Messages API (directly, or through a relay that
// speaks it). The key lives on the server and is never sent to the browser or written to the repo.

export const llmConfigured = () => Boolean(process.env.LLM_API_KEY && process.env.LLM_BASE_URL && process.env.LLM_MODEL);

export type Msg = { role: "system" | "user" | "assistant"; content: string };
type Effort = "low" | "medium" | "high";

const base = () => process.env.LLM_BASE_URL!.replace(/\/$/, "").replace(/\/v1$/, "");
const direct = () => /(^|\.)anthropic\.com$/.test(new URL(base()).host);

/** Headers and extra body fields for every request. Direct to Anthropic, a refusal falls back to another model. */
function request(body: Record<string, unknown>, effort: Effort) {
  const headers: Record<string, string> = { "content-type": "application/json", "x-api-key": process.env.LLM_API_KEY!, "anthropic-version": "2023-06-01" };
  const out: Record<string, unknown> = { model: process.env.LLM_MODEL, ...body, output_config: { effort } };
  if (direct()) {
    headers["anthropic-beta"] = "server-side-fallback-2026-07-01";
    out.fallbacks = "default";
  }
  return { headers, body: JSON.stringify(out) };
}

async function fail(res: Response): Promise<never> {
  const detail = await res.text().catch(() => "");
  if (res.status === 402 || /credit balance is too low/i.test(detail)) throw new Error("The model account is out of credit.");
  if (res.status === 401) throw new Error("The model key was refused.");
  const msg = /"message"\s*:\s*"([^"]{1,200})"/.exec(detail)?.[1];
  throw new Error(`The model service replied ${res.status}${msg ? `: ${msg}` : ""}.`);
}

type Reply = { content: { type: string; text?: string }[]; stop_reason: string };
const textOf = (d: Reply) => d.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
function check(d: Reply) {
  if (d.stop_reason === "refusal") throw new Error("The model declined this request.");
  if (!textOf(d)) throw new Error(d.stop_reason === "max_tokens" ? "The model ran out of room before answering." : "The model service sent an empty reply.");
}

/** A short exchange: sorting mail, reading an instruction. Low effort; thinking still runs as the model needs. */
export async function chat(messages: Msg[], opts: { maxTokens?: number; effort?: Effort } = {}): Promise<string> {
  if (!llmConfigured()) throw new Error("No model is connected yet.");
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const turns = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content }));
  const r = request({ max_tokens: Math.max(opts.maxTokens ?? 4000, 4000), ...(system ? { system } : {}), messages: turns }, opts.effort ?? "low");
  const res = await fetch(`${base()}/v1/messages`, { method: "POST", headers: r.headers, body: r.body, signal: AbortSignal.timeout(120_000) });
  if (!res.ok) await fail(res);
  const data = (await res.json()) as Reply;
  check(data);
  return textOf(data);
}

type Block = { type: "text"; text: string } | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } };

// Large reads run one at a time: the provider reserves credit for each request while it runs,
// and parallel reads of long files can exceed it. A dropped stream is retried twice.
let queue: Promise<unknown> = Promise.resolve();

/** Reads page images with the Messages API. Queued, retried, and streamed so long answers do not time out. */
export function readPages(system: string, pages: { n: number; jpeg: Buffer }[], instruction: string, maxTokens = 16000): Promise<string> {
  const run = queue.then(async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await readPagesOnce(system, pages, instruction, maxTokens);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        if (attempt >= 2 || !/interrupt|overload|timeout|terminated|replied (429|5\d\d)/i.test(msg)) throw e;
        await new Promise((r) => setTimeout(r, 4000 * (attempt + 1)));
      }
    }
  });
  queue = run.catch(() => undefined);
  return run;
}

async function readPagesOnce(system: string, pages: { n: number; jpeg: Buffer }[], instruction: string, maxTokens = 16000): Promise<string> {
  if (!llmConfigured()) throw new Error("No model is connected.");
  const content: Block[] = [];
  for (const p of pages) {
    content.push({ type: "text", text: `Page ${p.n}` });
    content.push({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: p.jpeg.toString("base64") } });
  }
  content.push({ type: "text", text: instruction });
  const r = request({ max_tokens: maxTokens, stream: true, system, messages: [{ role: "user", content }] }, "medium");
  const res = await fetch(`${base()}/v1/messages`, {
    method: "POST",
    headers: r.headers,
    body: r.body,
    signal: AbortSignal.timeout(600_000),
  });
  if (!res.ok || !res.body) await fail(res);
  const reader = res.body!.getReader();
  const dec = new TextDecoder();
  let buf = "", out = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buf += dec.decode(value, { stream: true });
    let i;
    while ((i = buf.indexOf("\n")) >= 0) {
      const line = buf.slice(0, i).trim();
      buf = buf.slice(i + 1);
      if (!line.startsWith("data:")) continue;
      try {
        const ev = JSON.parse(line.slice(5));
        if (ev.type === "content_block_delta" && ev.delta?.type === "text_delta") out += ev.delta.text;
        if (ev.type === "message_delta" && ev.delta?.stop_reason === "refusal") throw new Error("The model declined this request.");
        if (ev.type === "error") throw new Error(ev.error?.message ?? "The model service reported an error.");
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  if (!out) throw new Error("The model service sent an empty reply.");
  return out;
}

/** Pulls the JSON object out of a model reply, tolerating code fences or stray text around it. */
export function parseJson<T>(text: string): T {
  const a = text.indexOf("{"), b = text.lastIndexOf("}");
  if (a < 0 || b <= a) throw new Error("The model reply was not in the expected format.");
  return JSON.parse(text.slice(a, b + 1)) as T;
}

export type Tool = { name: string; description: string; input_schema: Record<string, unknown> };
type Turn = { role: "user" | "assistant"; content: unknown };

/**
 * One agent turn with tools over the Messages API. Calls run until the model answers in text,
 * at most eight steps. The handler executes each tool call against the firm's own data.
 */
export async function runAgent(system: string, history: Turn[], tools: Tool[], handle: (name: string, input: Record<string, unknown>) => Promise<string>): Promise<string> {
  if (!llmConfigured()) throw new Error("No model is connected.");
  const msgs = [...history];
  for (let step = 0; step < 8; step++) {
    const r = request({ max_tokens: 8000, system, tools, messages: msgs }, "medium");
    const res = await fetch(`${base()}/v1/messages`, { method: "POST", headers: r.headers, body: r.body, signal: AbortSignal.timeout(180_000) });
    if (!res.ok) await fail(res);
    const data = (await res.json()) as { content: ({ type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> })[]; stop_reason: string };
    const calls = data.content.filter((b) => b.type === "tool_use") as { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }[];
    const text = data.content.filter((b) => b.type === "text").map((b) => (b as { text: string }).text).join("\n").trim();
    if (data.stop_reason === "refusal") throw new Error("The model declined this request.");
    if (!calls.length) return text || "Done.";
    // The whole reply goes back unchanged, thinking blocks included, as the API requires.
    msgs.push({ role: "assistant", content: data.content });
    const results = [];
    for (const c of calls) {
      let out: string;
      try {
        out = await handle(c.name, c.input ?? {});
      } catch (e) {
        out = `Error: ${e instanceof Error ? e.message : "failed"}`;
      }
      results.push({ type: "tool_result", tool_use_id: c.id, content: out.slice(0, 20000) });
    }
    msgs.push({ role: "user", content: results });
  }
  return "Stopped after eight steps. The work so far is saved on the case.";
}
