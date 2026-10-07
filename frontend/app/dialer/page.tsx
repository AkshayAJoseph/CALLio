"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useMockWebRTC } from "@/lib/mockWebRTC";
import { playDTMFTone, playChime } from "@/lib/audio";

type CallIntent =
  | "Just saying hello"
  | "Need to talk"
  | "Urgent"
  | "Emergency";

interface VirtualSIM {
  number: string;
  country: string;
  flag: string;
  label: string;
  carrier: string;
}

interface QuickContact {
  id: string;
  name: string;
  role: string;
  number: string;
  avatarBg: string;
  avatarText: string;
  initials: string;
  defaultIntent: CallIntent;
  isTrustedGuardian?: boolean;
}

const AVAILABLE_SIMS: VirtualSIM[] = [
  {
    number: "+61 480 000 111",
    country: "Australia",
    flag: "🇦🇺",
    label: "Sydney Core (Primary eSIM)",
    carrier: "CALLiO AU",
  },
  {
    number: "+44 770 000 222",
    country: "United Kingdom",
    flag: "🇬🇧",
    label: "London Gateway (Roaming eSIM)",
    carrier: "CALLiO UK Global",
  },
];

const QUICK_CONTACTS: QuickContact[] = [
  {
    id: "guardian-mum",
    name: "Mum (Guardian)",
    role: "Trusted Guardian",
    number: "+61 480 000 111",
    avatarBg: "bg-[#A7C957]/20 border border-[#A7C957]/40",
    avatarText: "text-[#4A6B1A]",
    initials: "M",
    defaultIntent: "Urgent",
    isTrustedGuardian: true,
  },
  {
    id: "dr-sarah",
    name: "Dr. Sarah Adams",
    role: "Primary Care Physician",
    number: "+61 480 000 999",
    avatarBg: "bg-[#2B6CB0]/15 border border-[#2B6CB0]/30",
    avatarText: "text-[#2B6CB0]",
    initials: "SA",
    defaultIntent: "Need to talk",
  },
  {
    id: "brother-akhil",
    name: "Akhil (Brother)",
    role: "Family Caregiver",
    number: "+44 770 000 222",
    avatarBg: "bg-[#F4A261]/20 border border-[#F4A261]/40",
    avatarText: "text-[#B85D1B]",
    initials: "A",
    defaultIntent: "Just saying hello",
  },
  {
    id: "emergency-service",
    name: "Emergency Dispatch",
    role: "National Priority Response",
    number: "000",
    avatarBg: "bg-red-100 border border-red-300",
    avatarText: "text-red-700",
    initials: "SOS",
    defaultIntent: "Emergency",
  },
];

const INTENT_CONFIG: Record<
  CallIntent,
  {
    title: string;
    icon: string;
    description: string;
    badgeStyle: string;
    activeCard: string;
    inactiveCard: string;
    btnColor: string;
    accentColor: string;
  }
> = {
  "Just saying hello": {
    title: "Just saying hello",
    icon: "👋",
    description: "Casual check-in",
    badgeStyle:
      "bg-[#A7C957]/15 text-[#466814] border-[#A7C957]/40",
    activeCard:
      "border-[#A7C957] bg-[#F2F7E6] text-[#2C4808] ring-2 ring-[#A7C957]/30",
    inactiveCard:
      "border-[#E2E8F0] bg-white hover:bg-[#F8F9FB] text-slate-700",
    btnColor:
      "bg-[#1597E5] hover:bg-[#087FC8] text-white shadow-[#1597E5]/25",
    accentColor: "#A7C957",
  },

  "Need to talk": {
    title: "Need to talk",
    icon: "💬",
    description: "Important conversation",
    badgeStyle:
      "bg-[#2B6CB0]/15 text-[#173B63] border-[#2B6CB0]/30",
    activeCard:
      "border-[#2B6CB0] bg-[#EBF4FC] text-[#173B63] ring-2 ring-[#2B6CB0]/25",
    inactiveCard:
      "border-[#E2E8F0] bg-white hover:bg-[#F8F9FB] text-slate-700",
    btnColor:
      "bg-[#1597E5] hover:bg-[#087FC8] text-white shadow-[#1597E5]/25",
    accentColor: "#2B6CB0",
  },

  Urgent: {
    title: "Urgent",
    icon: "⚡",
    description: "Needs immediate attention",
    badgeStyle:
      "bg-[#F4A261]/20 text-[#A0480A] border-[#F4A261]/40",
    activeCard:
      "border-[#F4A261] bg-[#FDF3EA] text-[#933F07] ring-2 ring-[#F4A261]/30",
    inactiveCard:
      "border-[#E2E8F0] bg-white hover:bg-[#F8F9FB] text-slate-700",
    btnColor:
      "bg-[#E67E22] hover:bg-[#D35400] text-white shadow-[#E67E22]/25",
    accentColor: "#F4A261",
  },

  Emergency: {
    title: "Emergency",
    icon: "🚨",
    description: "Life threatening situation",
    badgeStyle:
      "bg-red-100 text-red-700 border-red-300 animate-pulse",
    activeCard:
      "border-red-500 bg-red-50 text-red-800 ring-2 ring-red-400/30",
    inactiveCard:
      "border-[#E2E8F0] bg-white hover:bg-[#F8F9FB] text-slate-700",
    btnColor:
      "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30",
    accentColor: "#DC2626",
  },
};

