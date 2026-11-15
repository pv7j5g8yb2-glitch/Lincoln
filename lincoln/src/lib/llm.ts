import { AsyncLocalStorage } from "node:async_hooks";
import { db, uid } from "./db";

// One place for every model call, over Anthropic's Messages API (directly, or through a relay that
// speaks it). The key lives on the server and is never sent to the browser or written to the repo.

export const llmConfigured = () => Boolean(process.env.LLM_API_KEY && process.env.LLM_BASE_URL && process.env.LLM_MODEL);

export type Msg = { role: "system" | "user" | "assistant"; content: string };
type Effort = "low" | "medium" | "high";

// Every model call is recorded against the firm and case it worked for: which model actually answered
// (a refused request can be answered by a fallback model, and that is never hidden), the tokens and the
// cost. It is the method record for each output and the cost of each case.
type Work = { firmId: string; caseId?: string | null; purpose: string };
const work = new AsyncLocalStorage<Work>();
/** Runs model calls as work for a firm and, where there is one, a case. */
export const forCase = <T>(w: Work, fn: () => Promise<T>) => work.run(w, fn);

/** "claude-opus-5-5" reads as "Opus 5.5". */
export function modelName(id: string | null | undefined) {
  const m = /claude-([a-z]+)-(\d+)-(\d+)/i.exec(id ?? "");
  return m ? `${m[1][0].toUpperCase()}${m[1].slice(1)} ${m[2]}.${m[3]}` : (id ?? "");
}

const base = () => process.env.LLM_BASE_URL!.replace(/\/$/, "").replace(/\/v1$/, "");
const direct = () => /(^|\.)anthropic\.com$/.test(new URL(base()).host);

// Two models: the main one (LLM_MODEL) for legal work, where accuracy decides everything, and a light
// one (LLM_MODEL_LIGHT, Haiku by default) for sorting work that is simple and frequent, such as deciding
// what an email is. Anything a person reads as work product, emails included, stays on the main model.
// For model comparisons only: LINCOLN_MODEL_BY_FIRM maps a test firm's name to one model used for all its
// work, e.g. {"Test Sonnet":"claude-sonnet-5-5"}. Unset in normal use.
/** True for a test firm named in LINCOLN_MODEL_BY_FIRM. */
export const isTestRun = () => testModel() !== null;
function testModel(): string | null {
  const map = process.env.LINCOLN_MODEL_BY_FIRM;
  const w = work.getStore();
  if (!map || !w) return null;
  try {
    const name = (db().prepare("SELECT name FROM firms WHERE id = ?").get(w.firmId) as { name: string } | undefined)?.name;
    // Phones turn straight quotes into curly ones when typed; both are accepted.
    const m = name ? (JSON.parse(map.replace(/[\u201c\u201d]/g, '"')) as Record<string, string>)[name] : undefined;
    return typeof m === "string" && /^claude-[a-z0-9-]+$/.test(m) ? m : null;
  } catch {
    return null;
  }
}
const mainModel = () => testModel() ?? process.env.LLM_MODEL!;
const lightModel = () => testModel() ?? (process.env.LLM_MODEL_LIGHT || (direct() ? "claude-haiku-5-5" : process.env.LLM_MODEL!));
const headers = () => ({ "content-type": "application/json", "x-api-key": process.env.LLM_API_KEY!, "anthropic-version": "2023-06-01" });

/** Headers and extra body fields for every request. Direct to Anthropic, a refusal falls back to another model. */
function request(body: Record<string, unknown>, effort: Effort, model = mainModel()) {
  const headers: Record<string, string> = { "content-type": "application/json", "x-api-key": process.env.LLM_API_KEY!, "anthropic-version": "2023-06-01" };
  const out: Record<string, unknown> = { model, ...body, output_config: { effort } };
  // Server side fallback exists for the Opus, Sonnet and Fable lines, not for Haiku.
  if (direct() && /opus|sonnet|fable|mythos/.test(model)) {
    headers["anthropic-beta"] = "server-side-fallback-2026-07-01";
    out.fallbacks = "default";
  }
  return { headers, body: JSON.stringify(out) };
}

