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
type Work = { firmId: string; caseId?: string | null; purpose: string; userId?: string | null };
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
/** The firm the current work is for, if any. */
export const workFirm = () => work.getStore()?.firmId ?? null;
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
// Fair use (Ismael, 2026-11-15): each user may use up to LLM_SEAT_MONTHLY_USD of model cost a month ($150 by
// default). A busy user is about $30 to $70, so nobody meets it in practice; it stops a runaway loop or a shared
// login from costing more than the seat pays. Work is counted against the person it is for: the one asking in the
// chat or giving an instruction, otherwise the case's responsible attorney.
const seatLimit = () => Number(process.env.LLM_SEAT_MONTHLY_USD ?? 150);
function personOf(w: Work | undefined): string | null {
  if (!w) return null;
  if (w.userId) return w.userId;
  if (!w.caseId) return null;
  return (db().prepare("SELECT attorney_id FROM cases WHERE firm_id = ? AND id = ?").get(w.firmId, w.caseId) as { attorney_id: string | null } | undefined)?.attorney_id ?? null;
}
export function userMonthUse(userId: string) {
  const since = new Date().toISOString().slice(0, 8) + "01";
  const spent = (db().prepare("SELECT COALESCE(SUM(cost), 0) AS c FROM usage WHERE user_id = ? AND at >= ?").get(userId, since) as { c: number }).c;
  return { spent, limit: seatLimit() };
}
function guard() {
  // LLM_DAILY_BUDGET_USD=0 turns the server wide daily cap off.
  if (budget() > 0 && spentToday() >= budget()) throw new Error("Today's model budget is used up. It resets at midnight UTC.");
  const person = seatLimit() > 0 ? personOf(work.getStore()) : null;
  if (person) {
    const { spent, limit } = userMonthUse(person);
    if (spent >= limit) throw new Error("Monthly usage limit reached.");
  }
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
  db().prepare("INSERT INTO usage (id, firm_id, case_id, user_id, at, purpose, model, input_tokens, output_tokens, cost) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(uid(), w.firmId, w.caseId ?? null, personOf(w), new Date().toISOString(), w.purpose, model ?? mainModel() ?? "", (u.input_tokens ?? 0) + (u.cache_creation_input_tokens ?? 0) + (u.cache_read_input_tokens ?? 0), u.output_tokens ?? 0, priceOf(u, model, factor));
}

async function fail(res: Response): Promise<never> {
  const detail = await res.text().catch(() => "");
  if (res.status === 429) throw new Error(`The model service replied 429, retry after ${Number(res.headers.get("retry-after")) || 10}.`);
  if (res.status === 402 || /credit balance is too low/i.test(detail)) throw new Error("The model account is out of credit.");
  if (res.status === 401) throw new Error("The model key was refused.");
  const msg = /"message"\s*:\s*"([^"]{1,200})"/.exec(detail)?.[1];
  throw new Error(`The model service replied ${res.status}${msg ? `: ${msg}` : ""}.`);
}

type Reply = { content: { type: string; text?: string }[]; stop_reason: string; usage?: Usage; model?: string };
const textOf = (d: Reply) => d.content.filter((b) => b.type === "text").map((b) => b.text ?? "").join("").trim();
function check(d: Reply) {
  if (d.stop_reason === "refusal") throw new Error("The model declined this request.");
  if (d.stop_reason === "max_tokens") throw new Error("The model ran out of room before finishing its answer.");
  if (!textOf(d)) throw new Error("The model service sent an empty reply.");
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
  // A rate limit, an overloaded service or a dropped connection is waited out and retried, as reads are:
  // several forms are filled at once, and one busy moment must not fail a form.
  let data: Reply;
  for (let attempt = 0; ; attempt++) {
    try {
      const res = await fetch(`${base()}/v1/messages`, { method: "POST", headers: r.headers, body: r.body, signal: AbortSignal.timeout(opts.timeoutMs ?? 120_000) });
      if (!res.ok) await fail(res);
      data = (await res.json()) as Reply;
      break;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "";
      const wait = Number(/retry after (\d+)/.exec(msg)?.[1] ?? 0);
      if (attempt >= 4 || !/interrupt|overload|terminated|fetch failed|replied (429|5\d\d)/i.test(msg)) throw e;
      await new Promise((ok) => setTimeout(ok, Math.min(60, wait || 4 * (attempt + 1)) * 1000));
    }
  }
  addSpend(data.usage, data.model ?? model);
  record(data.model ?? model, data.usage ?? {});
  check(data);
  return textOf(data);
}