export default function WebDialerPage() {
  const {
    myNumber,
    callState,
    incomingCall,
    networkMode,
    telemetry,
    registerNumber,
    startCall,
    answerIncomingCall,
    endActiveCall,
    simulateIncomingCall,
  } = useMockWebRTC();

  const [inputNumber, setInputNumber] = useState("");
  const [selectedIntent, setSelectedIntent] =
    useState<CallIntent>("Just saying hello");

  const [simMenuOpen, setSimMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [callDurationSec, setCallDurationSec] = useState(0);

  const zeroPressTimer = useRef<ReturnType<typeof setTimeout> | null>(
    null
  );

  const zeroLongPressTriggered = useRef(false);

  const activeSIM =
    AVAILABLE_SIMS.find((sim) => sim.number === myNumber) ||
    AVAILABLE_SIMS[0];

  useEffect(() => {
    if (callState !== "CONNECTED") return;

    const timer = setInterval(() => {
      setCallDurationSec((prev) => prev + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [callState]);

  const handleDigitPress = (digit: string) => {
    playDTMFTone(digit);
    setInputNumber((prev) => prev + digit);
  };

  const handleZeroPressStart = () => {
    zeroLongPressTriggered.current = false;

    zeroPressTimer.current = setTimeout(() => {
      zeroLongPressTriggered.current = true;
      setInputNumber((prev) => prev + "+");
      zeroPressTimer.current = null;
    }, 500);
  };

  const handleZeroPressEnd = () => {
    const timer = zeroPressTimer.current;

    if (timer) {
      clearTimeout(timer);
      zeroPressTimer.current = null;

      if (!zeroLongPressTriggered.current) {
        handleDigitPress("0");
      }
    }
  };

  const handleDeleteDigit = () => {
    playDTMFTone("0", 60);
    setInputNumber((prev) => prev.slice(0, -1));
  };

  const handleClearNumber = () => {
    setInputNumber("");
  };

  const handleSelectQuickContact = (contact: QuickContact) => {
    setInputNumber(contact.number);
    setSelectedIntent(contact.defaultIntent);
    playChime(true);
  };

  const handleSIMChange = (sim: VirtualSIM) => {
    registerNumber(sim.number);
    setSimMenuOpen(false);
    playChime(true);
  };

  const handleInitiateCall = () => {
    const target = inputNumber.trim();

    if (!target) return;

    setCallDurationSec(0);
    playChime(true);
    startCall(target, selectedIntent);
  };

  const handleEndCall = () => {
    setCallDurationSec(0);
    endActiveCall();
  };

  const formatSeconds = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;

    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const dialPadKeys = [
    { digit: "1", sub: "" },
    { digit: "2", sub: "ABC" },
    { digit: "3", sub: "DEF" },
    { digit: "4", sub: "GHI" },
    { digit: "5", sub: "JKL" },
    { digit: "6", sub: "MNO" },
    { digit: "7", sub: "PQRS" },
    { digit: "8", sub: "TUV" },
    { digit: "9", sub: "WXYZ" },
    { digit: "*", sub: "" },
    { digit: "0", sub: "+" },
    { digit: "#", sub: "" },
  ];

  return (
    <div className="h-screen overflow-hidden bg-[#F5F8FC] text-slate-900 font-sans antialiased">

      {/* =========================================================
          HEADER
      ========================================================= */}

      <header className="sticky top-0 z-40 bg-[#173B63] text-white shadow-md">

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          <div className="h-[66px] flex items-center justify-between gap-4">

            {/* CALLiO LOGO */}
            <Link
              href="/dialer"
              aria-label="Go to CALLiO Dialer"
              className="shrink-0 flex items-center"
            >
              <div className="h-12 w-[88px] rounded-xl bg-white flex items-center justify-center overflow-hidden shadow-sm">
                <img
                  src="/callio-logo.jpg"
                  alt="CALLiO"
                  className="h-full w-full object-contain"
                />
              </div>
            </Link>

            {/* NAVIGATION */}
            <nav className="hidden md:flex items-center gap-1">

              <Link
                href="/dialer"
                className="rounded-xl bg-white/10 px-4 py-2 text-xs font-bold text-white"
              >
                Dialer
              </Link>

              <Link
                href="/dependent"
                className="rounded-xl px-4 py-2 text-xs font-bold text-blue-100 hover:bg-white/10 hover:text-white transition"
              >
                Emergency Mode
              </Link>

              <Link
                href="/contacts"
                className="rounded-xl px-4 py-2 text-xs font-bold text-blue-100 hover:bg-white/10 hover:text-white transition"
              >
                Contacts
              </Link>

              <Link
                href="/about"
                className="rounded-xl px-4 py-2 text-xs font-bold text-blue-100 hover:bg-white/10 hover:text-white transition"
              >
                About
              </Link>

            </nav>

            {/* RIGHT SIDE */}
            <div className="flex items-center gap-3">

              {/* ONLINE */}
              <div className="hidden sm:flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-[#A7C957]" />
                <span className="text-[10px] font-bold text-blue-100">
                  ONLINE
                </span>
              </div>

              {/* PROFILE */}
              <div className="relative">

                <button
                  type="button"
                  onClick={() =>
                    setProfileMenuOpen((previous) => !previous)
                  }
                  className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/10 transition"
                >

                  <div className="h-9 w-9 rounded-full bg-[#A7C957] text-[#173B63] flex items-center justify-center font-extrabold text-xs">
                    AT
                  </div>

                  <div className="hidden sm:block text-left">
                    <p className="text-xs font-bold">
                      Anjali
                    </p>
                    <p className="text-[8px] text-blue-200">
                      CALLiO member
                    </p>
                  </div>

                  <span className="text-blue-200 text-[10px]">
                    {profileMenuOpen ? "⌃" : "⌄"}
                  </span>

                </button>

                {profileMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-2xl bg-white text-slate-800 border border-[#E2E8F0] shadow-xl overflow-hidden z-50">

                    <div className="px-4 py-3 border-b border-[#E8EDF3]">
                      <p className="font-bold text-sm">
                        Anjali
                      </p>

                      <p className="text-xs text-slate-500 mt-1">
                        {myNumber}
                      </p>
                    </div>

                    <Link
                      href="/profile"
                      onClick={() => setProfileMenuOpen(false)}
                      className="block px-4 py-3 text-xs hover:bg-[#F5F8FC]"
                    >
                      👤 Profile
                    </Link>

                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 text-xs hover:bg-[#F5F8FC]"
                    >
                      ⚙️ Settings
                    </button>

                    <button
                      type="button"
                      className="w-full text-left px-4 py-3 text-xs hover:bg-[#F5F8FC]"
                    >
                      ♿ Accessibility
                    </button>

                  </div>
                )}

              </div>

            </div>

          </div>

          {/* MOBILE NAV */}
          <nav className="md:hidden flex items-center gap-1 overflow-x-auto pb-2">

            <Link
              href="/dialer"
              className="shrink-0 rounded-lg bg-white/10 px-3 py-1.5 text-[10px] font-bold"
            >
              Dialer
            </Link>

            <Link
              href="/dependent"
              className="shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-bold text-blue-100"
            >
              Emergency Mode
            </Link>

            <Link
              href="/contacts"
              className="shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-bold text-blue-100"
            >
              Contacts
            </Link>

            <Link
              href="/about"
              className="shrink-0 rounded-lg px-3 py-1.5 text-[10px] font-bold text-blue-100"
            >
              About
            </Link>

          </nav>

        </div>

      </header>

      {/* =========================================================
          MAIN
      ========================================================= */}

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-5">

        {/* SMALL PAGE TITLE */}

        <div className="flex items-center justify-between mb-4">

          <div>
            <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-[#2B6CB0]">
              Standard Dialer
            </p>

            <h1 className="text-xl sm:text-2xl font-extrabold text-[#173B63] mt-0.5">
              Make a call
            </h1>

            <p className="text-[10px] sm:text-xs text-slate-500 mt-0.5">
              Clear calls • Better connection
            </p>
          </div>

          <div className="hidden sm:flex items-center gap-2 text-[9px]">
            <span className="h-2 w-2 rounded-full bg-[#A7C957]" />
            <span className="font-bold text-slate-600">
              CALLiO network active
            </span>
          </div>

        </div>

        {/* =======================================================
            ACTIVE LINE / SIM
        ======================================================== */}

        <section className="mb-4 rounded-2xl bg-white border border-[#DCE5EF] shadow-sm">

          <div className="px-4 py-2.5 flex items-center justify-between gap-3">

            <div className="flex items-center gap-2.5">

              <div className="h-8 w-8 rounded-lg bg-[#EBF4FC] flex items-center justify-center text-sm">
                {activeSIM.flag}
              </div>

              <div>
                <p className="text-[7px] uppercase tracking-wider font-bold text-slate-400">
                  Active CALLiO line
                </p>

                <p className="text-xs font-mono font-bold text-[#173B63]">
                  {myNumber}
                </p>
              </div>

              <span className="hidden sm:inline-flex text-[7px] font-bold px-2 py-1 rounded-full bg-[#A7C957]/20 text-[#466814]">
                ACTIVE
              </span>

            </div>

            {/* SIM SWITCHER */}
            <div className="relative">

              <button
                type="button"
                onClick={() =>
                  setSimMenuOpen((previous) => !previous)
                }
                className="min-w-[185px] rounded-xl border border-[#DCE5EF] bg-[#F8FAFD] px-3 py-2 flex items-center justify-between gap-4 text-left hover:border-[#7FB3E6] transition"
              >

                <div>
                  <p className="text-[7px] uppercase tracking-wider font-bold text-slate-400">
                    Switch virtual SIM
                  </p>

                  <p className="text-[9px] font-bold text-[#173B63]">
                    {activeSIM.country} · {activeSIM.carrier}
                  </p>
                </div>

                <span className="text-slate-400 text-xs">
                  {simMenuOpen ? "⌃" : "⌄"}
                </span>

              </button>

              {simMenuOpen && (
                <div className="absolute right-0 top-full mt-2 z-30 w-72 rounded-2xl border border-[#E2E8F0] bg-white shadow-xl overflow-hidden">

                  <div className="px-4 py-3 border-b border-[#E8EDF3]">

                    <p className="text-xs font-bold text-[#173B63]">
                      Choose virtual SIM
                    </p>

                    <p className="text-[9px] text-slate-500 mt-1">
                      Switch your CALLiO calling identity
                    </p>

                  </div>

                  {AVAILABLE_SIMS.map((sim) => {

                    const selected = sim.number === myNumber;

                    return (
                      <button
                        key={sim.number}
                        type="button"
                        onClick={() => handleSIMChange(sim)}
                        className={`w-full px-4 py-3 flex items-center gap-3 text-left transition ${
                          selected
                            ? "bg-[#EBF4FC]"
                            : "hover:bg-[#F8FAFD]"
                        }`}
                      >

                        <div className="h-9 w-9 rounded-xl bg-[#F8FAFD] border border-[#E2E8F0] flex items-center justify-center">
                          {sim.flag}
                        </div>

                        <div className="flex-1">

                          <div className="flex items-center gap-2">

                            <p className="text-xs font-bold text-[#173B63]">
                              {sim.country}
                            </p>

                            {selected && (
                              <span className="text-[7px] font-bold px-2 py-0.5 rounded-full bg-[#A7C957]/20 text-[#466814]">
                                ACTIVE
                              </span>
                            )}

                          </div>

                          <p className="text-[10px] font-mono text-slate-500 mt-0.5">
                            {sim.number}
                          </p>

                          <p className="text-[8px] text-slate-400 mt-0.5">
                            {sim.label}
                          </p>

                        </div>

                        {selected && (
                          <span className="text-[#2B6CB0] font-bold">
                            ✓
                          </span>
                        )}

                      </button>
                    );
                  })}

                </div>
              )}

            </div>

          </div>

        </section>

        {/* =======================================================
            MAIN TWO COLUMN AREA
        ======================================================== */}

        <div className="grid lg:grid-cols-[330px_1fr] gap-4 items-start">

          {/* =====================================================
              LEFT COLUMN
          ====================================================== */}

          <section className="space-y-4">

            {/* QUICK CONTACTS */}

            <div className="rounded-2xl bg-white border border-[#DCE5EF] shadow-sm overflow-hidden">

              <div className="px-4 py-3 border-b border-[#E8EDF3] flex items-center justify-between">

                <div>
                  <h2 className="text-sm font-extrabold text-[#173B63]">
                    Quick Contacts
                  </h2>

                  <p className="text-[8px] text-slate-500 mt-0.5">
                    Tap to call a contact
                  </p>
                </div>

                <button
                  type="button"
                  className="rounded-lg border border-[#D8E6F1] bg-white px-2 py-1 text-[7px] font-bold text-[#2B6CB0]"
                >
                  + Add
                </button>

              </div>

              <div className="p-2.5 space-y-1.5">

                {QUICK_CONTACTS.map((contact) => (

                  <button
                    key={contact.id}
                    type="button"
                    onClick={() =>
                      handleSelectQuickContact(contact)
                    }
                    className="w-full flex items-center gap-2.5 px-2.5 py-2 rounded-xl border border-[#E2EAF2] bg-[#FBFCFE] hover:bg-[#F3F8FC] hover:border-[#BBD3E7] transition text-left"
                  >

                    <div
                      className={`h-9 w-9 shrink-0 rounded-full ${contact.avatarBg} ${contact.avatarText} flex items-center justify-center font-extrabold text-[9px]`}
                    >
                      {contact.initials}
                    </div>

                    <div className="min-w-0 flex-1">

                      <div className="flex items-center gap-1.5">

                        <p className="font-bold text-[10px] text-[#173B63] truncate">
                          {contact.name}
                        </p>

                        {contact.isTrustedGuardian && (
                          <span className="shrink-0 text-[6px] bg-[#A7C957]/20 text-[#466814] font-bold px-1.5 py-0.5 rounded-full">
                            Guardian
                          </span>
                        )}

                      </div>

                      <p className="text-[7px] text-slate-500 mt-0.5 truncate">
                        {contact.role}
                      </p>

                      <p className="text-[7px] font-mono text-slate-400 mt-0.5">
                        {contact.number}
                      </p>

                    </div>

                    <div className="shrink-0 flex flex-col items-end gap-1">

                      <span
                        className={`text-[6px] font-bold px-1.5 py-0.5 rounded-full border ${INTENT_CONFIG[contact.defaultIntent].badgeStyle}`}
                      >
                        {contact.defaultIntent}
                      </span>

                      <span className="text-slate-400 text-xs">
                        →
                      </span>

                    </div>

                  </button>

                ))}

              </div>

            </div>

            {/* NETWORK TELEMETRY */}

            <div className="rounded-2xl bg-[#173B63] text-white shadow-sm overflow-hidden">

              <div className="px-4 py-3 border-b border-white/10 flex items-center justify-between">

                <div>

                  <div className="flex items-center gap-2">

                    <span className="h-2 w-2 rounded-full bg-[#A7C957]" />

                    <h2 className="text-sm font-extrabold">
                      Network Telemetry
                    </h2>

                  </div>

                  <p className="text-[8px] text-blue-200 mt-0.5">
                    CALLiO adapts automatically
                  </p>

                </div>

                <span className="text-[7px] font-bold px-2 py-1 rounded-full bg-white/10 text-[#A7C957]">
                  LIVE
                </span>

              </div>

              <div className="grid grid-cols-2 gap-px bg-white/10">

                <div className="bg-[#173B63] p-3">

                  <p className="text-[7px] uppercase tracking-wider text-slate-400 font-bold">
                    Audio
                  </p>

                  <p className="text-sm font-bold mt-1">
                    {telemetry.codec || "Opus-NB"}
                  </p>

                  <p className="text-[8px] text-slate-400 mt-0.5">
                    {telemetry.bitrateKbps || 12} kbps
                  </p>

                </div>

                <div className="bg-[#173B63] p-3">

                  <p className="text-[7px] uppercase tracking-wider text-slate-400 font-bold">
                    Latency
                  </p>

                  <p className="text-sm font-bold text-[#7FB3E6] mt-1">
                    {telemetry.latencyMs || 24} ms
                  </p>

                  <p className="text-[8px] text-[#A7C957] mt-0.5">
                    Stable
                  </p>

                </div>

                <div className="bg-[#173B63] p-3">

                  <p className="text-[7px] uppercase tracking-wider text-slate-400 font-bold">
                    Packet Loss
                  </p>

                  <p className="text-sm font-bold mt-1">
                    {telemetry.packetLossPercent || 0}%
                  </p>

                  <p className="text-[8px] text-[#A7C957] mt-0.5">
                    Good
                  </p>

                </div>

                <div className="bg-[#173B63] p-3">

                  <p className="text-[7px] uppercase tracking-wider text-slate-400 font-bold">
                    Data Saved
                  </p>

                  <p className="text-sm font-bold text-[#A7C957] mt-1">
                    {telemetry.dataSavedMb || 14.8} MB
                  </p>

                  <p className="text-[8px] text-slate-400 mt-0.5">
                    Data Saver
                  </p>

                </div>

              </div>

              <div className="px-3 pb-3 pt-2">

                <Link
                  href="/dependent"
                  className="flex items-center justify-between rounded-xl bg-white/10 border border-white/10 hover:bg-white/15 px-3 py-2.5 transition"
                >

                  <div>

                    <p className="text-[10px] font-bold">
                      Emergency Mode
                    </p>

                    <p className="text-[7px] text-blue-200 mt-0.5">
                      Simple interface for elderly & dependents
                    </p>

                  </div>

                  <span className="text-[#A7C957] font-bold">
                    →
                  </span>

                </Link>

              </div>

            </div>

          </section>

          {/* =====================================================
              RIGHT COLUMN — DIALER
          ====================================================== */}

          <section>

            <div className="rounded-2xl bg-white border border-[#DCE5EF] shadow-sm overflow-hidden">

              {/* SELECT INTENT HEADER */}

              <div className="px-5 pt-4 pb-3 border-b border-[#E8EDF3]">

                <div className="flex items-start justify-between gap-3">

                  <div>

                    <p className="text-[9px] uppercase tracking-[0.18em] font-bold text-[#2B6CB0]">
                      Select Intent
                    </p>

                    <h2 className="text-lg sm:text-xl font-extrabold text-[#173B63] mt-0.5">
                      Choose why you're calling
                    </h2>

                    <p className="text-[8px] text-slate-500 mt-0.5">
                      This helps the receiver understand your call.
                    </p>

                  </div>

                  <div className="hidden sm:block text-right">

                    <p className="text-[7px] uppercase tracking-wider font-bold text-slate-400">
                      Caller ID
                    </p>

                    <p className="font-mono text-[9px] font-bold text-[#173B63] mt-1">
                      {myNumber}
                    </p>

                  </div>

                </div>

                {/* INTENT CARDS */}

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-3">

                  {(
                    [
                      "Just saying hello",
                      "Need to talk",
                      "Urgent",
                      "Emergency",
                    ] as CallIntent[]
                  ).map((intent) => {

                    const config = INTENT_CONFIG[intent];
                    const selected = selectedIntent === intent;

                    return (
                      <button
                        key={intent}
                        type="button"
                        onClick={() => {
                          setSelectedIntent(intent);
                          playChime(true);
                        }}
                        className={`h-[70px] flex flex-col items-center justify-center rounded-xl border transition ${
                          selected
                            ? config.activeCard
                            : config.inactiveCard
                        }`}
                      >

                        <span className="text-lg leading-none">
                          {config.icon}
                        </span>

                        <span className="text-[8px] font-extrabold mt-1.5 text-center">
                          {config.title}
                        </span>

                        <span className="text-[6px] text-slate-500 mt-0.5 text-center">
                          {config.description}
                        </span>

                      </button>
                    );

                  })}

                </div>

              </div>

              {/* DIALER AREA */}

              <div className="px-5 py-4">

                {/* NUMBER */}

                <div className="mb-3">

                  <div className="flex items-center justify-between mb-1.5">

                    <p className="text-[9px] font-bold text-[#173B63]">
                      Enter number
                    </p>

                    <button
                      type="button"
                      onClick={handleClearNumber}
                      disabled={!inputNumber}
                      className="text-[7px] font-bold uppercase text-slate-400 hover:text-[#2B6CB0] disabled:opacity-30"
                    >
                      Clear
                    </button>

                  </div>

                  <div className="relative rounded-xl border border-[#D9E5EF] bg-[#F8FAFD] h-[52px] flex items-center px-3">

                    <div className="h-8 w-8 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-[#2B6CB0]">
                      ☎
                    </div>

                    <div className="flex-1 text-center px-3">

                      <span
                        className={`block truncate font-mono font-bold tracking-[0.08em] text-xl ${
                          inputNumber
                            ? "text-[#173B63]"
                            : "text-slate-300"
                        }`}
                      >
                        {inputNumber || "Enter number"}
                      </span>

                    </div>

                    {inputNumber && (
                      <button
                        type="button"
                        onClick={handleDeleteDigit}
                        className="h-8 w-8 rounded-lg text-slate-500 hover:text-[#173B63] hover:bg-white transition"
                        aria-label="Delete last digit"
                      >
                        ⌫
                      </button>
                    )}

                  </div>

                </div>

                {/* SELECTED INTENT BAR */}

                <div className="rounded-xl bg-[#F8FAFD] border border-[#E3E9F1] px-3 py-2 flex items-center gap-2 mb-3">

                  <span className="h-7 w-7 rounded-lg bg-white border border-[#E2E8F0] flex items-center justify-center text-sm">
                    {INTENT_CONFIG[selectedIntent].icon}
                  </span>

                  <div>

                    <p className="text-[6px] uppercase tracking-wider font-bold text-slate-400">
                      Selected intent
                    </p>

                    <p className="text-[9px] text-[#173B63] mt-0.5">
                      <strong>
                        {INTENT_CONFIG[selectedIntent].title}
                      </strong>{" "}
                      — {INTENT_CONFIG[selectedIntent].description}
                    </p>

                  </div>

                </div>

                {/* DIAL PAD */}

                <div>

                  <div className="flex items-center justify-between mb-2">

                    <p className="text-[10px] font-extrabold text-[#173B63]">
                      Dial pad
                    </p>

                    <span className="text-[7px] text-slate-400">
                      Long press 0 for +
                    </span>

                  </div>

                  <div className="mx-auto max-w-[360px] grid grid-cols-3 gap-2">

                    {dialPadKeys.map(({ digit, sub }) => (

                      <button
                        key={digit}
                        type="button"
                        onClick={
                          digit === "0"
                            ? undefined
                            : () => handleDigitPress(digit)
                        }
                        onPointerDown={
                          digit === "0"
                            ? handleZeroPressStart
                            : undefined
                        }
                        onPointerUp={
                          digit === "0"
                            ? handleZeroPressEnd
                            : undefined
                        }
                        onPointerCancel={
                          digit === "0"
                            ? handleZeroPressEnd
                            : undefined
                        }
                        onPointerLeave={
                          digit === "0"
                            ? handleZeroPressEnd
                            : undefined
                        }
                        className="h-[52px] sm:h-[56px] flex flex-col items-center justify-center rounded-xl bg-[#F8FAFD] hover:bg-[#EDF4FB] hover:border-[#9FC3E1] active:scale-95 border border-[#E1E8F0] transition"
                      >

                        <span className="text-xl font-bold font-mono text-[#173B63] leading-none">
                          {digit}
                        </span>

                        {sub && (
                          <span className="text-[7px] font-bold text-slate-400 tracking-wider mt-1">
                            {sub}
                          </span>
                        )}

                      </button>

                    ))}

                  </div>

                </div>

                {/* CALL BUTTON */}

                <div className="mt-3 flex gap-2">

                  <button
                    type="button"
                    onClick={handleClearNumber}
                    disabled={!inputNumber}
                    className="h-11 px-4 rounded-xl bg-[#F1F4F8] hover:bg-[#E5EAF0] disabled:opacity-30 text-[9px] font-bold text-slate-600 transition"
                  >
                    Clear
                  </button>

                  <button
                    type="button"
                    onClick={handleInitiateCall}
                    disabled={!inputNumber}
                    className={`flex-1 h-11 rounded-xl flex items-center justify-center gap-2 font-extrabold text-sm shadow-lg transition active:scale-[0.98] disabled:opacity-35 disabled:pointer-events-none ${INTENT_CONFIG[selectedIntent].btnColor}`}
                  >

                    <span className="text-base">
                      📞
                    </span>

                    <span>
                      Call
                    </span>

                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteDigit}
                    disabled={!inputNumber}
                    className="h-11 px-4 rounded-xl bg-[#F1F4F8] hover:bg-[#E5EAF0] disabled:opacity-30 text-[9px] font-bold text-slate-600 transition"
                  >
                    Delete
                  </button>

                </div>

                {/* STATUS */}

                <div className="mt-3 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-[7px] text-slate-400">

                  <span className="flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#A7C957]" />
                    Network active
                  </span>

                  <span>•</span>

                  <span>
                    Adaptive: {networkMode}
                  </span>

                  <span>•</span>

                  <span>
                    eSIM: {activeSIM.country}
                  </span>

                </div>

              </div>

            </div>

          </section>

        </div>

      </main>

      {/* =========================================================
          ACTIVE CALL MODAL
      ========================================================= */}

      {callState !== "IDLE" && callState !== "ENDED" && (

        <div className="fixed inset-0 z-50 bg-[#173B63]/80 backdrop-blur-sm flex items-center justify-center p-4">

          <div className="w-full max-w-md rounded-3xl bg-[#173B63] border border-white/20 p-8 shadow-2xl text-center text-white">

            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6 bg-white/10 border border-white/20">

              <span>
                {incomingCall
                  ? INTENT_CONFIG[
                      incomingCall.intentTag as CallIntent
                    ]?.icon || "📞"
                  : INTENT_CONFIG[selectedIntent].icon}
              </span>

              <span>
                Intent:{" "}
                {incomingCall
                  ? incomingCall.intentTag
                  : selectedIntent}
              </span>

            </div>

            <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-[#1E4670] border-2 border-[#7FB3E6]">

              <span className="text-5xl animate-pulse">
                📞
              </span>

              {callState === "CALLING" && (
                <span className="absolute -inset-1 rounded-full border-2 border-[#7FB3E6] animate-ping opacity-40" />
              )}

            </div>

            <h3 className="text-2xl font-bold font-mono mb-1">
              {incomingCall
                ? incomingCall.from
                : inputNumber || "Active Call"}
            </h3>

            <p className="text-sm font-semibold text-[#A7C957] mb-2">

              {callState === "CALLING"
                ? "Connecting CALLiO session..."
                : callState === "CONNECTED"
                ? `In Call • ${formatSeconds(callDurationSec)}`
                : callState === "RINGING"
                ? "Ringing..."
                : callState}

            </p>

            <p className="text-xs text-slate-300 mb-6 font-mono">
              Via {myNumber} • {telemetry.codec || "Opus 12kbps"}
            </p>

            <div className="flex items-center justify-center gap-4 mb-8">

              <button
                type="button"
                onClick={() =>
                  setIsMuted((previous) => !previous)
                }
                className={`h-12 w-12 rounded-full flex items-center justify-center text-lg ${
                  isMuted
                    ? "bg-red-600 text-white"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
                aria-label="Toggle mute"
              >
                {isMuted ? "🔇" : "🎙️"}
              </button>

              <button
                type="button"
                onClick={() =>
                  setIsSpeakerOn((previous) => !previous)
                }
                className={`h-12 w-12 rounded-full flex items-center justify-center text-lg ${
                  isSpeakerOn
                    ? "bg-[#2B6CB0] text-white"
                    : "bg-white/15 text-white hover:bg-white/25"
                }`}
                aria-label="Toggle speaker"
              >
                🔊
              </button>

              {callState === "RINGING" && (
                <button
                  type="button"
                  onClick={answerIncomingCall}
                  className="h-14 w-14 rounded-full bg-[#A7C957] hover:bg-[#92b543] text-[#173B63] flex items-center justify-center text-2xl font-bold shadow-lg"
                  aria-label="Answer call"
                >
                  ✓
                </button>
              )}

              <button
                type="button"
                onClick={handleEndCall}
                className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-2xl font-bold shadow-lg"
                aria-label="End call"
              >
                ✕
              </button>

            </div>

            <div className="rounded-2xl bg-[#0F2742] p-3 text-[10px] font-mono text-slate-300 grid grid-cols-3 gap-2">

              <span>
                Bitrate: {telemetry.bitrateKbps || 16} kbps
              </span>

              <span className="text-[#A7C957]">
                Data Saver
              </span>

              <span>
                Loss: {telemetry.packetLossPercent || 0}%
              </span>

            </div>

          </div>

        </div>

      )}

      {/* =========================================================
          DEMO CONTROLS
      ========================================================= */}

      <aside className="border-t border-[#E2E8F0] bg-white py-2.5 px-4">

        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-2">

          <div>

            <span className="font-bold text-[#173B63] text-[9px]">
              CALLiO Demo Controls
            </span>

            <span className="text-[8px] text-slate-400 ml-2">
              WebRTC simulation
            </span>

          </div>

          <div className="flex flex-wrap gap-1.5">

            <button
              type="button"
              onClick={() => {
                simulateIncomingCall?.({
                  from: "+61 480 000 111",
                  intentTag: "Emergency",
                  priority: "CRITICAL",
                  note: "Test call from Trusted Guardian",
                });
              }}
              className="rounded-lg bg-[#F2F7E6] hover:bg-[#E5F0D0] border border-[#A7C957] text-[#3F6010] px-2.5 py-1 text-[8px] font-bold"
            >
              Simulate Guardian Call
            </button>

            <button
              type="button"
              onClick={() => {
                simulateIncomingCall?.({
                  from: "+1 555 987 6543",
                  intentTag: "Need to talk",
                  priority: "NORMAL",
                  note: "Test call from Untrusted Caller",
                });
              }}
              className="rounded-lg bg-[#F8F9FB] hover:bg-[#EBF4FC] border border-[#E2E8F0] text-slate-700 px-2.5 py-1 text-[8px]"
            >
              Simulate Untrusted Caller
            </button>

            {callState !== "IDLE" && (
              <button
                type="button"
                onClick={handleEndCall}
                className="rounded-lg bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 px-2.5 py-1 text-[8px] font-bold"
              >
                Reset Call
              </button>
            )}

            <Link
              href="/dependent"
              className="rounded-lg bg-[#2B6CB0] hover:bg-[#235891] text-white px-2.5 py-1 text-[8px] font-bold"
            >
              Emergency Mode →
            </Link>

          </div>

        </div>

      </aside>

    </div>
  );
}