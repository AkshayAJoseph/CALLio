// Shared intent config used by IntentPicker + IncomingCallModal.
// Full Tailwind class strings on purpose (dynamic class names get purged).
export const INTENTS = {
  Urgent: {
    tag: "Urgent",
    priority: "HIGH",
    icon: "🚨",
    label: "Urgent - Please Pick Up",
    cardOn: "border-red-500 bg-red-500/10 text-red-100",
    badge: "bg-red-600 text-white",
    ring: "border-red-500",
    pulse: true,
  },
  Work: {
    tag: "Work",
    priority: "MEDIUM",
    icon: "💼",
    label: "Work / Flight Update",
    cardOn: "border-amber-400 bg-amber-400/10 text-amber-100",
    badge: "bg-amber-500 text-slate-950",
    ring: "border-amber-400",
    pulse: false,
  },
  Casual: {
    tag: "Casual",
    priority: "LOW",
    icon: "☕",
    label: "Casual - Catching Up",
    cardOn: "border-sky-400 bg-sky-400/10 text-sky-100",
    badge: "bg-sky-600 text-white",
    ring: "border-sky-400",
    pulse: false,
  },
};

// Order shown in the picker: most important first.
export const INTENT_LIST = [INTENTS.Urgent, INTENTS.Work, INTENTS.Casual];

// Locked schema: intentTag is the full label ("Urgent - Please Pick Up").
// Lookup order: exact label -> short key -> priority -> Casual (never crashes).
export const getIntent = (tag, priority) =>
  INTENT_LIST.find((i) => i.label === tag) ||
  INTENTS[tag] ||
  INTENT_LIST.find((i) => i.priority === priority) ||
  INTENTS.Casual;

// ---- Timezone helpers ----
export function formatTimeIn(tz) {
  try {
    return new Date().toLocaleTimeString("en-US", {
      hour: "numeric", minute: "2-digit", ...(tz ? { timeZone: tz } : {}),
    });
  } catch {
    return "";
  }
}

export function hourIn(tz) {
  try {
    const h = new Intl.DateTimeFormat("en-GB", {
      hour: "2-digit", hourCycle: "h23", timeZone: tz,
    }).format(new Date());
    return parseInt(h, 10);
  } catch {
    return null;
  }
}

// "Australia/Sydney" -> "Sydney"
export const cityFromTz = (tz) => (tz ? tz.split("/").pop().replace(/_/g, " ") : "");

export const isLateNight = (tz) => {
  const h = hourIn(tz);
  return h !== null && (h < 7 || h >= 22);
};

export function buildIntent(tag: any, note: string) {
  const i = INTENTS[tag as keyof typeof INTENTS] || INTENTS.Casual;
  const d = new Date();
  return {
    intentTag: i.label,
    priority: i.priority,
    note: note.trim(),
    callerTime: d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }),
    callerTz: Intl.DateTimeFormat().resolvedOptions().timeZone,
  };
}
