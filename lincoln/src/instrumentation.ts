// Background work: a safety sweep of connected mailboxes (new mail normally arrives instantly by
// notification), reminders, approaching deadlines, calendar and Teams. One run at a time.
export async function register() {
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  const { tick } = await import("./lib/agent");
  let running = false;
  const run = async () => {
    if (running) return;
    running = true;
    try {
      await tick();
    } catch (e) {
      console.error("Lincoln background work failed:", e instanceof Error ? e.message : "unknown error");
    } finally {
      running = false;
    }
  };
  setTimeout(run, 15_000);
  // Forms filled in a batch are collected every minute, so none waits on the five minute sweep.
  const { collectForms } = await import("./lib/fill");
  setInterval(() => void collectForms().catch(() => undefined), 60_000);
  setInterval(run, Number(process.env.LINCOLN_TICK_MS) || 5 * 60_000);
  // New items for review become notifications for people who are not in the app.
  const { scanReview } = await import("./lib/push");
  scanReview();
  setInterval(() => { try { scanReview(); } catch { /* next round */ } }, 20_000);
  // A checked copy of the database every six hours (and off site when a bucket is set). The first a few minutes in.
  const { backupNow } = await import("./lib/backup");
  const backup = () => void backupNow().catch(() => undefined);
  setTimeout(backup, 3 * 60_000);
  setInterval(backup, 6 * 3600_000);
  // The law library: filled from the official releases a minute in, then checked twice a day (downloads only when a
  // new release is out).
  if (process.env.LAW_SYNC !== "off") {
    const { syncLaw } = await import("./lib/law");
    const law = () => void syncLaw().catch(() => undefined);
    setTimeout(law, 60_000);
    setInterval(law, 12 * 3600_000);
  }
  // Intake files a client never sent are removed after 30 days.
  const { sweepSessions } = await import("./lib/client-intake");
  setInterval(() => { try { sweepSessions(); } catch { /* next round */ } }, 6 * 3600_000);
}
