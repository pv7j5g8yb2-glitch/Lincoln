import { db, uid } from "./db";
import { notify } from "./push";

// USCIS case status, through USCIS's own Case Status API (developer.uscis.gov, the Torch programme). Every case with
// a receipt number is checked once a day; when USCIS changes the status, the case shows it at once, the attorney hears
// about it, and an approval, denial or request for evidence moves the case on. Only official access is used: it needs
// credentials USCIS issues to the firm's company after its sandbox and demo steps, set as USCIS_CLIENT_ID and
// USCIS_CLIENT_SECRET; USCIS_API_BASE is the sandbox until USCIS gives the production address. Receipt numbers are
// only those of cases the firm represents.

const base = () => (process.env.USCIS_API_BASE || "https://api-int.uscis.gov").replace(/\/$/, "");
export const uscisConfigured = () => Boolean(process.env.USCIS_CLIENT_ID && process.env.USCIS_CLIENT_SECRET);
const RECEIPT = /^[A-Z]{3}\d{10}$/;

let token: { value: string; until: number } | null = null;
async function accessToken() {
  if (token && token.until > Date.now() + 60_000) return token.value;
  const res = await fetch(`${base()}/oauth/accesstoken`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "client_credentials", client_id: process.env.USCIS_CLIENT_ID!, client_secret: process.env.USCIS_CLIENT_SECRET! }),
  });
  if (!res.ok) throw new Error(`USCIS sign in failed (${res.status})`);
  const j = (await res.json()) as { access_token?: string; expires_in?: string | number };
  if (!j.access_token) throw new Error("USCIS gave no token");
  token = { value: j.access_token, until: Date.now() + (Number(j.expires_in) || 1800) * 1000 };
  return token.value;
}

export type Status = { receipt: string; form: string | null; text: string; detail: string; submitted: string | null; modified: string | null };

