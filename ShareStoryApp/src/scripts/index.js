// CSS imports
import "../styles/styles.css";
import "../styles/responsive.css";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
window.L = L; // agar bisa dipakai di class halaman

import App from "./pages/app";
import { registerServiceWorker } from "./utils/service-worker-registration";
import StoryModel from "./data/story-model";

document.addEventListener("DOMContentLoaded", async () => {
  const app = new App({
    content: document.querySelector("#main-content"),
    drawerButton: document.querySelector("#drawer-button"),
    navigationDrawer: document.querySelector("#navigation-drawer"),
  });

  // Register service worker first
  try {
    await registerServiceWorker();
    console.log("Service worker registered successfully");
  } catch (error) {
    console.error("Failed to register service worker:", error);
  }

  // for demonstration purpose-only
  console.log("Berhasil mendaftarkan service worker.");

  // Then render the app
  await app.renderPage();

  window.addEventListener("hashchange", async () => {
    await app.renderPage();
  });
});

// Tambahkan event listener untuk deteksi online
window.addEventListener("online", async () => {
  console.log("Online status: Connected");

  try {
    // Hapus notifikasi offline jika ada
    const offlineNotification = document.querySelector(".offline-notification");
    if (offlineNotification) {
      offlineNotification.style.display = "none";
    }

    // Tampilkan notifikasi online
    const notification = document.createElement("div");
    notification.className = "online-notification";
    notification.textContent = "Anda kembali online. Menyinkronkan data...";
    notification.style.position = "fixed";
    notification.style.top = "0";
    notification.style.left = "0";
    notification.style.right = "0";
    notification.style.backgroundColor = "#4caf50";
    notification.style.color = "white";
    notification.style.padding = "1rem";
    notification.style.textAlign = "center";
    notification.style.zIndex = "1000";
    document.body.appendChild(notification);

    // Sinkronkan cerita yang pending
    const storyModel = new StoryModel();
    const result = await storyModel.syncPendingStories();

    // Update notifikasi
    if (result.synced > 0) {
      notification.textContent = `Sinkronisasi selesai: ${result.synced} cerita berhasil dikirim ke server`;
    } else {
      notification.textContent =
        "Anda kembali online. Tidak ada data yang perlu disinkronkan.";
    }

    // Hilangkan notifikasi setelah beberapa detik
    setTimeout(() => {
      notification.style.opacity = "0";
      notification.style.transition = "opacity 0.5s";
      setTimeout(() => {
        document.body.removeChild(notification);
      }, 500);
    }, 3000);

    // Refresh halaman jika berada di halaman home
    if (window.location.hash === "#/" || window.location.hash === "") {
      // Jangan paksa refresh, gunakan router untuk merender ulang halaman
      const customEvent = new Event("online-sync-complete");
      window.dispatchEvent(customEvent);
    }
  } catch (error) {
    console.error("Error during online sync:", error);
  }
});

window.addEventListener("offline", () => {
  console.log("Online status: Disconnected");

  // Tampilkan notifikasi offline
  const notification = document.createElement("div");
  notification.className = "offline-notification";
  notification.textContent =
    "Anda sedang offline. Beberapa fitur mungkin tidak tersedia.";
  notification.style.position = "fixed";
  notification.style.top = "0";
  notification.style.left = "0";
  notification.style.right = "0";
  notification.style.backgroundColor = "#ff9800";
  notification.style.color = "white";
  notification.style.padding = "1rem";
  notification.style.textAlign = "center";
  notification.style.zIndex = "1000";
  document.body.appendChild(notification);
});
