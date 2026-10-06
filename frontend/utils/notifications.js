// Browser notification + ringtone service (Pillar 1, Task 3).
// Notifications need HTTPS or localhost. Everything here fails silently
// if the browser blocks it, so the app never crashes.

const supported = () => typeof window !== "undefined" && "Notification" in window;

export const getPermission = () => (supported() ? Notification.permission : "unsupported");

export async function requestNotificationPermission() {
  if (!supported()) return "unsupported";
  if (Notification.permission !== "default") return Notification.permission;
  try {
    return await Notification.requestPermission();
  } catch {
    return Notification.permission;
  }
}

let current = null;

export function notifyIncomingCall(call) {
  if (!supported() || !call) return;
  if (Notification.permission !== "granted") return;
  if (typeof document !== "undefined" && !document.hidden) return; // modal is enough when tab is visible
  try {
    closeCallNotification();
    current = new Notification(`Incoming call: ${call.from}`, {
      body: `${call.intentTag || "Call"}${call.note ? " - " + call.note : ""}`,
      tag: "cooee-call",
      requireInteraction: true,
    });
    current.onclick = () => {
      window.focus();
      closeCallNotification();
    };
  } catch {
    /* ignore */
  }
}

export function closeCallNotification() {
  try {
    current?.close();
  } catch {
    /* ignore */
  }
  current = null;
}
