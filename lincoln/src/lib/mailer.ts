// System email (password resets) through Resend, when RESEND_API_KEY and MAIL_FROM are set.
// Without them, reset emails cannot be sent and the reset link is never shown on screen in production.
export const mailConfigured = () => Boolean(process.env.RESEND_API_KEY && process.env.MAIL_FROM);

export async function sendSystemMail(to: string, subject: string, text: string) {
  if (!mailConfigured()) throw new Error("No mail provider is configured.");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from: process.env.MAIL_FROM, to: [to], subject: subject.replace(/[\r\n]/g, " "), text }),
  });
  if (!res.ok) throw new Error(`Mail provider replied ${res.status}`);
}
