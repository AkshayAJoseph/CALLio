/**
 * Utility for triggering browser notifications and sounds.
 * Amrutha will expand this with proper native Notification API integration.
 */

export function playRingtone() {
  console.log("[Notification] Playing ringtone...");
  // Stub for HTML5 audio ringtone
}

export function showBrowserNotification(title, options) {
  if (!("Notification" in window)) return;
  
  if (Notification.permission === "granted") {
    new Notification(title, options);
  } else if (Notification.permission !== "denied") {
    Notification.requestPermission().then(permission => {
      if (permission === "granted") {
        new Notification(title, options);
      }
    });
  }
}