type Block = { type: "text"; text: string } | { type: "image"; source: { type: "base64"; media_type: "image/jpeg"; data: string } };

// Reads of page images run a few at a time across the whole server (LLM_READ_CONCURRENCY, 3 by default):
// a long file is read in parallel batches, and one firm's long file never holds another's for minutes. A
// dropped stream or an overloaded service is retried; a rate limit waits as long as the service asks.
const READS = () => Math.max(1, Number(process.env.LLM_READ_CONCURRENCY) || 3);
let active = 0;
const waiting: (() => void)[] = [];
async function slot<T>(fn: () => Promise<T>): Promise<T> {
  if (active >= READS()) await new Promise<void>((r) => waiting.push(r));
  active++;
  try { return await fn(); } finally { active--; waiting.shift()?.(); }
}

/** Reads page images with the Messages API. Limited in number, retried, and streamed so long answers do not time out. */
export function readPages(system: string, pages: { n: number; jpeg: Buffer }[], instruction: string, maxTokens = 16000): Promise<string> {
  return slot(async () => {
    for (let attempt = 0; ; attempt++) {
      try {
        return await readPagesOnce(system, pages, instruction, maxTokens);
      } catch (e) {
        const msg = e instanceof Error ? e.message : "";
        const wait = Number(/retry after (\d+)/.exec(msg)?.[1] ?? 0);
        if (attempt >= 4 || !/interrupt|overload|timeout|terminated|replied (429|5\d\d)/i.test(msg)) throw e;
        await new Promise((r) => setTimeout(r, Math.min(60, wait || 4 * (attempt + 1)) * 1000));
      }
    }
  });
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
  let buf = "", out = "", model: string | undefined, cut = false;
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
        if (ev.type === "message_delta" && ev.delta?.stop_reason === "max_tokens") cut = true;
        if (ev.type === "error") throw new Error(ev.error?.message ?? "The model service reported an error.");
      } catch (e) {
        if (e instanceof SyntaxError) continue;
        throw e;
      }
    }
  }
  record(model, used);
  // An answer cut off by the length limit is never passed on as if it were whole.
  if (cut) throw new Error("The model ran out of room before finishing its answer.");
  if (!out) throw new Error("The model service sent an empty reply.");
  return out;
}

