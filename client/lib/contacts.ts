// Shared contact store for Cooee UI
// All pages (Dialer, Contacts, Dependent) pull from this single source of truth.

export type Relationship = "Family" | "Friend" | "Doctor" | "Guardian" | "Other";
export type CallIntent = "Just saying hello" | "Need to talk" | "Urgent" | "Emergency";

export interface Contact {
  id: string;
  name: string;
  phone: string;
  relationship: Relationship;
  isTrustedGuardian: boolean;
  defaultIntent: CallIntent;
  /** base64 data-URL or null when using initials avatar */
  photoUrl: string | null;
  /** pre-computed initials for fallback avatar */
  initials: string;
  /** Tailwind classes for initials bg colour */
  avatarBg: string;
  /** Tailwind classes for initials text colour */
  avatarText: string;
}

function makeInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join("");
}

const SEED_CONTACTS: Contact[] = [
  {
    id: "guardian-mum",
    name: "Mum",
    phone: "+61 480 000 111",
    relationship: "Guardian",
    isTrustedGuardian: true,
    defaultIntent: "Urgent",
    photoUrl: null,
    initials: "M",
    avatarBg: "bg-[#e8f5c8]",
    avatarText: "text-[#3d6010]",
  },
  {
    id: "dr-sarah",
    name: "Dr. Sarah Adams",
    phone: "+61 480 000 999",
    relationship: "Doctor",
    isTrustedGuardian: false,
    defaultIntent: "Need to talk",
    photoUrl: null,
    initials: "SA",
    avatarBg: "bg-[#dbeafe]",
    avatarText: "text-[#1d4ed8]",
  },
  {
    id: "brother-akhil",
    name: "Akhil",
    phone: "+44 770 000 222",
    relationship: "Family",
    isTrustedGuardian: false,
    defaultIntent: "Just saying hello",
    photoUrl: null,
    initials: "A",
    avatarBg: "bg-[#fde8d6]",
    avatarText: "text-[#9a3412]",
  },
  {
    id: "emergency-dispatch",
    name: "Emergency Dispatch",
    phone: "000",
    relationship: "Other",
    isTrustedGuardian: false,
    defaultIntent: "Emergency",
    photoUrl: null,
    initials: "SOS",
    avatarBg: "bg-red-100",
    avatarText: "text-red-700",
  },
];

// ---------------------------------------------------------------------------
// Module-level reactive store (no React Context needed)
// ---------------------------------------------------------------------------
let contacts: Contact[] = [...SEED_CONTACTS];
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((fn) => fn());
}

export function getContacts(): Contact[] {
  return contacts;
}

export function getContactById(id: string): Contact | undefined {
  return contacts.find((c) => c.id === id);
}

export function getContactByPhone(phone: string): Contact | undefined {
  const normalized = phone.replace(/[\s\-()]/g, "");
  return contacts.find(
    (c) => c.phone.replace(/[\s\-()]/g, "") === normalized
  );
}

export function subscribeContacts(fn: () => void): () => void {
  subscribers.add(fn);
  return () => subscribers.delete(fn);
}

export function addContact(
  data: Omit<Contact, "id" | "initials" | "avatarBg" | "avatarText">
): Contact {
  const id = "contact-" + Date.now();
  const initials = makeInitials(data.name);

  const PALETTE: Array<{ bg: string; text: string }> = [
    { bg: "bg-[#dbeafe]", text: "text-[#1d4ed8]" },
    { bg: "bg-[#e8f5c8]", text: "text-[#3d6010]" },
    { bg: "bg-[#fde8d6]", text: "text-[#9a3412]" },
    { bg: "bg-[#f3e8ff]", text: "text-[#6b21a8]" },
    { bg: "bg-[#dcfce7]", text: "text-[#166534]" },
    { bg: "bg-[#fef9c3]", text: "text-[#854d0e]" },
  ];
  const palette = PALETTE[contacts.length % PALETTE.length];

  const newContact: Contact = {
    ...data,
    id,
    initials,
    avatarBg: palette.bg,
    avatarText: palette.text,
  };
  contacts = [...contacts, newContact];
  notify();
  return newContact;
}

export function updateContact(id: string, patch: Partial<Contact>): void {
  contacts = contacts.map((c) => {
    if (c.id !== id) return c;
    const updated = { ...c, ...patch };
    // recompute initials if name changed
    if (patch.name) updated.initials = makeInitials(patch.name);
    return updated;
  });
  notify();
}

export function deleteContact(id: string): void {
  contacts = contacts.filter((c) => c.id !== id);
  notify();
}
