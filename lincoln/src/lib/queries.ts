import { db } from "./db";
import type { Viewer } from "./session";

// Every function takes the firm id first. There is no query in the app without it.

export type Case = { id: string; ref: string; client: string; counterpart: string | null; type_code: string; type_name: string; family: string; stage: string; state: string; waiting_on: string | null; summary: string; attorney_id: string; paralegal_id: string; opened_at: string; next_date: string | null; next_date_label: string | null; sensitive: number; pages: number; processing: number; note: string | null; client_email: string | null };
export type Doc = { id: string; case_id: string; n: number; title: string; kind: string; page_from: number | null; page_to: number | null; doc_date: string | null; source: string; language: string; is_scan: number; status: string; note: string | null; received_at: string };
export type Criterion = { id: string; n: number; code: string; name: string; citation: string; recommendation: string; strength: string; summary: string; weakness: string; evidence: string };
export type Issue = { id: string; case_id: string; kind: string; severity: string; title: string; detail: string; sources: string; status: string; resolution: string | null; created_at: string; resolved_at: string | null };
export type DateRow = { id: string; case_id: string; label: string; date: string; kind: string; source: string | null; client?: string };
export type Activity = { id: string; case_id: string | null; at: string; actor: string; kind: string; text: string; minutes: number; client?: string | null };
export type Approval = { id: string; case_id: string; kind: string; title: string; brief: string; least_sure: string | null; if_wrong: string | null; payload: string; status: string; assignee_id: string; created_at: string; decided_at: string | null; decided_by: string | null; due: string | null; client?: string; type_code?: string };
export type Message = { id: string; case_id: string | null; direction: string; party: string; party_role: string | null; subject: string; body: string; at: string; state: string; lincoln_note: string | null; email?: string | null; client?: string | null };
export type Draft = { id: string; case_id: string; title: string; kind: string; status: string; version: number; content: string; updated_at: string };
export type Person = { id: string; name: string; email: string; role: string; initials: string; avatar: string | null };

const all = <T>(sql: string, ...a: unknown[]) => db().prepare(sql).all(...a) as T[];

// Restricted cases (asylum, U visa and the like) are visible only to their attorney and paralegal and
// to administrators. Every list a person sees passes through this; background work passes no viewer.
export function hiddenCases(firm: string, v?: Viewer): Set<string> {
  if (!v || v.admin) return new Set();
  const rows = db().prepare("SELECT id FROM cases WHERE firm_id = ? AND sensitive = 1 AND attorney_id IS NOT ? AND paralegal_id IS NOT ?").all(firm, v.id, v.id) as { id: string }[];
  return new Set(rows.map((r) => r.id));
}
const visible = <T extends { case_id?: string | null; id?: string }>(rows: T[], hidden: Set<string>, key: "case_id" | "id" = "case_id") => (hidden.size ? rows.filter((r) => !hidden.has(String(r[key] ?? ""))) : rows);
const one = <T>(sql: string, ...a: unknown[]) => db().prepare(sql).get(...a) as T | undefined;

