"use client";

import React, { ChangeEvent, useMemo, useState } from "react";
import { NavBar } from "@/components/NavBar";
import { useMockWebRTC } from "@/lib/mockWebRTC";
import { playChime } from "@/lib/audio";

type Relationship =
  | "Family"
  | "Friend"
  | "Doctor"
  | "Guardian"
  | "Other";

type CallIntent =
  | "Just saying hello"
  | "Need to talk"
  | "Urgent"
  | "Emergency"
  | "Custom";

type Contact = {
  id: string;
  name: string;
  phone: string;
  relationship: Relationship;
  trustedGuardian: boolean;
  initials: string;
  avatarClass: string;
  intent: CallIntent;
  autoAnswer?: boolean;
  photo?: string;
};

const INITIAL_CONTACTS: Contact[] = [
  {
    id: "mum",
    name: "Mum",
    phone: "+61 480 000 111",
    relationship: "Guardian",
    trustedGuardian: true,
    initials: "M",
    avatarClass: "bg-[#E8F2D2] text-[#5D7A22]",
    intent: "Urgent",
    autoAnswer: true,
  },
  {
    id: "sarah",
    name: "Dr. Sarah Adams",
    phone: "+61 480 000 999",
    relationship: "Doctor",
    trustedGuardian: false,
    initials: "SA",
    avatarClass: "bg-[#E3EEF9] text-[#2B6CB0]",
    intent: "Need to talk",
  },
  {
    id: "akhil",
    name: "Akhil",
    phone: "+44 770 000 222",
    relationship: "Family",
    trustedGuardian: false,
    initials: "A",
    avatarClass: "bg-[#FCE9D9] text-[#C56A20]",
    intent: "Just saying hello",
  },
  {
    id: "emergency",
    name: "Emergency Dispatch",
    phone: "000",
    relationship: "Other",
    trustedGuardian: false,
    initials: "SOS",
    avatarClass: "bg-red-100 text-red-600",
    intent: "Emergency",
  },
];

const CALL_INTENTS: {
  value: CallIntent;
  label: string;
  description: string;
  color: string;
  bg: string;
  border: string;
}[] = [
  {
    value: "Just saying hello",
    label: "Just saying hello",
    description: "A casual check-in",
    color: "text-[#3F6010]",
    bg: "bg-[#F2F7E6]",
    border: "border-[#A7C957]",
  },
  {
    value: "Need to talk",
    label: "Need to talk",
    description: "I would like to have a conversation",
    color: "text-[#2B6CB0]",
    bg: "bg-[#EBF4FC]",
    border: "border-[#7FB3E6]",
  },
  {
    value: "Urgent",
    label: "Urgent",
    description: "Please respond soon",
    color: "text-[#B85D1B]",
    bg: "bg-[#FCE9D9]",
    border: "border-[#F4A261]",
  },
  {
    value: "Emergency",
    label: "Emergency",
    description: "Immediate assistance needed",
    color: "text-red-600",
    bg: "bg-red-50",
    border: "border-red-400",
  },
  {
    value: "Custom",
    label: "Custom",
    description: "Tell them exactly what you need",
    color: "text-[#2B6CB0]",
    bg: "bg-[#EBF4FC]",
    border: "border-[#7FB3E6]",
  },
];

