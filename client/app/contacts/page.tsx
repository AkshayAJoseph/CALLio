"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { NavBar } from "@/components/NavBar";
import { ContactAvatar } from "@/components/ContactAvatar";
import {
  getContacts,
  subscribeContacts,
  addContact,
  deleteContact,
  Contact,
  Relationship,
  CallIntent,
} from "@/lib/contacts";

const RELATIONSHIPS: Relationship[] = ["Family", "Friend", "Doctor", "Guardian", "Other"];
const INTENTS: CallIntent[] = ["Just saying hello", "Need to talk", "Urgent", "Emergency"];

const INTENT_COLOUR: Record<CallIntent, string> = {
  "Just saying hello": "bg-sky-100 text-sky-700",
  "Need to talk": "bg-amber-100 text-amber-700",
  Urgent: "bg-orange-100 text-orange-700",
  Emergency: "bg-red-100 text-red-700",
};

const REL_COLOUR: Record<Relationship, string> = {
  Family: "bg-[#fde8d6] text-[#9a3412]",
  Friend: "bg-[#f3e8ff] text-[#6b21a8]",
  Doctor: "bg-[#dbeafe] text-[#1d4ed8]",
  Guardian: "bg-[#e8f5c8] text-[#3d6010]",
  Other: "bg-slate-100 text-slate-600",
};

interface AddContactForm {
  name: string;
  phone: string;
  relationship: Relationship;
  isTrustedGuardian: boolean;
  defaultIntent: CallIntent;
  photoPreview: string | null;
}

