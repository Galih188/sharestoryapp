import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { StaleWhileRevalidate, CacheFirst } from "workbox-strategies";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { ExpirationPlugin } from "workbox-expiration";

// Precache file statis saat build
precacheAndRoute(self.__WB_MANIFEST);

// Caching halaman utama dan halaman penting lainnya
// Runtime caching
const CACHE_NAME = "api-responses";
const CACHE_WHITELIST = [CACHE_NAME, "pages", "assets"];

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((cacheName) => {
          if (!CACHE_WHITELIST.includes(cacheName)) {
            console.log("Menghapus cache lama:", cacheName);
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

registerRoute(
  ({ url }) => {
    return (
      url.origin === "https://fonts.googleapis.com" ||
      url.origin === "https://fonts.gstatic.com"
    );
  },
  new CacheFirst({
    cacheName: "google-fonts",
  })
);

registerRoute(
  ({ request }) => request.mode === "navigate",
  new StaleWhileRevalidate({
    cacheName: "pages",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 50,
        maxAgeSeconds: 30 * 24 * 60 * 60,
      }), // 30 hari
    ],
  })
);

// Caching API (Dicoding Story API)
registerRoute(
  ({ url }) => url.origin.includes("dicoding"),
  new StaleWhileRevalidate({
    cacheName: "api-responses",
    plugins: [
      new CacheableResponsePlugin({ statuses: [0, 200] }),
      new ExpirationPlugin({ maxEntries: 50, maxAgeSeconds: 7 * 24 * 60 * 60 }), // 7 hari
    ],
  })
);

// Caching assets (gambar, CSS, JS)
registerRoute(
  ({ request }) => ["style", "script", "image"].includes(request.destination),
  new StaleWhileRevalidate({
    cacheName: "assets",
    plugins: [
      new ExpirationPlugin({
        maxEntries: 100,
        maxAgeSeconds: 60 * 60 * 24 * 30,
      }), // 30 hari
    ],
  })
);

// Service Worker untuk menangani push notification
self.addEventListener("install", (event) => {
  console.log("Service Worker: Installed");
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  console.log("Service Worker: Activated");
  return self.clients.claim();
});

self.addEventListener("push", (event) => {
  console.log("Service Worker: Push event received", event);

  const showNotification = async () => {
    try {
      let notificationData;

      if (event.data) {
        notificationData = await event.data.json();
        console.log("Push notification data:", notificationData);
      } else {
        // Fallback jika data tidak diterima
        notificationData = {
          title: "Pemberitahuan Story",
          options: {
            body: "Ada pembaruan story baru",
            icon: "/icons/icon-192x192.png",
            badge: "/icons/badge-72x72.png",
            tag: "story-notification",
          },
        };
      }

      // Tampilkan notifikasi
      await self.registration.showNotification(
        notificationData.title,
        notificationData.options
      );
    } catch (error) {
      console.error("Error showing notification:", error);

      // Fallback notification jika parsing JSON gagal
      await self.registration.showNotification("Pemberitahuan Story", {
        body: "Ada pembaruan dari aplikasi Story",
        icon: "/icons/icon-192x192.png",
        badge: "/icons/badge-72x72.png",
        tag: "story-notification",
      });
    }
  };

  event.waitUntil(showNotification());
});

// Handler untuk klik notifikasi
self.addEventListener("notificationclick", (event) => {
  console.log("Service Worker: Notification clicked", event);

  event.notification.close();

  // Buka aplikasi dan navigasikan ke halaman beranda
  event.waitUntil(
    clients.matchAll({ type: "window" }).then((clientList) => {
      // Jika ada tab yang sudah terbuka, fokuskan
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && "focus" in client) {
          client.navigate("/");
          return client.focus();
        }
      }

      // Jika tidak ada tab yang terbuka, buka tab baru
      if (clients.openWindow) {
        return clients.openWindow("/");
      }
    })
  );
});

// Untuk offline first strategy
self.addEventListener("fetch", (event) => {
  // Jika request adalah ke API stories
  if (
    event.request.url.includes("/stories") &&
    event.request.method === "GET"
  ) {
    // Strategi: Network terlebih dahulu, lalu cache
    event.respondWith(
      fetch(event.request)
        .then((response) => {
          // Simpan salinan response ke cache
          const cloneResponse = response.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request.clonedResponse);
          });

          return response;
        })
        .catch(() => {
          // Jika fetch gagal, coba ambil dari cache
          return caches.match(event.request);
        })
    );
  }
});