export default function ContactsPage() {
  const {
    callState,
    incomingCall,
    startCall,
    answerIncomingCall,
    endActiveCall,
  } = useMockWebRTC();

  const [contacts, setContacts] =
    useState<Contact[]>(INITIAL_CONTACTS);

  const [search, setSearch] = useState("");

  const [showAddModal, setShowAddModal] = useState(false);

  // Call intent picker
  const [showIntentPicker, setShowIntentPicker] =
    useState(false);

  const [selectedContact, setSelectedContact] =
    useState<Contact | null>(null);

  const [selectedIntent, setSelectedIntent] =
    useState<CallIntent>("Just saying hello");

  // Custom intent entered by the user
  const [customIntent, setCustomIntent] = useState("");

  // Used to display the person's name during an outgoing call
  const [activeContactName, setActiveContactName] =
    useState("");

  // Add contact form
  const [newName, setNewName] = useState("");
  const [newPhone, setNewPhone] = useState("");

  const [newRelationship, setNewRelationship] =
    useState<Relationship>("Family");

  const [newTrustedGuardian, setNewTrustedGuardian] =
    useState(false);

  const [newPhoto, setNewPhoto] =
    useState<string | undefined>(undefined);

  const filteredContacts = useMemo(() => {
    const query = search.trim().toLowerCase();

    if (!query) return contacts;

    return contacts.filter(
      (contact) =>
        contact.name.toLowerCase().includes(query) ||
        contact.phone.toLowerCase().includes(query) ||
        contact.relationship.toLowerCase().includes(query)
    );
  }, [contacts, search]);

  // Open the intent picker instead of immediately starting the call.
  const handleCall = (contact: Contact) => {
    setSelectedContact(contact);
    setSelectedIntent(contact.intent);
    setCustomIntent("");
    setShowIntentPicker(true);
  };

  // Start the actual call after the user chooses the intent.
  const confirmCall = () => {
    if (!selectedContact) return;

    const intentToSend =
      selectedIntent === "Custom"
        ? customIntent.trim()
        : selectedIntent;

    // Do not allow an empty custom intent.
    if (!intentToSend) return;

    playChime(true);

    setActiveContactName(selectedContact.name);

    startCall(selectedContact.phone, intentToSend);

    setShowIntentPicker(false);
    setSelectedContact(null);
    setCustomIntent("");
  };

  const cancelIntentPicker = () => {
    setShowIntentPicker(false);
    setSelectedContact(null);
    setCustomIntent("");
  };

  const handleEndCall = () => {
    endActiveCall();
    setActiveContactName("");
  };

  const handlePhotoChange = (
    event: ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      setNewPhoto(undefined);
      return;
    }

    const reader = new FileReader();

    reader.onload = () => {
      setNewPhoto(reader.result as string);
    };

    reader.readAsDataURL(file);
  };

  const resetAddForm = () => {
    setNewName("");
    setNewPhone("");
    setNewRelationship("Family");
    setNewTrustedGuardian(false);
    setNewPhoto(undefined);
  };

  const handleAddContact = () => {
    const name = newName.trim();
    const phone = newPhone.trim();

    if (!name || !phone) return;

    const initials =
      name
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0]?.toUpperCase())
        .join("") || "?";

    const avatarClass =
      newRelationship === "Guardian"
        ? "bg-[#E8F2D2] text-[#5D7A22]"
        : newRelationship === "Doctor"
          ? "bg-[#E3EEF9] text-[#2B6CB0]"
          : newRelationship === "Family"
            ? "bg-[#FCE9D9] text-[#C56A20]"
            : "bg-[#EEF2F7] text-[#475569]";

    const newContact: Contact = {
      id: `contact-${Date.now()}`,
      name,
      phone,
      relationship: newRelationship,
      trustedGuardian: newTrustedGuardian,
      initials,
      avatarClass,
      intent: newTrustedGuardian
        ? "Urgent"
        : "Just saying hello",
      autoAnswer: newTrustedGuardian,
      photo: newPhoto,
    };

    setContacts((prev) => [...prev, newContact]);

    resetAddForm();
    setShowAddModal(false);
  };

  const handleDeleteContact = (id: string) => {
    setContacts((prev) =>
      prev.filter((contact) => contact.id !== id)
    );
  };

  const displayCallName =
    callState === "RINGING"
      ? incomingCall?.from || "Incoming Call"
      : activeContactName || "Contact";

  return (
    <div className="min-h-screen bg-[#F8F9FB] font-sans text-slate-900 antialiased">
      <NavBar />

      {/* ================================================================
          ACTIVE CALL OVERLAY
          ================================================================ */}
      {callState !== "IDLE" && callState !== "ENDED" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173B63]/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-white/20 bg-[#173B63] p-8 text-center text-white shadow-2xl">
            <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full border-2 border-[#7FB3E6] bg-[#1E4670]">
              <span className="text-4xl">📞</span>
            </div>

            <p className="mb-2 text-sm font-bold uppercase tracking-wider text-[#A7C957]">
              {callState === "CALLING"
                ? "Calling"
                : callState === "CONNECTED"
                  ? "Connected"
                  : callState === "RINGING"
                    ? "Incoming Call"
                    : callState}
            </p>

            <h2 className="mb-3 text-3xl font-black">
              {displayCallName}
            </h2>

            <p className="mb-8 text-sm text-slate-300">
              {callState === "CALLING"
                ? "Connecting your call..."
                : callState === "CONNECTED"
                  ? `You are now connected with ${
                      activeContactName || "the caller"
                    }.`
                  : callState === "RINGING"
                    ? "Someone is calling you."
                    : "Call in progress"}
            </p>

            <div className="flex items-center justify-center gap-3">
              {callState === "RINGING" && (
                <button
                  type="button"
                  onClick={answerIncomingCall}
                  className="flex-1 rounded-2xl bg-[#A7C957] py-4 font-black text-[#173B63] transition hover:bg-[#95B846]"
                >
                  ✓ ANSWER
                </button>
              )}

              <button
                type="button"
                onClick={handleEndCall}
                className="flex-1 rounded-2xl bg-red-600 py-4 font-black text-white transition hover:bg-red-700"
              >
                ✕{" "}
                {callState === "CONNECTED"
                  ? "END CALL"
                  : "CANCEL"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          CALL INTENT PICKER
          ================================================================ */}
      {showIntentPicker && selectedContact && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#173B63]/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#EBF4FC] text-2xl">
                📞
              </div>

              <h2 className="text-2xl font-black text-[#173B63]">
                Call {selectedContact.name}
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                What is this call about?
              </p>
            </div>

            <div className="space-y-3">
              {CALL_INTENTS.map((intent) => {
                const isSelected =
                  selectedIntent === intent.value;

                return (
                  <button
                    key={intent.value}
                    type="button"
                    onClick={() => {
                      setSelectedIntent(intent.value);

                      // Clear the previous custom text when
                      // switching away from Custom.
                      if (intent.value !== "Custom") {
                        setCustomIntent("");
                      }
                    }}
                    className={`w-full rounded-2xl border-2 p-4 text-left transition ${
                      isSelected
                        ? `${intent.bg} ${intent.border} shadow-sm`
                        : "border-[#E2E8F0] bg-white hover:bg-[#F8F9FB]"
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <span
                        className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
                          isSelected
                            ? `${intent.border} bg-white`
                            : "border-slate-300"
                        }`}
                      >
                        {isSelected && (
                          <span className="h-2.5 w-2.5 rounded-full bg-[#2B6CB0]" />
                        )}
                      </span>

                      <div className="flex-1">
                        <p
                          className={`font-bold ${
                            isSelected
                              ? intent.color
                              : "text-[#173B63]"
                          }`}
                        >
                          {intent.label}
                        </p>

                        <p className="mt-0.5 text-xs text-slate-500">
                          {intent.description}
                        </p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* ============================================================
                CUSTOM INTENT TEXTBOX
                ============================================================ */}
            {selectedIntent === "Custom" && (
              <div className="mt-4">
                <label
                  htmlFor="custom-intent"
                  className="mb-2 block text-sm font-bold text-[#173B63]"
                >
                  What would you like to tell them?
                </label>

                <textarea
                  id="custom-intent"
                  value={customIntent}
                  onChange={(event) =>
                    setCustomIntent(event.target.value)
                  }
                  placeholder="Type your reason for calling..."
                  rows={3}
                  maxLength={200}
                  autoFocus
                  className="w-full resize-none rounded-2xl border-2 border-[#DDE4EE] bg-white px-4 py-3 text-sm text-[#173B63] outline-none transition placeholder:text-slate-400 focus:border-[#2B6CB0] focus:ring-2 focus:ring-[#2B6CB0]/10"
                />

                <div className="mt-1 text-right text-xs text-slate-400">
                  {customIntent.length}/200
                </div>
              </div>
            )}

            <div className="mt-6 flex gap-3">
              <button
                type="button"
                onClick={cancelIntentPicker}
                className="flex-1 rounded-2xl border border-[#DDE4EE] py-4 font-bold text-slate-600 transition hover:bg-[#F8F9FB]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={confirmCall}
                disabled={
                  selectedIntent === "Custom" &&
                  customIntent.trim().length === 0
                }
                className="flex-1 rounded-2xl bg-[#2B6CB0] py-4 font-black text-white transition hover:bg-[#235891] active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
              >
                Call {selectedContact.name}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================================================================
          PAGE HEADER
          ================================================================ */}
      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-black tracking-tight text-[#173B63]">
              Contacts
            </h1>

            <p className="mt-1 text-sm text-[#2B6CB0]">
              {contacts.length} contacts in your network
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowAddModal(true)}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-[#2B6CB0] px-5 py-3 font-bold text-white shadow-sm transition hover:bg-[#235891] active:scale-95"
          >
            <span className="text-lg">＋</span>
            Add Contact
          </button>
        </section>

        {/* ================================================================
            SEARCH
            ================================================================ */}
        <div className="mb-6">
          <label
            htmlFor="contact-search"
            className="sr-only"
          >
            Search contacts
          </label>

          <div className="flex items-center rounded-2xl border border-[#DDE4EE] bg-white px-4 shadow-sm">
            <span className="mr-3 text-lg text-[#7FB3E6]">
              ⌕
            </span>

            <input
              id="contact-search"
              type="text"
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
              placeholder="Search contacts by name, number, or relationship..."
              className="w-full bg-transparent py-3.5 text-sm text-[#173B63] outline-none placeholder:text-slate-400"
            />
          </div>
        </div>

        {/* ================================================================
            CONTACT GRID
            ================================================================ */}
        {filteredContacts.length > 0 ? (
          <section className="grid gap-4 md:grid-cols-2">
            {filteredContacts.map((contact) => (
              <article
                key={contact.id}
                className="rounded-3xl border border-[#E2E8F0] bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-4">
                  {/* Avatar */}
                  {contact.photo ? (
                    <img
                      src={contact.photo}
                      alt={`${contact.name} profile`}
                      className="h-14 w-14 shrink-0 rounded-full border-2 border-white object-cover shadow-md"
                    />
                  ) : (
                    <div
                      className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border-2 border-white font-bold shadow-md ${contact.avatarClass}`}
                    >
                      {contact.initials}
                    </div>
                  )}

                  {/* Contact information */}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-bold text-[#173B63]">
                        {contact.name}
                      </h2>

                      {/* Relationship */}
                      <span className="rounded-full bg-[#EEF2F7] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-slate-600">
                        {contact.relationship}
                      </span>

                      {/* Trusted status */}
                      {contact.trustedGuardian && (
                        <span className="rounded-full border border-[#A7C957]/50 bg-[#F2F7E6] px-2.5 py-1 text-[10px] font-bold text-[#3F6010]">
                          ★ TRUSTED
                        </span>
                      )}
                    </div>

                    <p className="mt-1 font-mono text-sm text-slate-500">
                      {contact.phone}
                    </p>

                    {contact.autoAnswer && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="rounded-full bg-[#FCE9D9] px-2.5 py-1 text-[10px] font-bold text-[#B85D1B]">
                          Default: Urgent
                        </span>

                        <span className="text-[11px] font-semibold text-[#4A6B1A]">
                          Auto-answer enabled
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex shrink-0 flex-col gap-2">
                    {/* Opens intent picker */}
                    <button
                      type="button"
                      onClick={() => handleCall(contact)}
                      aria-label={`Call ${contact.name}`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2B6CB0] text-lg text-white shadow-sm transition hover:bg-[#235891] active:scale-95"
                    >
                      ☎
                    </button>

                    <button
                      type="button"
                      onClick={() =>
                        handleDeleteContact(contact.id)
                      }
                      aria-label={`Delete ${contact.name}`}
                      className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-50 text-red-500 transition hover:bg-red-100 active:scale-95"
                    >
                      ♡
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </section>
        ) : (
          <div className="rounded-3xl border border-dashed border-[#DDE4EE] bg-white p-12 text-center">
            <p className="font-bold text-[#173B63]">
              No contacts found
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Try another search.
            </p>
          </div>
        )}
      </main>

      {/* ================================================================
          ADD CONTACT MODAL
          ================================================================ */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#173B63]/60 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-3xl bg-white p-6 shadow-2xl sm:p-8">
            <div className="mb-6 flex items-start justify-between">
              <div>
                <h2 className="text-2xl font-black text-[#173B63]">
                  Add Contact
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Add someone to your Cooee network.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  resetAddForm();
                  setShowAddModal(false);
                }}
                className="rounded-xl px-3 py-2 text-xl text-slate-400 hover:bg-[#F8F9FB] hover:text-[#173B63]"
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {/* Profile picture */}
            <div className="mb-6 flex flex-col items-center">
              {newPhoto ? (
                <img
                  src={newPhoto}
                  alt="Selected profile preview"
                  className="h-24 w-24 rounded-full border-4 border-white object-cover shadow-lg"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#EBF4FC] text-2xl font-black text-[#2B6CB0]">
                  ?
                </div>
              )}

              <label className="mt-3 cursor-pointer rounded-xl border border-[#DDE4EE] px-4 py-2 text-sm font-bold text-[#2B6CB0] transition hover:bg-[#F8F9FB]">
                Upload Photo

                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                />
              </label>
            </div>

            <div className="space-y-4">
              {/* Name */}
              <div>
                <label
                  htmlFor="new-contact-name"
                  className="mb-1.5 block text-sm font-bold text-[#173B63]"
                >
                  Name
                </label>

                <input
                  id="new-contact-name"
                  value={newName}
                  onChange={(event) =>
                    setNewName(event.target.value)
                  }
                  placeholder="Enter name"
                  className="w-full rounded-xl border border-[#DDE4EE] px-4 py-3 outline-none focus:border-[#2B6CB0] focus:ring-2 focus:ring-[#2B6CB0]/10"
                />
              </div>

              {/* Phone */}
              <div>
                <label
                  htmlFor="new-contact-phone"
                  className="mb-1.5 block text-sm font-bold text-[#173B63]"
                >
                  Phone Number
                </label>

                <input
                  id="new-contact-phone"
                  value={newPhone}
                  onChange={(event) =>
                    setNewPhone(event.target.value)
                  }
                  placeholder="+61 480 000 111"
                  className="w-full rounded-xl border border-[#DDE4EE] px-4 py-3 font-mono outline-none focus:border-[#2B6CB0] focus:ring-2 focus:ring-[#2B6CB0]/10"
                />
              </div>

              {/* Relationship */}
              <div>
                <label
                  htmlFor="new-contact-relationship"
                  className="mb-1.5 block text-sm font-bold text-[#173B63]"
                >
                  Relationship
                </label>

                <select
                  id="new-contact-relationship"
                  value={newRelationship}
                  onChange={(event) =>
                    setNewRelationship(
                      event.target.value as Relationship
                    )
                  }
                  className="w-full rounded-xl border border-[#DDE4EE] bg-white px-4 py-3 outline-none focus:border-[#2B6CB0]"
                >
                  <option>Family</option>
                  <option>Friend</option>
                  <option>Doctor</option>
                  <option>Guardian</option>
                  <option>Other</option>
                </select>
              </div>

              {/* Trusted Guardian */}
              <label className="flex cursor-pointer items-center gap-3 rounded-2xl bg-[#F2F7E6] p-4">
                <input
                  type="checkbox"
                  checked={newTrustedGuardian}
                  onChange={(event) =>
                    setNewTrustedGuardian(
                      event.target.checked
                    )
                  }
                  className="h-5 w-5 accent-[#2B6CB0]"
                />

                <div>
                  <p className="font-bold text-[#173B63]">
                    Trusted Guardian
                  </p>

                  <p className="text-xs text-slate-500">
                    Enables trusted-guardian behavior such as
                    auto-answer.
                  </p>
                </div>
              </label>
            </div>

            {/* Modal actions */}
            <div className="mt-7 flex gap-3">
              <button
                type="button"
                onClick={() => {
                  resetAddForm();
                  setShowAddModal(false);
                }}
                className="flex-1 rounded-2xl border border-[#DDE4EE] py-3.5 font-bold text-slate-600 transition hover:bg-[#F8F9FB]"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleAddContact}
                disabled={
                  !newName.trim() || !newPhone.trim()
                }
                className="flex-1 rounded-2xl bg-[#2B6CB0] py-3.5 font-bold text-white transition hover:bg-[#235891] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Small accessibility/status indicator */}
      <div className="fixed bottom-5 left-5 flex h-10 w-10 items-center justify-center rounded-full border border-slate-700 bg-slate-900 text-sm font-bold text-white shadow-lg">
        N
      </div>
    </div>
  );
}