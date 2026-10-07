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
      tag: "callio-call",
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

// ---- Ringtone (Web Audio beeps, no audio file needed) ----
let ctx = null;
let timer = null;

function getCtx() {
  const AC = window.AudioContext || (window as any).webkitAudioContext;
  if (!AC) return null;
  ctx = ctx || new AC();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

// Call from a click handler so browsers allow audio later.
export function unlockAudio() {
  try {
    getCtx();
  } catch {
    /* ignore */
  }
}

export function startRingtone() {
  stopRingtone();
  try {
    const c = getCtx();
    if (!c) return;
    const beep = () => {
      const o = c.createOscillator();
      const g = c.createGain();
      o.frequency.value = 880;
      g.gain.setValueAtTime(0.0001, c.currentTime);
      g.gain.exponentialRampToValueAtTime(0.15, c.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, c.currentTime + 0.4);
      o.connect(g).connect(c.destination);
      o.start();
      o.stop(c.currentTime + 0.45);
    };
    beep();
    timer = setInterval(beep, 1500);
  } catch {
    /* ignore */
  }
}

export function stopRingtone() {
  if (timer) clearInterval(timer);
  timer = null;
}

// One click: ask for permission AND unlock audio.
export async function enableAlerts() {
  unlockAudio();
  return requestNotificationPermission();
}
