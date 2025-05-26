import { convertBase64ToUint8Array } from "./index";
import { VAPID_PUBLIC_KEY } from "../config";
import {
  subscribePushNotification,
  unsubscribePushNotification,
} from "../data/api";

export function isNotificationAvailable() {
  return "Notification" in window;
}

export function isNotificationGranted() {
  return Notification.permission === "granted";
}

export async function requestNotificationPermission() {
  if (!isNotificationAvailable()) {
    console.error("Notification API unsupported.");
    return false;
  }

  if (isNotificationGranted()) {
    return true;
  }

  const status = await Notification.requestPermission();

  if (status === "denied") {
    alert("Izin notifikasi ditolak.");
    return false;
  }

  if (status === "default") {
    alert("Izin notifikasi ditutup atau diabaikan.");
    return false;
  }

  return true;
}

export async function getPushSubscription() {
  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      console.error("Service worker tidak terdaftar");
      return null;
    }
    return await registration.pushManager.getSubscription();
  } catch (error) {
    console.error("Error getting push subscription:", error);
    return null;
  }
}

export async function isCurrentPushSubscriptionAvailable() {
  return !!(await getPushSubscription());
}

export function generateSubscribeOptions() {
  return {
    userVisibleOnly: true,
    applicationServerKey: convertBase64ToUint8Array(VAPID_PUBLIC_KEY),
  };
}

export async function subscribe() {
  if (!(await requestNotificationPermission())) {
    return;
  }

  if (await isCurrentPushSubscriptionAvailable()) {
    alert("Sudah berlangganan push notification.");
    return;
  }

  console.log("Mulai berlangganan push notification...");

  const failureSubscribeMessage =
    "Langganan push notification gagal diaktifkan.";
  const successSubscribeMessage =
    "Langganan push notification berhasil diaktifkan.";

  try {
    const registration = await navigator.serviceWorker.ready;
    if (!registration) {
      alert(
        "Service worker tidak terdaftar. Muat ulang halaman dan coba lagi."
      );
      return;
    }

    const pushSubscription = await registration.pushManager.subscribe(
      generateSubscribeOptions()
    );

    const { endpoint, keys } = pushSubscription.toJSON();

    const response = await subscribePushNotification({ endpoint, keys });
    if (!response.ok) {
      console.error("subscribe: response:", response);
      alert(failureSubscribeMessage);

      // Undo subscribe to push notification
      await pushSubscription.unsubscribe();
      return;
    }

    alert(successSubscribeMessage);
    return true;
  } catch (error) {
    console.error("subscribe: error:", error);
    alert(failureSubscribeMessage);
    return false;
  }
}

export async function unsubscribe() {
  try {
    const subscription = await getPushSubscription();
    if (!subscription) {
      alert("Anda belum berlangganan notifikasi.");
      return false;
    }

    const { endpoint } = subscription.toJSON();
    const response = await unsubscribePushNotification({ endpoint });

    if (!response.ok) {
      console.error("unsubscribe: response:", response);
      alert("Gagal berhenti berlangganan push notification.");
      return false;
    }

    // Unsubscribe dari browser
    await subscription.unsubscribe();
    alert("Berhasil berhenti berlangganan push notification.");
    return true;
  } catch (error) {
    console.error("unsubscribe: error:", error);
    alert("Gagal berhenti berlangganan push notification.");
    return false;
  }
}

// Tambahan untuk notification-helper.js

const showOnlineSyncNotification = async (message) => {
  // Periksa izin notifikasi
  if (!("Notification" in window)) {
    console.log("Browser tidak mendukung notifikasi");
    return;
  }

  let permission = Notification.permission;

  if (permission === "default") {
    permission = await Notification.requestPermission();
  }

  if (permission === "granted") {
    const notification = new Notification("ShareStory App", {
      body: message,
      icon: "/icons/icon-192x192.png",
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };
  }
};

export { showOnlineSyncNotification };
