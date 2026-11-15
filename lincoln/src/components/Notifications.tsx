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
  useEffect(() => {
    if (!supported()) return;
    void registration().then(async () => {
      // A device that allowed notifications before is kept subscribed (the subscription can change).
      if (enabled && Notification.permission === "granted") await turnOn().catch(() => undefined);
    }).catch(() => undefined);

    const here = (state: "here" | "away") => {
      if (state === "away" && navigator.sendBeacon) navigator.sendBeacon("/api/presence", state);
      else void fetch("/api/presence", { method: "POST", body: state, keepalive: true }).catch(() => undefined);
    };
    const tick = () => { if (document.visibilityState === "visible") here("here"); };
    const vis = () => here(document.visibilityState === "visible" ? "here" : "away");
    const leave = () => here("away");
    tick();
    const t = setInterval(tick, 20_000);
    document.addEventListener("visibilitychange", vis);
    window.addEventListener("pagehide", leave);

    // The system's own permission box, with no box of Lincoln's before it. Phones and browsers only show it
    // in answer to a tap, so it comes up on the first tap a few seconds in; after "Don't Allow" the system
    // does not ask again, and the switch in Settings stays available.
    let ask: ((e: Event) => void) | null = null;
    let arm: ReturnType<typeof setTimeout> | null = null;
    if (enabled && Notification.permission === "default") {
      let last = 0;
      try { last = Number(localStorage.getItem(ASKED) ?? 0); } catch { /* storage may be blocked */ }
      if (Date.now() - last > 14 * 864e5) {
        ask = () => {
          document.removeEventListener("click", ask!, true);
          try { localStorage.setItem(ASKED, String(Date.now())); } catch { /* storage may be blocked */ }
          void turnOn().catch(() => undefined);
        };
        arm = setTimeout(() => document.addEventListener("click", ask!, true), 3000);
      }
    }
    return () => {
      clearInterval(t);
      if (arm) clearTimeout(arm);
      if (ask) document.removeEventListener("click", ask, true);
      document.removeEventListener("visibilitychange", vis);
      window.removeEventListener("pagehide", leave);
    };
  }, [enabled]);
  return null;
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