// Spend guard: every reply's token count is priced and added to today's total; once the daily budget
// is used, no new model call starts until tomorrow (UTC). Protects the account from a runaway loop or
// a stranger's misuse. LLM_DAILY_BUDGET_USD sets the budget. Prices are Anthropic's list prices per
// million tokens; LLM_PRICE_IN / LLM_PRICE_OUT price a model not in the table.
type Usage = { input_tokens?: number; output_tokens?: number; cache_creation_input_tokens?: number; cache_read_input_tokens?: number };
const day = () => `spend:${new Date().toISOString().slice(0, 10)}`;
const budget = () => Number(process.env.LLM_DAILY_BUDGET_USD ?? 5);
export function spentToday() {
  const row = db().prepare("SELECT value FROM kv WHERE firm_id = '_system' AND key = ?").get(day()) as { value: string } | undefined;
  return Number(row?.value ?? 0);
}
function guard() {
  if (spentToday() >= budget()) throw new Error("Today's model budget is used up. It resets at midnight UTC.");
}
const PRICES: [RegExp, number, number][] = [[/haiku-5/, 0.1, 0.5], [/sonnet-5/, 2, 10], [/opus-5-5/, 4, 20], [/opus/, 5, 25], [/fable|mythos/, 8, 40]];
/** Batch requests are billed at half price. */
function priceOf(u: Usage | undefined, model?: string, factor = 1) {
  if (!u) return 0;
  const hit = PRICES.find(([re]) => re.test(model ?? mainModel() ?? ""));
  const pin = hit?.[1] ?? Number(process.env.LLM_PRICE_IN ?? 4), pout = hit?.[2] ?? Number(process.env.LLM_PRICE_OUT ?? 20);
  return factor * ((u.input_tokens ?? 0) * pin + (u.cache_creation_input_tokens ?? 0) * pin * 1.25 + (u.cache_read_input_tokens ?? 0) * pin * 0.1 + (u.output_tokens ?? 0) * pout) / 1_000_000;
}
function addSpend(u: Usage | undefined, model?: string, factor = 1) {
  const cost = priceOf(u, model, factor);
  if (!cost) return;
  db().prepare("INSERT INTO kv (firm_id, key, value) VALUES ('_system', ?, ?) ON CONFLICT(firm_id, key) DO UPDATE SET value = CAST(CAST(value AS REAL) + CAST(excluded.value AS REAL) AS TEXT)").run(day(), String(cost));
}
function record(model: string | undefined, u: Usage, factor = 1) {
  const w = work.getStore();
  if (!w) return;
  db().prepare("INSERT INTO usage (id, firm_id, case_id, at, purpose, model, input_tokens, output_tokens, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)").run(uid(), w.firmId, w.caseId ?? null, new Date().toISOString(), w.purpose, model ?? mainModel() ?? "", (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0), u.output_tokens ?? 0, priceOf(u, model, factor));
}

async function fail(res: Response): Promise<never> {
  const detail = await res.text().catch(() => "");
  if (res.status === 402 || /credit balance is too low/i.test(detail)) throw new Error("The model account is out of credit.");
  if (res.status === 401) throw new Error("The model key was refused.");
  const msg = /"message"\s*:\s*"([^"]{1,200})"/.exec(detail)?.[1];
  throw new Error(`The model service replied ${res.status}${msg ? `: ${msg}` : ""}.`);
}

type Reply = { content: { type: string; text?: string }[]; stop_reason: string; usage?: Usage; model?: string };
const textOf = (d: Reply) => d.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
function check(d: Reply) {
  if (d.stop_reason === "refusal") throw new Error("The model declined this request.");
  if (!textOf(d)) throw new Error(d.stop_reason === "max_tokens" ? "The model ran out of room before answering." : "The model service sent an empty reply.");
}

/** A short exchange: sorting mail, reading an instruction. Low effort; thinking still runs as the model needs.
 *  With cache, the system prompt is cached so repeated calls on the same material (a form's instructions
 *  and the case record, filled in chunks) are billed at the cached rate after the first. With light, the
 *  light model answers. */
