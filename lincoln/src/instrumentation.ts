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
}
