export type Provider = "google" | "microsoft";

/** A connected Google or Microsoft account. One sign in covers every service under it. */
export type Connection = {
  id: string; firm_id: string; user_id: string; provider: Provider; email: string;
  refresh_enc: string; access_enc: string | null; expires_at: number | null;
  last_check: string | null; last_error: string | null; settings: string | null;
};

/** verified: the sender's domain authenticated the message (DMARC), or it came from inside the same organisation. */
export type Inbound = { messageId?: string; auto?: "reply" | "bounce" | null; id: string; threadId: string; from: string; fromName: string; subject: string; text: string; attachments: { name: string; type: string; data: Buffer }[]; verified?: boolean; bulk?: boolean };
/** Whether an email attachment is worth fetching to read. Every document is: PDFs, Word (old and new), Excel, text,
 *  zips, saved and forwarded emails, scans (TIFF). Photos only when sent as files and big enough to be a document;
 *  logos in signatures and invites are not. Lincoln decides later what it can read and names what it cannot. */
export function keepAttachment(name: string, type: string, size: number, inline = false) {
  if (size <= 0 || size >= 25 * 1024 * 1024) return false;
  if (/\.(ics|vcf|p7s|p7m|asc|sig)$/i.test(name) || /^(text\/calendar|text\/x?-?vcard|application\/(pkcs7|x-pkcs7)-signature|application\/pgp-signature)/i.test(type)) return false;
  if (/^image\/tiff?$/i.test(type) || /\.tiff?$/i.test(name)) return !inline && size > 8_000;
  if (/^image\//i.test(type) || /\.(jpe?g|png|webp|heic|heif|gif|bmp)$/i.test(name)) return !inline && size > 60_000;
  return true;
}

export type FileHit = { id: string; name: string; modified: string | null; where: string };
export type OfficeKind = "document" | "spreadsheet" | "presentation";

export const OFFICE_MIME: Record<OfficeKind, string> = {
  document: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  spreadsheet: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  presentation: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
};
export const OFFICE_EXT: Record<OfficeKind, string> = { document: "docx", spreadsheet: "xlsx", presentation: "pptx" };

export type Settings = { granted?: string; folderId?: string; teams?: { teamId: string; channelId: string; name: string }; gchat?: { space: string; name: string }; watchUntil?: number; subId?: string; subUntil?: number };
export const settingsOf = (c: Connection): Settings => { try { return JSON.parse(c.settings ?? "{}"); } catch { return {}; } };

/** One plain address, nothing that could add headers or recipients. */
export function safeAddress(to: string) {
  const a = to.trim().toLowerCase();
  if (!/^[a-z0-9._%+'-]+@[a-z0-9.-]+\.[a-z]{2,}$/.test(a) || a.length > 254) throw new Error("The recipient address is not valid.");
  return a;
}

export type FolderHit = { id: string; name: string; parent: string | null; url: string };

/** The email's own permanent id (its Message-ID header), the same in every mailbox it reaches, without the brackets. */
export const messageIdOf = (raw: string) => raw.trim().replace(/^<|>$/g, "").toLowerCase();

/** Mail no person wrote: an out of office or other automatic reply, or a bounce saying an email could not be delivered.
 *  Read from the standard headers first (RFC 3834 Auto-Submitted, Microsoft's X-Auto-Response-Suppress and
 *  X-MS-Exchange-Inbox-Rules-Loop do not mean this), then from the sender and subject that mail servers use. */
export function automatic(header: (name: string) => string, subject: string, from: string): "reply" | "bounce" | null {
  const local = from.split("@")[0] ?? "";
  if (/^(mailer-daemon|postmaster)$/i.test(local) || /delivery status notification|undeliverable|mail delivery (failed|subsystem)|returned mail|delivery has failed|failure notice/i.test(subject) || /multipart\/report/i.test(header("content-type"))) return "bounce";
  const auto = header("auto-submitted");
  if ((auto && !/^no$/i.test(auto)) || header("x-autoreply") || header("x-autorespond") || /auto_reply/i.test(header("precedence"))) return "reply";
  if (/^(automatic reply|auto(matic)?[ -]?reply|out of (the )?office|abwesenheitsnotiz|r[ée]ponse automatique|respuesta autom[áa]tica)\b/i.test(subject.trim())) return "reply";
  return null;
}