export async function chat(messages: Msg[], opts: { maxTokens?: number; effort?: Effort; timeoutMs?: number; cache?: boolean; light?: boolean } = {}): Promise<string> {
  if (!llmConfigured()) throw new Error("No model is connected yet.");
  const system = messages.filter((m) => m.role === "system").map((m) => m.content).join("\n\n");
  const turns = messages.filter((m) => m.role !== "system").map((m) => ({ role: m.role, content: m.content }));
  guard();
  const model = opts.light ? lightModel() : mainModel();
  const r = request({ max_tokens: Math.max(opts.maxTokens ?? 4000, 4000), ...(system ? { system: opts.cache ? [{ type: "text", text: system, cache_control: { type: "ephemeral" } }] : system } : {}), messages: turns }, opts.effort ?? "low", model);
  const res = await fetch(`${base()}/v1/messages`, { method: "POST", headers: r.headers, body: r.body, signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000) });
  if (!res.ok) await fail(res);
  const data = (await res.json()) as Reply;
  addSpend(data.usage, data.model ?? model);
  record(data.model ?? model, data.usage ?? {});
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
  guard();
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
  let buf = "", out = "", model: string | undefined;
  const used: Usage = {};
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
        if (ev.type === "message_start") {
          model = ev.message?.model;
          Object.assign(used, ev.message?.usage ?? {}, { output_tokens: 0 });
          addSpend({ ...ev.message?.usage, output_tokens: 0 }, model);
        }
        if (ev.type === "message_delta") {
          used.output_tokens = (used.output_tokens ?? 0) + (ev.usage?.output_tokens ?? 0);
          addSpend({ output_tokens: ev.usage?.output_tokens }, model);
        }
        if (ev.type === "message_delta" && ev.delta?.stop_reason === "refusal") throw new Error("The model declined this request.");
        if (ev.type === "error") throw new Error(ev.error?.message ?? "The model service reported an error.");
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  record(model, used);
  if (!out) throw new Error("The model service sent an empty reply.");
  return out;
}

// Batch requests: work nobody is waiting on (filling forms after a file is read) goes through Anthropic's
// Message Batches API at half price. Results usually come back within minutes, at most a day. The batch
// id is stored with the work, so a restart loses nothing; the background sweep collects the results.
export type BatchItem = { id: string; system: string; user: string; maxTokens: number; effort: Effort; cache?: boolean };
export const batchAvailable = () => llmConfigured() && process.env.LLM_BATCH !== "off" && (direct() || process.env.LLM_BATCH === "on");

export async function submitBatch(items: BatchItem[]): Promise<string> {
  guard();
  const requests = items.map((i) => ({
    custom_id: i.id,
    params: { model: mainModel(), max_tokens: i.maxTokens, system: i.cache ? [{ type: "text", text: i.system, cache_control: { type: "ephemeral" } }] : i.system, messages: [{ role: "user", content: i.user }], output_config: { effort: i.effort } },
  }));
  const res = await fetch(`${base()}/v1/messages/batches`, { method: "POST", headers: headers(), body: JSON.stringify({ requests }), signal: AbortSignal.timeout(120_000) });
  if (!res.ok) await fail(res);
  return ((await res.json()) as { id: string }).id;
}

/** Stops a batch. Requests already answered are kept and billed; the rest are not. */
export async function cancelBatch(id: string) {
  const res = await fetch(`${base()}/v1/messages/batches/${encodeURIComponent(id)}/cancel`, { method: "POST", headers: headers(), signal: AbortSignal.timeout(60_000) });
  if (!res.ok) await fail(res);
}

/** The batch's results by custom id once it has ended, or null while it is still running. */
export async function batchResults(id: string): Promise<Map<string, { text?: string; error?: string }> | null> {
  const res = await fetch(`${base()}/v1/messages/batches/${encodeURIComponent(id)}`, { headers: headers(), signal: AbortSignal.timeout(60_000) });
  if (!res.ok) await fail(res);
  const b = (await res.json()) as { processing_status: string; results_url?: string | null };
  if (b.processing_status !== "ended") return null;
  const out = new Map<string, { text?: string; error?: string }>();
  if (!b.results_url) return out;
  const r = await fetch(b.results_url, { headers: headers(), signal: AbortSignal.timeout(120_000) });
  if (!r.ok) await fail(r);
  for (const line of (await r.text()).split("\n")) {
    if (!line.trim()) continue;
    const x = JSON.parse(line) as { custom_id: string; result: { type: string; message?: Reply; error?: { message?: string } } };
    if (x.result.type !== "succeeded" || !x.result.message) { out.set(x.custom_id, { error: x.result.type }); continue; }
    const m = x.result.message;
    addSpend(m.usage, m.model, 0.5);
    record(m.model, m.usage ?? {}, 0.5);
    out.set(x.custom_id, m.stop_reason === "refusal" || !textOf(m) ? { error: m.stop_reason } : { text: textOf(m) });
  }
  return out;
}

export { parseJson, repairJson, errorContext } from "./json";

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
    guard();
    const r = request({ max_tokens: 8000, system, tools, messages: msgs }, "medium");
    const res = await fetch(`${base()}/v1/messages`, { method: "POST", headers: r.headers, body: r.body, signal: AbortSignal.timeout(180_000) });
    if (!res.ok) await fail(res);
    const data = (await res.json()) as { usage?: Usage; model?: string; content: ({ type: "text"; text: string } | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> })[]; stop_reason: string };
    addSpend(data.usage, data.model);
    record(data.model, data.usage ?? {});
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