/** The status USCIS shows for one receipt number. */
export async function caseStatus(receipt: string): Promise<Status | null> {
  if (!RECEIPT.test(receipt)) return null;
  const res = await fetch(`${base()}/case-status/${receipt}`, { headers: { Authorization: `Bearer ${await accessToken()}` } });
  if (res.status === 401) { token = null; throw new Error("USCIS token refused"); }
  // USCIS errors follow RFC 9457; its message is what is shown.
  if (!res.ok) { const e = (await res.json().catch(() => ({}))) as { errors?: { message?: string }[]; message?: string }; throw new Error((e.errors?.[0]?.message ?? e.message ?? `USCIS replied ${res.status}`).slice(0, 200)); }
  const j = (await res.json()) as { case_status?: { receiptNumber?: string; formType?: string; submittedDate?: string; modifiedDate?: string; current_case_status_text_en?: string; current_case_status_desc_en?: string } };
  const c = j.case_status;
  if (!c?.current_case_status_text_en) return null;
  const plain = (s?: string) => String(s ?? "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
  return { receipt, form: c.formType ?? null, text: plain(c.current_case_status_text_en), detail: plain(c.current_case_status_desc_en).slice(0, 1200), submitted: c.submittedDate ?? null, modified: c.modifiedDate ?? null };
}

/** What a status means for the case: its stage, and an issue when the attorney must act. */
function meaning(text: string): { stage?: string; issue?: { title: string; detail: string } } {
  const t = text.toLowerCase();
  if (/approved|card (is being produced|was (mailed|delivered|picked up))|oath ceremony|welcomed/.test(t) && !/affirm|reopen/.test(t)) return { stage: "Approved" };
  if (/denied|rejected|terminated|revoked/.test(t)) return { stage: "Denied", issue: { title: `USCIS status: ${text}`, detail: "USCIS's case status shows a decision against the case. The written notice should follow by mail; the deadline for a motion or appeal runs from the decision." } };
  if (/request for (additional )?evidence was (sent|mailed)|notice of intent to (deny|revoke)/.test(t)) return { stage: "Response", issue: { title: `USCIS status: ${text}`, detail: "USCIS's case status shows a request for the case. The notice, with its deadline, should follow by mail; the response is drafted as soon as it is in the file." } };
  return {};
}

/** Checks every case with a receipt number whose status could still change. Returns how many changed. */
export async function watchStatuses(limit = 900) {
  if (!uscisConfigured()) return 0;
  const d = db();
  const rows = d.prepare(`SELECT c.id, c.firm_id, c.receipt, c.client, c.attorney_id, c.stage, s.text AS last FROM cases c LEFT JOIN case_status s ON s.case_id = c.id
    WHERE c.receipt IS NOT NULL AND c.stage NOT IN ('Denied') AND (s.checked_at IS NULL OR s.checked_at < ?) ORDER BY s.checked_at LIMIT ?`).all(new Date(Date.now() - 20 * 3600_000).toISOString(), limit) as { id: string; firm_id: string; receipt: string; client: string; attorney_id: string; stage: string; last: string | null }[];
  let changed = 0;
  for (const r of rows) {
    let s: Status | null = null;
    try { s = await caseStatus(r.receipt); } catch (e) {
      d.prepare("INSERT INTO case_status (case_id, firm_id, receipt, checked_at, error) VALUES (?, ?, ?, ?, ?) ON CONFLICT(case_id) DO UPDATE SET checked_at = excluded.checked_at, error = excluded.error").run(r.id, r.firm_id, r.receipt, new Date().toISOString(), e instanceof Error ? e.message : "failed");
      if (/token|sign in/i.test(e instanceof Error ? e.message : "")) break;
      continue;
    }
    const now = new Date().toISOString();
    d.prepare(`INSERT INTO case_status (case_id, firm_id, receipt, form, text, detail, modified, checked_at, changed_at, error) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)
      ON CONFLICT(case_id) DO UPDATE SET receipt = excluded.receipt, form = excluded.form, text = excluded.text, detail = excluded.detail, modified = excluded.modified, checked_at = excluded.checked_at, error = NULL,
      changed_at = CASE WHEN case_status.text IS excluded.text THEN case_status.changed_at ELSE excluded.changed_at END`).run(r.id, r.firm_id, r.receipt, s?.form ?? null, s?.text ?? null, s?.detail ?? null, s?.modified ?? null, now, now);
    if (!s || s.text === r.last) continue;
    changed++;
    const m = meaning(s.text);
    d.prepare("INSERT INTO activity (id, firm_id, case_id, at, actor, kind, text, minutes) VALUES (?, ?, ?, ?, 'Lincoln', 'file', ?, 2)").run(uid(), r.firm_id, r.id, now, `USCIS status for ${r.receipt}: ${s.text}.`);
    if (m.stage && m.stage !== r.stage) d.prepare("UPDATE cases SET stage = ? WHERE firm_id = ? AND id = ?").run(m.stage, r.firm_id, r.id);
    if (m.issue) {
      d.prepare("INSERT INTO issues (id, firm_id, case_id, kind, severity, title, detail, sources, status, created_at) VALUES (?, ?, ?, 'date', 'high', ?, ?, '[]', 'open', ?)").run(uid(), r.firm_id, r.id, m.issue.title.slice(0, 200), m.issue.detail, now);
      d.prepare("UPDATE cases SET state = 'needs_you' WHERE firm_id = ? AND id = ?").run(r.firm_id, r.id);
    }
    if (r.last !== null) notify(r.attorney_id, { title: r.client, body: s.text, url: `/cases/${r.id}`, tag: `status:${r.id}` });
  }
  return changed;
}

/** The status shown on a case, if Lincoln has one. */
export const statusOf = (firmId: string, caseId: string) => db().prepare("SELECT text, detail, checked_at, changed_at, error FROM case_status WHERE firm_id = ? AND case_id = ?").get(firmId, caseId) as { text: string | null; detail: string | null; checked_at: string; changed_at: string | null; error: string | null } | undefined;
