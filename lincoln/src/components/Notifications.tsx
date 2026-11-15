"use client";

import { useEffect, useState } from "react";

// Notifications on this device: the service worker, telling the server while the app is open (so nothing
// is pushed to someone already looking at it), the one time request to allow notifications, and the
// switch in Settings.

const ASKED = "lincoln_notify_asked";
const supported = () => typeof window !== "undefined" && "serviceWorker" in navigator && "PushManager" in window && "Notification" in window;
const b64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(s.length / 4) * 4, "=")), (c) => c.charCodeAt(0));

async function registration() {
  return (await navigator.serviceWorker.getRegistration("/")) ?? navigator.serviceWorker.register("/sw.js", { scope: "/" });
}

/** Asks the system for permission and subscribes this device. True when notifications are on. */
export async function turnOn() {
  if (!supported()) return false;
  const perm = await Notification.requestPermission();
  if (perm !== "granted") return false;
  const reg = await registration();
  await navigator.serviceWorker.ready;
  const { key } = (await (await fetch("/api/push")).json()) as { key: string };
  const sub = (await reg.pushManager.getSubscription()) ?? (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: b64(key) }));
  const res = await fetch("/api/push", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(sub.toJSON()) });
  return res.ok;
}

export async function turnOff() {
  if (!supported()) return;
  const sub = await (await navigator.serviceWorker.getRegistration("/"))?.pushManager.getSubscription();
  if (!sub) return;
  await fetch("/api/push", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ endpoint: sub.endpoint }) }).catch(() => undefined);
  await sub.unsubscribe().catch(() => undefined);
}

export async function isOn() {
  if (!supported() || Notification.permission !== "granted") return false;
  return Boolean(await (await navigator.serviceWorker.getRegistration("/"))?.pushManager.getSubscription());
}

export default function Notifications({ enabled }: { enabled: boolean }) {
  const [ask, setAsk] = useState(false);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    if (!supported()) return;
    void registration().then(async () => {
      // A device that allowed notifications before is kept subscribed (the subscription can change).
      if (enabled && Notification.permission === "granted") await turnOn().catch(() => undefined);
    }).catch(() => undefined);

    const here = (state: "here" | "away") => {
      const body = state;
      if (state === "away" && navigator.sendBeacon) navigator.sendBeacon("/api/presence", body);
      else void fetch("/api/presence", { method: "POST", body, keepalive: true }).catch(() => undefined);
    };
    const tick = () => { if (document.visibilityState === "visible") here("here"); };
    const vis = () => here(document.visibilityState === "visible" ? "here" : "away");
    tick();
    const t = setInterval(tick, 20_000);
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("pagehide", () => here("away"));

    // Asked once, a few seconds in, and again two weeks after "Not now".
    if (enabled && Notification.permission === "default") {
      let last = 0;
      try { last = Number(localStorage.getItem(ASKED) ?? 0); } catch { /* storage may be blocked */ }
      if (Date.now() - last > 14 * 864e5) {
        const s = setTimeout(() => { setAsk(true); requestAnimationFrame(() => setShown(true)); }, 4000);
        return () => { clearInterval(t); clearTimeout(s); document.removeEventListener("visibilitychange", vis); };
      }
    }
    return () => { clearInterval(t); document.removeEventListener("visibilitychange", vis); };
  }, [enabled]);

  const close = () => {
    try { localStorage.setItem(ASKED, String(Date.now())); } catch { /* storage may be blocked */ }
    setShown(false);
    setTimeout(() => setAsk(false), 300);
  };

  if (!ask) return null;
  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[79] flex justify-center px-4 pt-[max(12px,env(safe-area-inset-top))]">
      <div role="dialog" aria-label="Notifications" className={`pointer-events-auto w-full max-w-[380px] rounded-2xl border border-line bg-card px-4 py-3.5 shadow-[0_12px_40px_rgba(0,0,0,0.14)] transition duration-300 ease-out ${shown ? "translate-y-0 opacity-100" : "-translate-y-6 opacity-0"}`}>
        <p className="text-[14.5px] font-semibold">Notifications</p>
        <p className="mt-0.5 text-[13.5px] text-muted">Work ready for review and replies finished in the background.</p>
        <div className="mt-3 flex justify-end gap-2">
          <button onClick={close} className="h-9 rounded-lg px-3.5 text-[13.5px] font-medium text-muted transition hover:bg-panel hover:text-ink">Not now</button>
          <button onClick={() => { void turnOn().finally(close); }} className="h-9 rounded-lg bg-ink px-4 text-[13.5px] font-medium text-canvas transition hover:opacity-90">Allow</button>
        </div>
      </div>
    </div>
  );
}

/** The switch in Settings. */
export function NotificationSwitch() {
  const [on, setOn] = useState<boolean | null>(null);
  const [ok, setOk] = useState(true);
  useEffect(() => { setOk(supported()); void isOn().then(setOn); }, []);
  if (!ok) return <p className="text-[13.5px] text-muted">Not available here. On iPhone, add Lincoln to the Home Screen.</p>;
  const denied = typeof Notification !== "undefined" && Notification.permission === "denied";
  return (
    <button
      role="switch"
      aria-checked={Boolean(on)}
      disabled={on === null || denied}
      onClick={async () => { if (on) { await turnOff(); setOn(false); } else setOn(await turnOn()); }}
      className={`relative h-[26px] w-[44px] rounded-full transition disabled:opacity-40 ${on ? "bg-ink" : "bg-line"}`}
    >
      <span className={`absolute top-[3px] h-5 w-5 rounded-full bg-canvas shadow transition-all ${on ? "left-[21px]" : "left-[3px]"}`} />
    </button>
  );
}