const EMPTY_FORM: AddContactForm = {
  name: "",
  phone: "",
  relationship: "Family",
  isTrustedGuardian: false,
  defaultIntent: "Just saying hello",
  photoPreview: null,
};

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>(getContacts());
  const [query, setQuery] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [form, setForm] = useState<AddContactForm>(EMPTY_FORM);
  const [formError, setFormError] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Subscribe to contact store changes
  useEffect(() => {
    const unsub = subscribeContacts(() => setContacts(getContacts()));
    return unsub;
  }, []);

  // Filtered list
  const filtered = contacts.filter((c) => {
    const q = query.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      c.phone.includes(q) ||
      c.relationship.toLowerCase().includes(q)
    );
  });

  // Photo upload
  function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, photoPreview: ev.target?.result as string }));
    };
    reader.readAsDataURL(file);
  }

  function handleSave() {
    setFormError("");
    if (!form.name.trim()) { setFormError("Name is required."); return; }
    if (!form.phone.trim()) { setFormError("Phone number is required."); return; }

    addContact({
      name: form.name.trim(),
      phone: form.phone.trim(),
      relationship: form.relationship,
      isTrustedGuardian: form.isTrustedGuardian,
      defaultIntent: form.defaultIntent,
      photoUrl: form.photoPreview,
    });

    setShowModal(false);
    setForm(EMPTY_FORM);
  }

  function handleDelete(id: string) {
    deleteContact(id);
    setDeleteConfirm(null);
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-800">
      <NavBar />

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Page header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-[#173B63]">Contacts</h1>
            <p className="text-sm text-slate-500 mt-0.5">{contacts.length} contacts in your network</p>
          </div>
          <button
            onClick={() => { setShowModal(true); setForm(EMPTY_FORM); setFormError(""); }}
            className="flex items-center gap-2 bg-[#2B6CB0] hover:bg-[#235891] text-white font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-colors text-sm"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.75 4.75a.75.75 0 00-1.5 0v4.5h-4.5a.75.75 0 000 1.5h4.5v4.5a.75.75 0 001.5 0v-4.5h4.5a.75.75 0 000-1.5h-4.5v-4.5z" />
            </svg>
            Add Contact
          </button>
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <svg viewBox="0 0 20 20" fill="currentColor" className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 pointer-events-none">
            <path fillRule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clipRule="evenodd" />
          </svg>
          <input
            type="search"
            placeholder="Search contacts by name, number, or relationship…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]/30 focus:border-[#2B6CB0] transition"
          />
        </div>

        {/* Contact grid */}
        {filtered.length === 0 ? (
          <div className="text-center py-20 text-slate-400">
            <svg viewBox="0 0 48 48" fill="none" className="h-14 w-14 mx-auto mb-3 opacity-40">
              <circle cx="24" cy="20" r="8" stroke="currentColor" strokeWidth="2.5" />
              <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <p className="text-sm font-medium">No contacts found</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {filtered.map((c) => (
              <div key={c.id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-4 flex gap-4 items-start hover:shadow-md transition-shadow group">
                <ContactAvatar contact={c} size="md" />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-slate-800 text-sm truncate">{c.name}</h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full ${REL_COLOUR[c.relationship]}`}>
                      {c.relationship}
                    </span>
                    {c.isTrustedGuardian && (
                      <span className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#A7C957]/20 text-[#3d6010] border border-[#A7C957]/40">
                        <svg viewBox="0 0 16 16" fill="currentColor" className="h-2.5 w-2.5">
                          <path d="M8 1l1.72 3.486 3.849.56-2.785 2.714.657 3.831L8 9.751l-3.441 1.84.657-3.831L2.431 5.046l3.849-.56L8 1z" />
                        </svg>
                        Guardian
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5 font-mono">{c.phone}</p>
                  <div className="mt-1.5 flex items-center gap-2">
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${INTENT_COLOUR[c.defaultIntent]}`}>
                      {c.defaultIntent}
                    </span>
                    {c.isTrustedGuardian && (
                      <span className="text-[10px] text-[#3d6010] font-medium">Auto-answer enabled</span>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 shrink-0">
                  <Link
                    href={`/dialer?number=${encodeURIComponent(c.phone)}`}
                    className="flex items-center justify-center h-8 w-8 rounded-xl bg-[#2B6CB0] hover:bg-[#235891] text-white shadow-sm transition-colors"
                    title="Call"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path fillRule="evenodd" d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.582a1.5 1.5 0 01-1.052 1.74l-.537.17a.75.75 0 00-.49.72c.031 1.23.4 2.47 1.078 3.562.712 1.147 1.72 2.08 2.91 2.739a.75.75 0 00.758-.048l.47-.334a1.5 1.5 0 011.844.12l2.623 2.623A1.5 1.5 0 0116.5 19h-1C7.163 19 1 12.837 1 5V4a1.5 1.5 0 011-1.415V3.5z" clipRule="evenodd" />
                    </svg>
                  </Link>
                  <button
                    onClick={() => setDeleteConfirm(c.id)}
                    className="flex items-center justify-center h-8 w-8 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 transition-colors"
                    title="Delete"
                  >
                    <svg viewBox="0 0 20 20" fill="currentColor" className="h-3.5 w-3.5">
                      <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5zM10 4c.84 0 1.673.025 2.5.075V3.75c0-.69-.56-1.25-1.25-1.25h-2.5c-.69 0-1.25.56-1.25 1.25v.325C8.327 4.025 9.16 4 10 4zM8.58 7.72a.75.75 0 00-1.5.06l.3 7.5a.75.75 0 101.5-.06l-.3-7.5zm4.34.06a.75.75 0 10-1.5-.06l-.3 7.5a.75.75 0 101.5.06l.3-7.5z" clipRule="evenodd" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ===== Add Contact Modal ===== */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
          onClick={(e) => { if (e.target === e.currentTarget) setShowModal(false); }}
        >
          <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden">
            {/* Modal header */}
            <div className="bg-[#173B63] px-6 py-4 flex items-center justify-between">
              <h2 className="text-white font-bold text-lg">Add New Contact</h2>
              <button onClick={() => setShowModal(false)} className="text-sky-200 hover:text-white transition-colors">
                <svg viewBox="0 0 20 20" fill="currentColor" className="h-5 w-5">
                  <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
                </svg>
              </button>
            </div>

            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              {/* Photo upload */}
              <div className="flex flex-col items-center gap-3">
                {form.photoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={form.photoPreview} alt="Preview" className="h-24 w-24 rounded-full object-cover border-4 border-white shadow-lg" />
                ) : (
                  <div className="h-24 w-24 rounded-full bg-slate-100 border-4 border-white shadow-lg flex items-center justify-center text-slate-400">
                    <svg viewBox="0 0 48 48" fill="none" className="h-10 w-10">
                      <circle cx="24" cy="20" r="8" stroke="currentColor" strokeWidth="2.5" />
                      <path d="M8 40c0-8.837 7.163-16 16-16s16 7.163 16 16" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                    </svg>
                  </div>
                )}
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs text-[#2B6CB0] font-semibold hover:underline"
                >
                  {form.photoPreview ? "Change photo" : "Upload photo (optional)"}
                </button>
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Full Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Sarah Johnson"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]/30 focus:border-[#2B6CB0] transition"
                />
              </div>

              {/* Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Phone Number *</label>
                <input
                  type="tel"
                  placeholder="+61 400 000 000"
                  value={form.phone}
                  onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm font-mono text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]/30 focus:border-[#2B6CB0] transition"
                />
              </div>

              {/* Relationship */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Relationship</label>
                <select
                  value={form.relationship}
                  onChange={(e) => setForm((f) => ({ ...f, relationship: e.target.value as Relationship }))}
                  className="w-full border border-slate-200 rounded-xl px-3.5 py-2.5 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]/30 focus:border-[#2B6CB0] transition bg-white"
                >
                  {RELATIONSHIPS.map((r) => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

              {/* Default intent */}
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5 uppercase tracking-wide">Default Call Intent</label>
                <div className="grid grid-cols-2 gap-2">
                  {INTENTS.map((intent) => (
                    <button
                      key={intent}
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, defaultIntent: intent }))}
                      className={`rounded-xl px-3 py-2 text-xs font-semibold border transition-all text-left ${
                        form.defaultIntent === intent
                          ? "bg-[#2B6CB0] text-white border-[#2B6CB0] shadow-sm"
                          : "bg-white text-slate-600 border-slate-200 hover:border-[#2B6CB0]/50"
                      }`}
                    >
                      {intent}
                    </button>
                  ))}
                </div>
              </div>

              {/* Trusted Guardian */}
              <label className="flex items-start gap-3 cursor-pointer p-3 rounded-xl border border-slate-100 hover:bg-slate-50 transition-colors">
                <div className="relative mt-0.5">
                  <input
                    type="checkbox"
                    checked={form.isTrustedGuardian}
                    onChange={(e) => setForm((f) => ({ ...f, isTrustedGuardian: e.target.checked }))}
                    className="sr-only"
                  />
                  <div className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-colors ${form.isTrustedGuardian ? "bg-[#A7C957] border-[#A7C957]" : "border-slate-300"}`}>
                    {form.isTrustedGuardian && (
                      <svg viewBox="0 0 12 12" fill="currentColor" className="h-3 w-3 text-white">
                        <path d="M10 3L5 8 2 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    )}
                  </div>
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
                    Trusted Guardian
                    <span className="text-[10px] bg-[#A7C957]/20 text-[#3d6010] px-1.5 py-0.5 rounded-full font-bold">Auto-answer</span>
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">Calls from this person will auto-answer on the Dependent portal after a 3-second countdown.</p>
                </div>
              </label>

              {formError && (
                <p className="text-sm text-red-600 font-medium">{formError}</p>
              )}
            </div>

            {/* Modal actions */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="flex-1 bg-[#2B6CB0] hover:bg-[#235891] text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors text-sm"
              >
                Save Contact
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== Delete Confirmation ===== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 text-center">
            <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg viewBox="0 0 20 20" fill="currentColor" className="h-6 w-6 text-red-500">
                <path fillRule="evenodd" d="M8.75 1A2.75 2.75 0 006 3.75v.443c-.795.077-1.584.176-2.365.298a.75.75 0 10.23 1.482l.149-.022.841 10.518A2.75 2.75 0 007.596 19h4.807a2.75 2.75 0 002.742-2.53l.841-10.52.149.023a.75.75 0 00.23-1.482A41.03 41.03 0 0014 4.193V3.75A2.75 2.75 0 0011.25 1h-2.5z" clipRule="evenodd" />
              </svg>
            </div>
            <h3 className="font-bold text-slate-800 text-lg mb-2">Remove contact?</h3>
            <p className="text-sm text-slate-500 mb-6">This contact will be removed from your network.</p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 border border-slate-200 text-slate-600 font-semibold py-2.5 rounded-xl hover:bg-slate-50 transition-colors text-sm">
                Cancel
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 bg-red-500 hover:bg-red-600 text-white font-semibold py-2.5 rounded-xl shadow-sm transition-colors text-sm">
                Remove
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
