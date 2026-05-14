/// <reference lib="webworker" />

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("install", () => {
  console.log("Maximize Meet SW: Installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Maximize Meet SW: Activated");
  event.waitUntil(self.clients.claim());
});

// Handle push notifications
self.addEventListener("push", (event) => {
  if (event.data) {
    const data = event.data.json();
    const options = {
      body: data.body,
      icon: "/icons/icon-192x192.png",
      badge: "/icons/icon-192x192.png",
      vibrate: [100, 50, 100],
      data: {
        url: data.url || "/dashboard",
      },
      actions: [
        { action: "open", title: "Open App" },
        { action: "close", title: "Dismiss" },
      ],
    };

    event.waitUntil(
      self.registration.showNotification(data.title || "Maximize Meet", options)
    );
  }
});

// Handle notification clicks
self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    self.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (self.clients.openWindow) {
        return self.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background Sync for offline messages or logs
self.addEventListener("sync", (event) => {
  if (event.tag === "sync-messages") {
    console.log("Maximize Meet SW: Syncing messages...");
    // Future: Add message sync logic here
  }
});

// Heartbeat to keep the SW alive when needed
self.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    self.skipWaiting();
  }
  
  if (event.data && event.data.type === "HEARTBEAT") {
    console.log("Maximize Meet SW: Heartbeat received");
  }
});
