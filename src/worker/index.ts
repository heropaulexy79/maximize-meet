const sw = self as unknown as ServiceWorkerGlobalScope;

sw.addEventListener("install", () => {
  console.log("Maximize Meet SW: Installed");
  sw.skipWaiting();
});

sw.addEventListener("activate", (event) => {
  console.log("Maximize Meet SW: Activated");
  event.waitUntil(sw.clients.claim());
});

// Handle push notifications
sw.addEventListener("push", (event) => {
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
      sw.registration.showNotification(data.title || "Maximize Meet", options)
    );
  }
});

// Handle notification clicks
sw.addEventListener("notificationclick", (event) => {
  event.notification.close();

  if (event.action === "close") return;

  const urlToOpen = event.notification.data.url;

  event.waitUntil(
    sw.clients.matchAll({ type: "window", includeUncontrolled: true }).then((windowClients) => {
      // If a window is already open, focus it
      for (const client of windowClients) {
        if (client.url.includes(urlToOpen) && "focus" in client) {
          return client.focus();
        }
      }
      // Otherwise, open a new window
      if (sw.clients.openWindow) {
        return sw.clients.openWindow(urlToOpen);
      }
    })
  );
});

// Background Sync for offline messages or logs
sw.addEventListener("sync", (event: any) => {
  if (event.tag === "sync-messages") {
    console.log("Maximize Meet SW: Syncing messages...");
    // Future: Add message sync logic here
  }
});

// Heartbeat to keep the SW alive when needed
sw.addEventListener("message", (event) => {
  if (event.data && event.data.type === "SKIP_WAITING") {
    sw.skipWaiting();
  }
  
  if (event.data && event.data.type === "HEARTBEAT") {
    console.log("Maximize Meet SW: Heartbeat received");
  }
});
