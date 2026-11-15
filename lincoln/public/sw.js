// Lincoln's service worker: shows notifications and opens the right page when one is tapped.
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let n = { title: "Lincoln", body: "", url: "/", tag: "lincoln" };
  try { n = { ...n, ...e.data.json() }; } catch { /* a push without data still shows */ }
  e.waitUntil(self.registration.showNotification(n.title, {
    body: n.body,
    tag: n.tag,
    renotify: true,
    icon: "/icon-192.png",
    badge: "/badge-96.png",
    data: { url: n.url },
  }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = new URL(e.notification.data?.url || "/", self.location.origin).href;
  e.waitUntil((async () => {
    const open = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of open) {
      if (new URL(c.url).origin === self.location.origin && "focus" in c) {
        await c.focus();
        if ("navigate" in c) await c.navigate(url).catch(() => undefined);
        return;
      }
    }
    await self.clients.openWindow(url);
  })());
});
