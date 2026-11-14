import type Database from "better-sqlite3-multiple-ciphers";
import { uid } from "./db";

// Scripted events for the demo workspace: things that happen in the outside world, and what
// Lincoln does about them. In a live firm these arrive through the firm's mail, not a button.

type Ctx = { d: Database.Database; firm: string; now: string; day: (n: number) => string };
type Event = { label: string; run: (c: Ctx) => void };

const act = (c: Ctx, caseId: string | null, kind: string, text: string, minutes: number) =>
  c.d.prepare("INSERT INTO activity (id, firm_id, case_id, at, actor, kind, text, minutes) VALUES (?, ?, ?, ?, 'Lincoln', ?, ?, ?)").run(uid(), c.firm, caseId, new Date().toISOString(), kind, text, minutes);
const msg = (c: Ctx, id: string, caseId: string, direction: string, party: string, role: string, subject: string, body: string, state: string, note: string) =>
  c.d.prepare("INSERT INTO messages (id, firm_id, case_id, direction, party, party_role, subject, body, at, state, lincoln_note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)").run(id, c.firm, caseId, direction, party, role, subject, body, c.now, state, note);

export const EVENTS: Event[] = [
  {
    label: "The client sends the certified translations",
    run: (c) => {
      msg(c, uid(), "c_halasz", "in", "Réka Halász", "Client", "Certified translations", "Dear Maria,\n\nThe translator sent both back this morning: the award certificate and the newspaper article, each with her certification. Attached.\n\nRéka", "filed", "Read both translations and checked each certification: complete, signed and dated. Filed to the case and closed the translation issue.");
      const ins = c.d.prepare("INSERT INTO documents (id, firm_id, case_id, n, title, kind, page_from, page_to, doc_date, source, language, is_scan, status, note, received_at) VALUES (?, ?, 'c_halasz', ?, ?, 'Translation', NULL, NULL, ?, 'Certified translator', 'English', 0, 'ok', ?, ?)");
      ins.run(uid(), c.firm, 38, "Certified translation: Fiatal Kutatói Díj certificate", c.now.slice(0, 10), "Translator's certification is complete.", c.now);
      ins.run(uid(), c.firm, 39, "Certified translation: Hajdúsági Napló article", c.now.slice(0, 10), "Translator's certification is complete.", c.now);
      c.d.prepare("UPDATE documents SET status = 'ok', note = 'Certified translation received (document ' || CASE n WHEN 14 THEN '38' ELSE '39' END || ').' WHERE firm_id = ? AND case_id = 'c_halasz' AND n IN (14, 15)").run(c.firm);
      c.d.prepare("UPDATE issues SET status = 'resolved', resolution = 'Certified translations received and checked.', resolved_at = ? WHERE firm_id = ? AND id = 'i_translation'").run(c.now, c.firm);
      for (const code of ["B1", "B3"]) {
        const row = c.d.prepare("SELECT id, evidence FROM criteria WHERE firm_id = ? AND case_id = 'c_halasz' AND code = ?").get(c.firm, code) as { id: string; evidence: string };
        const ev = (JSON.parse(row.evidence) as { doc: number; grade: number; note?: string }[]).map((e) => (e.doc === 14 || e.doc === 15 ? { ...e, grade: 3, note: "Translated; supports the fact" } : e));
        c.d.prepare("UPDATE criteria SET evidence = ? WHERE id = ?").run(JSON.stringify(ev), row.id);
      }
      act(c, "c_halasz", "read", "Read two certified translations from the client and checked each translator's certification.", 14);
      act(c, "c_halasz", "evidence", "Closed the translation issue. The Hungarian award and article now count as supporting evidence.", 6);
    },
  },
  {
    label: "A referee signs a letter for Dr. Nair",
    run: (c) => {
      msg(c, uid(), "c_nair", "in", "Dr. Amara Okonkwo", "Referee", "Signed letter for Priya Nair", "Hello, signed copy attached. I added one sentence about the clinical trial data. Good luck to Priya.", "filed", "Signed letter filed. Compared with the draft: one sentence added, consistent with her CV. 3 of 5 letters are now in.");
      c.d.prepare("UPDATE cases SET waiting_on = 'Referees: 2 of 5 letters', summary = 'Three of five referee letters are signed. The petition letter is drafted up to the endeavour section.' WHERE firm_id = ? AND id = 'c_nair'").run(c.firm);
      act(c, "c_nair", "file", "Filed Dr. Okonkwo's signed letter and compared it with the draft: one sentence added, no conflict.", 10);
    },
  },
  {
    label: "USCIS sends a Request for Evidence on an H-1B",
    run: (c) => {
      const due = c.day(81);
      msg(c, uid(), "c_eze", "in", "USCIS", "Government", "Request for Evidence (Form I-797E)", "Request for Evidence on Form I-129 for beneficiary Chidi Eze. USCIS asks for more evidence that the position of Data Platform Engineer is a specialty occupation, and for evidence of the employer and employee relationship at the client site.", "filed", `Read the notice. Two questions asked: specialty occupation and the work at the client site. Response due ${due}. Drafted a document request to the employer.`);
      msg(c, "m_eze_checklist", "c_eze", "out", "Okafor Systems HR", "Employer", "USCIS has asked for more evidence: what we need from you", "Dear Ms Okafor,\n\nUSCIS has asked for more evidence on Chidi Eze's H-1B extension. This is common and we have time to respond. We need from you:\n\n1. A detailed description of the Data Platform Engineer duties, with the share of time on each.\n2. Job postings for the same role, yours and from similar companies, showing the degree required.\n3. The contract and statement of work with the client site, and a letter from the client confirming who supervises his work.\n4. An organisation chart showing his position.\n\nPlease send them by reply within two weeks.\n\nKind regards,\nJames Whitaker\nKestrel Immigration Law", "needs_approval", "Drafted from the two questions in the notice.");
      c.d.prepare("INSERT INTO dates (id, firm_id, case_id, label, date, kind, source) VALUES (?, ?, 'c_eze', 'RFE response due', ?, 'deadline', 'Form I-797E')").run(uid(), c.firm, due);
      c.d.prepare("UPDATE cases SET state = 'needs_you', waiting_on = 'Maria Alvarez: employer request', summary = 'Request for Evidence on two points: specialty occupation and the work at the client site. Employer document request drafted.', next_date = ?, next_date_label = 'RFE response due' WHERE firm_id = ? AND id = 'c_eze'").run(due, c.firm);
      c.d.prepare("INSERT INTO approvals (id, firm_id, case_id, kind, title, brief, payload, status, assignee_id, created_at, due) VALUES (?, ?, 'c_eze', 'message', ?, ?, ?, 'pending', 'u_maria', ?, ?)").run(
        "a_eze_rfe", c.firm, "Email to employer: RFE documents", "The documents needed to answer both questions in the notice.", JSON.stringify({ messageId: "m_eze_checklist" }), c.now, c.day(3));
      act(c, "c_eze", "read", "Read the Request for Evidence and listed the two questions USCIS asked.", 25);
      act(c, "c_eze", "date", "Set the response deadline from the notice.", 3);
      act(c, "c_eze", "draft", "Drafted the document request to the employer.", 30);
    },
  },
  {
    label: "The receipt notice arrives for an I-751",
    run: (c) => {
      msg(c, uid(), "c_petrova", "in", "USCIS", "Government", "Receipt notice (Form I-797C) for Form I-751", "Receipt notice for Form I-751. The notice extends the validity of the Permanent Resident Card for 48 months from the expiry date on the card.", "filed", "Receipt number and the 48 month extension filed to the case. Update to the client drafted.");
      msg(c, "m_petrova_update", "c_petrova", "out", "Sofia Petrova", "Client", "Your receipt notice has arrived", "Dear Sofia,\n\nGood news: USCIS has sent the receipt notice for your I-751. It extends your green card for 48 months from the date printed on the card. Please keep the original notice with your card, and carry both when you travel or start a new job.\n\nWe will let you know as soon as there is any movement.\n\nKind regards,\nDaniel Kim\nKestrel Immigration Law", "needs_approval", "Drafted from the receipt notice.");
      c.d.prepare("INSERT INTO approvals (id, firm_id, case_id, kind, title, brief, payload, status, assignee_id, created_at, due) VALUES (?, ?, 'c_petrova', 'message', ?, ?, ?, 'pending', 'u_james', ?, ?)").run("a_petrova_update", c.firm, "Email to client: receipt notice", "Tells Sofia her card is extended and to carry the notice with it.", JSON.stringify({ messageId: "m_petrova_update" }), c.now, c.day(2));
      c.d.prepare("UPDATE cases SET summary = 'Receipt notice received: her green card is extended for 48 months.' WHERE firm_id = ? AND id = 'c_petrova'").run(c.firm);
      act(c, "c_petrova", "file", "Filed the I-751 receipt notice and recorded the 48 month extension.", 6);
      act(c, "c_petrova", "draft", "Drafted the receipt notice update to the client.", 8);
    },
  },
];
