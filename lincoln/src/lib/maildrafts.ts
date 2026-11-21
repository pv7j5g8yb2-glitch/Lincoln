import { db, uid } from "./db";
import { canDraft, connectionsOf, createDraft, deleteDraft, readDraft, updateDraft, type Connection } from "./integrations";
import { recordEdit } from "./memory";

// Drafts in the lawyer's own mailbox. Every email Lincoln prepares for approval is also a draft in the Gmail or
// Outlook it will be sent from, so the lawyer can read, change and send it there. Lincoln keeps the two in step:
// changes made in the mailbox come back (and teach Lincoln the firm's style), a draft sent from the mailbox is
// recorded as sent and approved, and an email approved in Lincoln is sent from that same draft, never twice.

type Msg = { id: string; firm_id: string; case_id: string | null; party: string; email: string | null; subject: string; body: string; thread_id: string | null; mailbox_id: string | null; draft_ref: string | null; draft_box: string | null; draft_at: string | null };
const now = () => new Date().toISOString();
const same = (a: string, b: string) => a.replace(/\s+/g, " ").trim() === b.replace(/\s+/g, " ").trim();
const paras = (t: string) => t.split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
const where = (c: Connection) => (c.provider === "google" ? "Gmail" : "Outlook");
const box = (firmId: string, id: string | null) => (id ? (db().prepare("SELECT * FROM mailboxes WHERE id = ? AND firm_id = ?").get(id, firmId) as Connection | undefined) : undefined);

/** The mailbox an email will be sent from: the one the conversation came in on, else the case attorney's. */
function boxFor(m: Msg) {
  const own = box(m.firm_id, m.mailbox_id);
  if (own && canDraft(own)) return own;
  const att = m.case_id ? (db().prepare("SELECT attorney_id FROM cases WHERE id = ?").get(m.case_id) as { attorney_id: string } | undefined)?.attorney_id : undefined;
  return connectionsOf(m.firm_id, att).find((c) => canDraft(c)) ?? connectionsOf(m.firm_id).find((c) => canDraft(c));
}

/** Puts new drafts in mailboxes and brings back what happened to the ones already there. */
export async function syncDrafts(firmId?: string) {
  const d = db();
  const list = (firmId
    ? d.prepare("SELECT * FROM messages WHERE firm_id = ? AND direction = 'out' AND state = 'needs_approval' AND email IS NOT NULL AND (draft_ref IS NULL OR draft_ref != 'gone') ORDER BY at LIMIT 60").all(firmId)
    : d.prepare("SELECT * FROM messages WHERE direction = 'out' AND state = 'needs_approval' AND email IS NOT NULL AND (draft_ref IS NULL OR draft_ref != 'gone') ORDER BY at LIMIT 200").all()) as Msg[];
  for (const m of list) {
    try {
      if (!m.draft_ref) {
        const c = boxFor(m);
        if (!c) continue;
        const replyTo = m.thread_id ? (d.prepare("SELECT ext_id FROM messages WHERE firm_id = ? AND thread_id = ? AND direction = 'in' AND ext_id IS NOT NULL ORDER BY at DESC LIMIT 1").get(m.firm_id, m.thread_id) as { ext_id: string } | undefined)?.ext_id : undefined;
        const ref = await createDraft(c, { to: m.email!, subject: m.subject, body: m.body, threadId: c.provider === "google" ? m.thread_id : null, replyTo });
        d.prepare("UPDATE messages SET draft_ref = ?, draft_box = ?, draft_at = ? WHERE id = ?").run(ref, c.id, now(), m.id);
        continue;
      }
      const c = box(m.firm_id, m.draft_box);
      if (!c) continue;
      const r = await readDraft(c, m.draft_ref, { to: m.email!, subject: m.subject, threadId: m.thread_id, since: m.draft_at ?? now() });
      if (r.state === "open") {
        if (same(r.body, m.body) && same(r.subject, m.subject)) continue;
        // Changed in the mailbox: Lincoln's copy follows, and the change teaches it the firm's style.
        d.prepare("UPDATE messages SET subject = ?, body = ? WHERE id = ?").run(r.subject.slice(0, 200) || m.subject, r.body.slice(0, 20000), m.id);
        recordEdit(m.firm_id, "email", paras(m.body), paras(r.body));
        d.prepare("INSERT INTO activity (id, firm_id, case_id, at, actor, kind, text, minutes) VALUES (?, ?, ?, ?, 'Lincoln', 'file', ?, 0)").run(uid(), m.firm_id, m.case_id, now(), `The email to ${m.party} was edited in ${where(c)}.`);
      } else if (r.state === "sent") {
        const owner = d.prepare("SELECT id, name FROM users WHERE id = ?").get(c.user_id) as { id: string; name: string } | undefined;
        d.prepare("UPDATE messages SET state = 'sent', at = ?, lincoln_note = ?, draft_ref = 'gone' WHERE id = ?").run(now(), `Sent from ${where(c)}${owner ? ` by ${owner.name}` : ""}.`, m.id);
        d.prepare("UPDATE approvals SET status = 'approved', decided_at = ?, decided_by = ? WHERE firm_id = ? AND kind = 'message' AND status = 'pending' AND payload LIKE ?").run(now(), owner?.id ?? null, m.firm_id, `%"messageId":"${m.id}"%`);
        d.prepare("INSERT INTO activity (id, firm_id, case_id, at, actor, kind, text, minutes) VALUES (?, ?, ?, ?, ?, 'send', ?, 0)").run(uid(), m.firm_id, m.case_id, now(), owner?.name ?? "Lincoln", `Sent "${m.subject}" to ${m.party} from ${where(c)}.`);
        if (m.case_id) {
          const left = d.prepare("SELECT COUNT(*) AS n FROM approvals WHERE firm_id = ? AND case_id = ? AND status = 'pending'").get(m.firm_id, m.case_id) as { n: number };
          d.prepare("UPDATE cases SET state = ? WHERE firm_id = ? AND id = ?").run(left.n ? "needs_you" : "moving", m.firm_id, m.case_id);
        }
      } else {
        // Deleted in the mailbox: the email stays in Review, and Lincoln does not put the draft back.
        d.prepare("UPDATE messages SET draft_ref = 'gone' WHERE id = ?").run(m.id);
      }
    } catch (e) {
      console.error("Mailbox draft:", e instanceof Error ? e.message : "error");
    }
  }
}

/** A change made in Lincoln goes to the mailbox draft too. */
export async function pushEdit(firmId: string, messageId: string) {
  const m = db().prepare("SELECT * FROM messages WHERE firm_id = ? AND id = ?").get(firmId, messageId) as Msg | undefined;
  const c = m ? box(firmId, m.draft_box) : undefined;
  if (!m || !c || !m.draft_ref || m.draft_ref === "gone" || !m.email) return;
  await updateDraft(c, m.draft_ref, { to: m.email, subject: m.subject, body: m.body, threadId: c.provider === "google" ? m.thread_id : null });
}

/** A returned email's draft is taken out of the mailbox. */
export async function dropDraft(firmId: string, messageId: string) {
  const m = db().prepare("SELECT * FROM messages WHERE firm_id = ? AND id = ?").get(firmId, messageId) as Msg | undefined;
  const c = m ? box(firmId, m.draft_box) : undefined;
  if (!m || !c || !m.draft_ref || m.draft_ref === "gone") return;
  await deleteDraft(c, m.draft_ref);
  db().prepare("UPDATE messages SET draft_ref = 'gone' WHERE id = ?").run(m.id);
}
