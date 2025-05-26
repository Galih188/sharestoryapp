import { isServiceWorkerAvailable } from "./index";

/**
 * Fungsi untuk mendaftarkan service worker
 * @returns {Promise<ServiceWorkerRegistration|null>}
 */
export async function registerServiceWorker() {
  if (!isServiceWorkerAvailable()) {
    console.log("Service Worker API tidak didukung di browser ini");
    return null;
  }

  try {
    // Mendaftarkan service worker
    const registration = await navigator.serviceWorker.register(
      "/sw.bundle.js"
    );
    console.log(
      "Service worker berhasil terdaftar dengan scope:",
      registration.scope
    );

    // Memastikan service worker aktif
    if (registration.installing) {
      console.log("Service worker sedang diinstall");
      const worker = registration.installing;

      // Monitor perubahan status service worker
      worker.addEventListener("statechange", () => {
        console.log("Service worker state changed to:", worker.state);
        if (worker.state === "activated") {
          console.log(
            "Service worker telah aktif dan siap untuk push notification"
          );
        }
      });
    } else if (registration.waiting) {
      console.log("Service worker waiting");
    } else if (registration.active) {
      console.log("Service worker active");
    }

    return registration;
  } catch (error) {
    console.error("Gagal mendaftarkan service worker:", error);
    return null;
  }
}