export const people = (firm: string) => all<Person>("SELECT id, name, email, role, initials, avatar FROM users WHERE firm_id = ? ORDER BY rowid", firm);
export const cases = (firm: string, v?: Viewer) => visible(all<Case>("SELECT * FROM cases WHERE firm_id = ? ORDER BY CASE state WHEN 'needs_you' THEN 0 WHEN 'moving' THEN 1 WHEN 'waiting' THEN 2 ELSE 3 END, opened_at DESC", firm), hiddenCases(firm, v), "id");
export const recentCases = (firm: string, limit = 6, v?: Viewer) => visible(all<Case>("SELECT * FROM cases WHERE firm_id = ? ORDER BY opened_at DESC LIMIT ?", firm, limit), hiddenCases(firm, v), "id");
export const caseById = (firm: string, id: string, v?: Viewer) => {
  const c = one<Case>("SELECT * FROM cases WHERE firm_id = ? AND id = ?", firm, id);
  return c && !hiddenCases(firm, v).has(c.id) ? c : undefined;
};
export const documents = (firm: string, c: string) => all<Doc>("SELECT * FROM documents WHERE firm_id = ? AND case_id = ? ORDER BY n", firm, c);
export const criteria = (firm: string, c: string) => all<Criterion>("SELECT * FROM criteria WHERE firm_id = ? AND case_id = ? ORDER BY n", firm, c);
export const issues = (firm: string, c: string) => all<Issue>("SELECT * FROM issues WHERE firm_id = ? AND case_id = ? ORDER BY CASE status WHEN 'open' THEN 0 ELSE 1 END, CASE severity WHEN 'high' THEN 0 WHEN 'medium' THEN 1 ELSE 2 END, rowid", firm, c);
export const caseDates = (firm: string, c: string) => all<DateRow>("SELECT * FROM dates WHERE firm_id = ? AND case_id = ? ORDER BY date", firm, c);
export const upcomingDates = (firm: string, limit = 8, v?: Viewer) => visible(all<DateRow>("SELECT t.*, c.client FROM dates t JOIN cases c ON c.id = t.case_id WHERE t.firm_id = ? AND t.date >= date('now') ORDER BY t.date LIMIT ?", firm, limit), hiddenCases(firm, v), "case_id");
export const caseActivity = (firm: string, c: string) => all<Activity>("SELECT * FROM activity WHERE firm_id = ? AND case_id = ? ORDER BY at DESC", firm, c);
export const recentActivity = (firm: string, sinceIso: string, limit = 40, v?: Viewer) => visible(all<Activity>("SELECT a.*, c.client FROM activity a LEFT JOIN cases c ON c.id = a.case_id WHERE a.firm_id = ? AND a.at >= ? ORDER BY a.at DESC LIMIT ?", firm, sinceIso, limit), hiddenCases(firm, v), "case_id");
export const activitySince = (firm: string, sinceIso: string, v?: Viewer) => visible(all<Activity>("SELECT a.*, c.client FROM activity a LEFT JOIN cases c ON c.id = a.case_id WHERE a.firm_id = ? AND a.at >= ? AND a.actor = 'Lincoln' ORDER BY a.at", firm, sinceIso), hiddenCases(firm, v), "case_id");
export const pendingApprovals = (firm: string, v?: Viewer) => visible(all<Approval>("SELECT a.*, c.client, c.type_code FROM approvals a JOIN cases c ON c.id = a.case_id WHERE a.firm_id = ? AND a.status = 'pending' ORDER BY a.due, a.created_at", firm), hiddenCases(firm, v), "case_id");
export const decidedApprovals = (firm: string, v?: Viewer) => visible(all<Approval>("SELECT a.*, c.client, c.type_code FROM approvals a JOIN cases c ON c.id = a.case_id WHERE a.firm_id = ? AND a.status != 'pending' ORDER BY a.decided_at DESC LIMIT 20", firm), hiddenCases(firm, v), "case_id");
export const approvalByIdRaw = (firm: string, id: string) => one<Approval>("SELECT a.*, c.client, c.type_code FROM approvals a JOIN cases c ON c.id = a.case_id WHERE a.firm_id = ? AND a.id = ?", firm, id);
export const caseApprovals = (firm: string, c: string) => all<Approval>("SELECT * FROM approvals WHERE firm_id = ? AND case_id = ? AND status = 'pending' ORDER BY created_at", firm, c);
export const messages = (firm: string, v?: Viewer) => visible(all<Message>("SELECT m.*, c.client FROM messages m LEFT JOIN cases c ON c.id = m.case_id WHERE m.firm_id = ? ORDER BY m.at DESC", firm), hiddenCases(firm, v), "case_id");
export const caseMessages = (firm: string, c: string) => all<Message>("SELECT * FROM messages WHERE firm_id = ? AND case_id = ? ORDER BY at DESC", firm, c);
export const messageById = (firm: string, id: string) => one<Message>("SELECT * FROM messages WHERE firm_id = ? AND id = ?", firm, id);
export const caseDrafts = (firm: string, c: string) => all<Draft>("SELECT * FROM drafts WHERE firm_id = ? AND case_id = ? ORDER BY updated_at DESC", firm, c);
export const draftById = (firm: string, id: string) => one<Draft>("SELECT * FROM drafts WHERE firm_id = ? AND id = ?", firm, id);
export const kv = (firm: string, key: string) => one<{ value: string }>("SELECT value FROM kv WHERE firm_id = ? AND key = ?", firm, key)?.value ?? null;
export const setKv = (firm: string, key: string, value: string) => db().prepare("INSERT INTO kv (firm_id, key, value) VALUES (?, ?, ?) ON CONFLICT(firm_id, key) DO UPDATE SET value = excluded.value").run(firm, key, value);
export const chatHistory = (firm: string, user: string, caseId: string | null = null) => all<{ id: string; role: string; content: string; at: string }>("SELECT id, role, content, at FROM chat WHERE firm_id = ? AND user_id = ? AND case_id IS ? ORDER BY at", firm, user, caseId);

export const approvalById = (firm: string, id: string, v?: Viewer) => {
  const a = approvalByIdRaw(firm, id);
  return a && !hiddenCases(firm, v).has(a.case_id) ? a : undefined;
};

export type FormRow = { id: string; case_id: string; code: string; title: string; status: string; fields: number; layout: string; answers: string; updated_at: string };
export const caseForms = (firm: string, c: string) => all<FormRow>("SELECT * FROM forms WHERE firm_id = ? AND case_id = ? ORDER BY CASE code WHEN 'G-28' THEN 0 ELSE 1 END, rowid", firm, c);