// Batch requests: work nobody is waiting on (filling forms after a file is read) goes through Anthropic's
// Message Batches API at half price. Results usually come back within minutes, at most a day. The batch
// id is stored with the work, so a restart loses nothing; the background sweep collects the results.
export type BatchItem = { id: string; system: string; user: string; maxTokens: number; effort: Effort; cache?: boolean };
// Off unless LLM_BATCH=on (Ismael, 2026-11-15): forms are filled at once at the normal price, about 20 cents more a
// case, so a case is ready in minutes rather than waiting on the batch.
export const batchAvailable = () => llmConfigured() && process.env.LLM_BATCH === "on";

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
export async function runAgent(system: string, history: Turn[], tools: Tool[], handle: (name: string, input: Record<string, unknown>) => Promise<string>, opts: { onText?: (t: string) => void; signal?: AbortSignal } = {}): Promise<string> {
  if (!llmConfigured()) throw new Error("No model is connected.");
  const msgs = [...history];
  const said: string[] = [];
  for (let step = 0; step < 8; step++) {
    guard();
    if (step > 0 && said.length && opts.onText) opts.onText("\n\n");
    const turn = await streamTurn(system, msgs, tools, opts);
    if (turn.text.trim()) said.push(turn.text.trim());
    if (turn.stop === "refusal") throw new Error("The model declined this request.");
    if (turn.stop === "aborted" || !turn.calls.length) return said.join("\n\n") || (turn.stop === "aborted" ? "" : "Done.");
    // The whole reply goes back unchanged, thinking blocks included, as the API requires.
    msgs.push({ role: "assistant", content: turn.content });
    const results = [];
    for (const c of turn.calls) {
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
  return said.join("\n\n") || "Stopped after eight steps. The work so far is saved on the case.";
}

type Content = Record<string, unknown> & { type: string };
/** One model turn, streamed: text is passed on as it arrives; the full content (text, tool calls, thinking with
 *  its signature) is rebuilt exactly, so it can be sent back with the tool results. */
async function streamTurn(system: string, msgs: Turn[], tools: Tool[], opts: { onText?: (t: string) => void; signal?: AbortSignal }) {
  const r = request({ max_tokens: 16000, stream: true, system, tools, messages: msgs }, "medium");
  const signal = opts.signal ? AbortSignal.any([opts.signal, AbortSignal.timeout(180_000)]) : AbortSignal.timeout(180_000);
  const blocks: Content[] = [];
  const partial: Record<number, string> = {};
  let text = "", stop = "", model: string | undefined;
  const used: Usage = {};
  try {
    const res = await fetch(`${base()}/v1/messages`, { method: "POST", headers: r.headers, body: r.body, signal });
    if (!res.ok || !res.body) await fail(res);
    const reader = res.body!.getReader();
    const dec = new TextDecoder();
    let buf = "";
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      let i;
      while ((i = buf.indexOf("\n")) >= 0) {
        const line = buf.slice(0, i).trim();
        buf = buf.slice(i + 1);
        if (!line.startsWith("data:")) continue;
        let ev: Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
        try { ev = JSON.parse(line.slice(5)); } catch { continue; }
        if (ev.type === "message_start") { model = ev.message?.model; Object.assign(used, ev.message?.usage ?? {}); }
        else if (ev.type === "content_block_start") blocks[ev.index] = { ...ev.content_block };
        else if (ev.type === "content_block_delta") {
          const b = blocks[ev.index], d = ev.delta ?? {};
          if (!b) continue;
          if (d.type === "text_delta") { b.text = String(b.text ?? "") + d.text; text += d.text; opts.onText?.(d.text); }
          else if (d.type === "input_json_delta") partial[ev.index] = (partial[ev.index] ?? "") + d.partial_json;
          else if (d.type === "thinking_delta") b.thinking = String(b.thinking ?? "") + d.thinking;
          else if (d.type === "signature_delta") b.signature = String(b.signature ?? "") + d.signature;
        } else if (ev.type === "content_block_stop") {
          const b = blocks[ev.index];
          if (b?.type === "tool_use") { try { b.input = partial[ev.index] ? JSON.parse(partial[ev.index]) : {}; } catch { b.input = {}; } }
        } else if (ev.type === "message_delta") {
          stop = ev.delta?.stop_reason ?? stop;
          used.output_tokens = (used.output_tokens ?? 0) + (ev.usage?.output_tokens ?? 0);
        } else if (ev.type === "error") throw new Error(ev.error?.message ?? "The model service reported an error.");
      }
    }
  } catch (e) {
    if (!opts.signal?.aborted) throw e;
    stop = "aborted";
  } finally {
    addSpend(used, model);
    record(model, used);
  }
  const content = blocks.filter(Boolean);
  const calls = content.filter((b) => b.type === "tool_use").map((b) => ({ id: String(b.id), name: String(b.name), input: (b.input ?? {}) as Record<string, unknown> }));
  return { text, stop, content, calls };
}
