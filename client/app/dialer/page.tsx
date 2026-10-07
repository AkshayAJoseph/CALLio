"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useWebRTC } from "../../hooks/useWebRTC";
import { playDTMFTone, playChime } from "@/lib/audio";
import ActiveCallView from "@/components/call/ActiveCallView";

type CallIntent = "Just saying hello" | "Need to talk" | "Urgent" | "Emergency";

interface VirtualSIM {
  number: string;
  country: string;
  flag: string;
  label: string;
  carrier: string;
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
    description: "Casual check-in with standard chime",
    badgeStyle: "bg-[#A7C957]/15 text-[#466814] border-[#A7C957]/40",
    activeCard: "border-[#A7C957] bg-[#F2F7E6] text-[#2C4808] ring-2 ring-[#A7C957]/40 shadow-sm",
    inactiveCard: "border-[#E2E8F0] bg-white hover:bg-[#F8F9FB] text-slate-700",
    btnColor: "bg-[#2B6CB0] hover:bg-[#235891] text-white shadow-[#2B6CB0]/25",
    accentColor: "#A7C957",
  },
  "Need to talk": {
    title: "Need to talk",
    icon: "💬",
    description: "Conversation requested, regular priority",
    badgeStyle: "bg-[#2B6CB0]/15 text-[#173B63] border-[#2B6CB0]/30",
    activeCard: "border-[#2B6CB0] bg-[#EBF4FC] text-[#173B63] ring-2 ring-[#2B6CB0]/30 shadow-sm",
    inactiveCard: "border-[#E2E8F0] bg-white hover:bg-[#F8F9FB] text-slate-700",
    btnColor: "bg-[#2B6CB0] hover:bg-[#235891] text-white shadow-[#2B6CB0]/25",
    accentColor: "#2B6CB0",
  },
  Urgent: {
    title: "Urgent",
    icon: "⚡",
    description: "Time-sensitive alert, prompt attention",
    badgeStyle: "bg-[#F4A261]/20 text-[#A0480A] border-[#F4A261]/40",
    activeCard: "border-[#F4A261] bg-[#FDF3EA] text-[#933F07] ring-2 ring-[#F4A261]/40 shadow-sm",
    inactiveCard: "border-[#E2E8F0] bg-white hover:bg-[#F8F9FB] text-slate-700",
    btnColor: "bg-[#E67E22] hover:bg-[#D35400] text-white shadow-[#E67E22]/25",
    accentColor: "#F4A261",
  },
  Emergency: {
    title: "Emergency",
    icon: "🚨",
    description: "Critical! Bypasses DND • 3s auto-answer on dependent device",
    badgeStyle: "bg-red-100 text-red-700 border-red-300 animate-pulse",
    activeCard: "border-red-500 bg-red-50 text-red-800 ring-2 ring-red-400/40 shadow-sm",
    inactiveCard: "border-[#E2E8F0] bg-white hover:bg-[#F8F9FB] text-slate-700",
    btnColor: "bg-red-600 hover:bg-red-700 text-white shadow-red-600/30",
    accentColor: "#DC2626",
  },
};

export default function WebDialerPage() {
  const webRTC = useWebRTC();
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
  } = webRTC;

  const [inputNumber, setInputNumber] = useState<string>("");
  const [selectedIntent, setSelectedIntent] = useState<CallIntent>("Just saying hello");
  const [simMenuOpen, setSimMenuOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [callDurationSec, setCallDurationSec] = useState<number>(0);

  const normalizeForMatch = (num: string) => num.replace(/[\s\-\(\)]/g, "");

  const activeSIM =
    AVAILABLE_SIMS.find((s) => normalizeForMatch(s.number) === myNumber) || AVAILABLE_SIMS[0];

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
    { digit: "*", sub: "✳" },
    { digit: "0", sub: "+" },
    { digit: "#", sub: "SYM" },
  ];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#F8F9FB] text-slate-900 flex flex-col font-sans antialiased selection:bg-[#7FB3E6] selection:text-[#173B63]">
      {/* 1. TOP HEADER & BRANDING NAVIGATION */}
      <header className="h-[60px] shrink-0 bg-[#173B63] text-white shadow-md px-3 sm:px-6 flex items-center justify-between z-40 gap-2">
        <div className="flex items-center gap-3 sm:gap-6 min-w-0">
          {/* CALLiO LOGO WITH BLUEBIRD ARTWORK */}
          <Link
            href="/dialer"
            aria-label="Go to CALLiO Dialer"
            className="shrink-0 flex items-center hover:opacity-95 transition"
          >
            <img
              src="/bluebird-callio-logo.png"
              alt="CALLiO - Clear Calls, Better Connections"
              className="h-8 sm:h-10 w-auto object-contain drop-shadow-sm"
            />
          </Link>

          {/* NAVIGATION */}
          <nav className="hidden sm:flex items-center gap-1.5">
            <Link
              href="/dialer"
              className="rounded-xl bg-white/15 px-3 py-1.5 text-xs font-bold text-white shadow-inner"
            >
              Dialer
            </Link>

            <Link
              href="/dependent"
              className="rounded-xl px-3 py-1.5 text-xs font-bold text-blue-100 hover:bg-white/10 hover:text-white transition flex items-center gap-1.5"
            >
              <span>🚨</span>
              <span>Emergency</span>
            </Link>

            <Link
              href="/contacts"
              className="rounded-xl px-3 py-1.5 text-xs font-bold text-blue-100 hover:bg-white/10 hover:text-white transition"
            >
              Contacts
            </Link>
          </nav>
        </div>

        {/* Right Header Status & eSIM Switcher */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden md:flex items-center gap-2 rounded-full bg-[#0F2742] border border-[#7FB3E6]/30 px-2.5 py-1 text-xs shadow-inner">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A7C957] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#A7C957]"></span>
            </span>
            <div className="flex items-center gap-1.5 text-[11px] font-medium text-slate-200">
              <span className="text-[#A7C957] font-bold">Data Saver</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300 font-mono">{networkMode}</span>
            </div>
          </div>

          {/* Virtual SIM Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSimMenuOpen(!simMenuOpen)}
              className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-[#1E4670] hover:bg-[#255282] border border-white/15 px-2.5 py-1 sm:py-1.5 text-xs font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-[#7FB3E6]/60 shadow-sm"
              aria-expanded={simMenuOpen}
              aria-label="Select Virtual SIM"
            >
              <span className="text-sm">{activeSIM.flag}</span>
              <div className="text-left">
                <p className="font-mono text-xs font-bold text-white leading-tight">
                  {activeSIM.number}
                </p>
              </div>
              <svg
                className={`w-3 h-3 text-slate-300 transition-transform ${
                  simMenuOpen ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
              </svg>
            </button>

            {simMenuOpen && (
              <div className="absolute right-0 mt-2 w-64 sm:w-72 rounded-2xl bg-white border border-[#E2E8F0] p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-900">
                <div className="px-3 py-2 border-b border-slate-100">
                  <p className="text-xs font-bold uppercase tracking-wider text-[#173B63]">
                    Virtual SIM Switcher
                  </p>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Select your outgoing caller identity
                  </p>
                </div>
                <div className="mt-1 space-y-1">
                  {AVAILABLE_SIMS.map((sim) => {
                    const isSelected = normalizeForMatch(sim.number) === myNumber;
                    return (
                      <button
                        key={sim.number}
                        onClick={() => handleSIMChange(sim)}
                        className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition ${
                          isSelected
                            ? "bg-[#EBF4FC] border border-[#2B6CB0]/40 text-[#173B63]"
                            : "hover:bg-[#F8F9FB] text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-2.5">
                          <span className="text-lg">{sim.flag}</span>
                          <div>
                            <p className="text-xs font-bold font-mono text-[#173B63]">
                              {sim.number}
                            </p>
                            <p className="text-[10px] text-slate-500">{sim.label}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[#2B6CB0] text-[10px] font-bold bg-[#2B6CB0]/10 px-2 py-0.5 rounded-full">
                            ACTIVE
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* 2. FULLSCREEN MAIN DASHBOARD (100vh ACROSS SCREEN & 50vw SPLIT-SCREEN OPTIMIZED) */}
      <main className="flex-1 w-full px-2 sm:px-4 lg:px-6 py-2 sm:py-3 grid gap-2.5 sm:gap-4 xl:grid-cols-12 overflow-hidden min-h-0">
        {/* Left Column: Quick Contacts & Telemetry eSIM Info */}
        <section className="hidden xl:flex xl:col-span-5 flex-col gap-3 h-full overflow-hidden order-2 xl:order-1">
          {/* Quick Contacts */}
          <div className="flex-1 rounded-2xl bg-white border border-[#E2E8F0] p-3.5 shadow-sm flex flex-col min-h-0">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100 shrink-0">
              <div>
                <h2 className="text-sm font-bold text-[#173B63] tracking-tight">
                  Quick Contacts
                </h2>
                <p className="text-[11px] text-slate-500">
                  Tap to populate number and intent
                </p>
              </div>
              <span className="text-[10px] font-mono font-bold text-[#2B6CB0] bg-[#EBF4FC] px-2 py-0.5 rounded-full border border-[#2B6CB0]/20">
                4 Saved
              </span>
            </div>

            <div className="mt-2 space-y-2 flex-1 overflow-y-auto pr-1">
              {QUICK_CONTACTS.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectQuickContact(contact)}
                  className="w-full group flex items-center justify-between p-2.5 rounded-xl bg-[#F8F9FB] hover:bg-[#EBF4FC] border border-[#E2E8F0] hover:border-[#7FB3E6] transition active:scale-[0.99] text-left shadow-2xs"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`h-8 w-8 rounded-xl ${contact.avatarBg} ${contact.avatarText} flex items-center justify-center font-bold text-xs shadow-xs shrink-0`}
                    >
                      {contact.initials}
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-bold text-xs text-[#173B63] group-hover:text-[#2B6CB0] transition truncate">
                          {contact.name}
                        </p>
                        {contact.isTrustedGuardian && (
                          <span className="text-[9px] bg-[#A7C957]/25 text-[#3F6010] font-bold px-1.5 py-0.2 rounded-full border border-[#A7C957]/50 shrink-0">
                            GUARDIAN
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] font-mono text-slate-500 truncate">
                        {contact.number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`text-[9px] font-semibold px-1.5 py-0.5 rounded-full border ${
                        INTENT_CONFIG[contact.defaultIntent].badgeStyle
                      }`}
                    >
                      {contact.defaultIntent}
                    </span>
                    <span className="text-slate-400 group-hover:text-[#2B6CB0] text-xs transition">
                      ➔
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Adaptive eSIM Telemetry Card */}
          <div className="rounded-2xl bg-white border border-[#E2E8F0] p-3.5 shadow-sm shrink-0">
            <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="flex h-2 w-2 rounded-full bg-[#A7C957]"></span>
                <h3 className="text-[11px] font-bold uppercase tracking-wider text-[#173B63]">
                  Adaptive eSIM Telemetry
                </h3>
              </div>
              <span className="text-[10px] font-mono text-[#2B6CB0] font-bold bg-[#EBF4FC] px-2 py-0.5 rounded-full border border-[#2B6CB0]/25">
                {networkMode} MODE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="rounded-xl bg-[#F8F9FB] p-2 border border-[#E2E8F0]">
                <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">
                  Compression
                </p>
                <p className="font-mono font-bold text-[#173B63] mt-0.5 text-xs truncate">
                  Opus-NB 12kbps
                </p>
              </div>

              <div className="rounded-xl bg-[#F8F9FB] p-2 border border-[#E2E8F0]">
                <p className="text-slate-500 text-[9px] uppercase font-bold tracking-wider">
                  Active Line
                </p>
                <p className="font-mono font-bold text-[#173B63] mt-0.5 text-xs truncate">
                  {myNumber}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Right / Main Column: WebDialer & Intent Selector (Optimized for 50vw split-screen) */}
        <section className="col-span-1 xl:col-span-7 flex flex-col h-full overflow-hidden order-1 xl:order-2">
          <div className="flex-1 rounded-2xl bg-white border border-[#E2E8F0] p-3 sm:p-4 shadow-sm flex flex-col justify-between overflow-hidden">
            {/* Quick Contacts horizontal ribbon when in split screen */}
            <div className="xl:hidden shrink-0 mb-2 overflow-x-auto pb-1 flex items-center gap-1.5 no-scrollbar">
              <span className="text-[10px] uppercase font-bold text-slate-400 shrink-0 mr-1">
                Quick:
              </span>
              {QUICK_CONTACTS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => handleSelectQuickContact(c)}
                  className="shrink-0 flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[#F8F9FB] hover:bg-[#EBF4FC] border border-[#E2E8F0] text-xs font-bold text-[#173B63] transition active:scale-95"
                >
                  <span className="text-xs">{c.initials === "SOS" ? "🚨" : c.initials === "M" ? "👩" : "👤"}</span>
                  <span>{c.name.split(" ")[0]}</span>
                </button>
              ))}
            </div>

            {/* Header & Number Display */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] sm:text-[11px] uppercase font-bold tracking-wider text-slate-500">
                  Dial Outgoing Call
                </span>
                <div className="flex items-center gap-1">
                  <span className="text-[10px] sm:text-[11px] text-slate-500">Line:</span>
                  <span className="font-mono text-[10px] sm:text-[11px] font-bold text-[#2B6CB0] bg-[#EBF4FC] px-1.5 sm:px-2 py-0.5 rounded-full border border-[#2B6CB0]/25">
                    {myNumber}
                  </span>
                </div>
              </div>

              {/* Display Box */}
              <div className="relative mb-2 sm:mb-2.5 rounded-xl bg-[#F8F9FB] border border-[#E2E8F0] px-3 sm:px-4 py-2 text-center flex items-center justify-between shadow-inner">
                <div className="w-5"></div>
                <div className="flex-1 overflow-x-auto text-center px-1">
                  <span
                    className={`font-mono font-bold tracking-wider sm:tracking-widest text-xl sm:text-2xl lg:text-3xl ${
                      inputNumber ? "text-[#173B63]" : "text-slate-400"
                    }`}
                  >
                    {inputNumber || "Enter number"}
                  </span>
                </div>
                <div className="w-5 flex justify-end">
                  {inputNumber && (
                    <button
                      onClick={handleDeleteDigit}
                      aria-label="Delete last digit"
                      className="p-1 rounded-lg text-slate-500 hover:text-[#173B63] hover:bg-[#E2E8F0] transition"
                    >
                      ⌫
                    </button>
                  )}
                </div>
              </div>

              {/* CALL INTENT SELECTOR */}
              <div className="mb-2">
                <div className="grid grid-cols-4 gap-1.5 sm:gap-2">
                  {(
                    [
                      "Just saying hello",
                      "Need to talk",
                      "Urgent",
                      "Emergency",
                    ] as CallIntent[]
                  ).map((intent) => {
                    const cfg = INTENT_CONFIG[intent];
                    const isSelected = selectedIntent === intent;
                    return (
                      <button
                        key={intent}
                        type="button"
                        onClick={() => {
                          setSelectedIntent(intent);
                          playChime(true);
                        }}
                        className={`flex flex-col items-center justify-center p-1.5 sm:p-2 rounded-xl border transition text-center ${
                          isSelected ? cfg.activeCard : cfg.inactiveCard
                        }`}
                      >
                        <span className="text-sm sm:text-base mb-0.5">{cfg.icon}</span>
                        <span className="text-[9px] sm:text-[10px] font-bold leading-tight truncate w-full">
                          {cfg.title}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Telephone Dial Pad */}
            <div className="mx-auto grid max-w-xs grid-cols-3 gap-1.5 sm:gap-2 my-auto w-full">
              {dialPadKeys.map(({ digit, sub }) => (
                <button
                  key={digit}
                  onClick={() => handleDigitPress(digit)}
                  className="flex h-10 sm:h-12 flex-col items-center justify-center rounded-xl bg-[#F8F9FB] hover:bg-[#EBF4FC] hover:border-[#7FB3E6] active:scale-95 border border-[#E2E8F0] shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]/40"
                >
                  <span className="text-lg sm:text-xl font-bold font-mono text-[#173B63] leading-none">
                    {digit}
                  </span>
                  {sub && (
                    <span className="text-[7px] sm:text-[8px] font-bold text-slate-400 tracking-wider mt-0.5 leading-none">
                      {sub}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* Action Bar */}
            <div className="flex items-center justify-center gap-2 sm:gap-3 pt-1.5">
              <button
                onClick={handleClearNumber}
                disabled={!inputNumber}
                className="flex-1 max-w-[80px] sm:max-w-[90px] py-2 sm:py-2.5 rounded-xl bg-[#F1F4F9] hover:bg-[#E2E8F0] disabled:opacity-40 text-xs font-bold text-slate-700 transition"
              >
                Clear
              </button>

              <button
                onClick={handleInitiateCall}
                disabled={!inputNumber}
                className={`flex-2 flex items-center justify-center gap-1.5 sm:gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-xl font-bold text-xs sm:text-sm shadow-md transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none truncate ${
                  INTENT_CONFIG[selectedIntent].btnColor
                }`}
              >
                <span className="text-sm sm:text-base">📞</span>
                <span className="truncate">Call ({selectedIntent})</span>
              </button>

              <button
                onClick={handleDeleteDigit}
                disabled={!inputNumber}
                className="flex-1 max-w-[80px] sm:max-w-[90px] py-2 sm:py-2.5 rounded-xl bg-[#F1F4F9] hover:bg-[#E2E8F0] disabled:opacity-40 text-xs font-bold text-slate-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* 3. ACTIVE CALL OVERLAY & CONNECTED FALLBACK VIEW */}
      {callState === "CONNECTED" && (
        <div className="fixed inset-0 z-50 bg-slate-950 overflow-y-auto">
          <ActiveCallView call={webRTC} dialedNumber={inputNumber} />
        </div>
      )}

      {(callState === "CALLING" || callState === "RINGING") && (
        <div className="fixed inset-0 z-50 bg-[#173B63]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#173B63] border border-white/20 p-8 shadow-2xl text-center text-white animate-in fade-in zoom-in-95 duration-150">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6 bg-white/10 border border-white/20">
              <span>{INTENT_CONFIG[selectedIntent].icon}</span>
              <span className="text-white">
                Intent: {incomingCall ? incomingCall.intentTag : selectedIntent}
              </span>
            </div>

            <div className="relative mx-auto mb-6 flex h-28 w-28 items-center justify-center rounded-full bg-[#1E4670] border-2 border-[#7FB3E6] shadow-lg">
              <span className="text-5xl animate-pulse">📞</span>
              {callState === "CALLING" && (
                <span className="absolute -inset-1 rounded-full border-2 border-[#7FB3E6] animate-ping opacity-40"></span>
              )}
            </div>

            <h3 className="text-2xl font-bold font-mono text-white mb-1">
              {incomingCall ? incomingCall.from : inputNumber || "Active Call"}
            </h3>

            <p className="text-sm font-semibold text-[#A7C957] mb-2">
              {callState === "CALLING"
                ? "Connecting WebRTC session..."
                : callState === "RINGING"
                ? "Ringing..."
                : callState}
            </p>

            <p className="text-xs text-slate-300 mb-6 font-mono">
              Via {myNumber}
            </p>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 mb-8">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className={`h-12 w-12 rounded-full flex items-center justify-center text-lg transition ${
                  isMuted ? "bg-red-600 text-white" : "bg-white/15 text-white hover:bg-white/25"
                }`}
                aria-label="Toggle mute"
              >
                {isMuted ? "🔇" : "🎙️"}
              </button>

              <button
                onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                className={`h-12 w-12 rounded-full flex items-center justify-center text-lg transition ${
                  isSpeakerOn ? "bg-[#2B6CB0] text-white" : "bg-white/15 text-white hover:bg-white/25"
                }`}
                aria-label="Toggle speaker"
              >
                🔊
              </button>

              {callState === "RINGING" && (
                <button
                  onClick={answerIncomingCall}
                  className="h-14 w-14 rounded-full bg-[#A7C957] hover:bg-[#92b543] text-[#173B63] flex items-center justify-center text-2xl font-bold shadow-lg transition active:scale-95"
                  aria-label="Answer call"
                >
                  ✓
                </button>
              )}

              <button
                onClick={handleEndCall}
                className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-2xl font-bold shadow-lg transition active:scale-95"
                aria-label="End call"
              >
                ✕
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 4. COMPACT FOOTER */}
      <footer className="h-[46px] shrink-0 border-t border-[#E2E8F0] bg-white px-2.5 sm:px-6 flex items-center justify-between text-xs text-slate-600 z-40 gap-2">
        <div className="flex items-center gap-1.5 min-w-0">
          <span className="font-bold text-[#173B63] text-[11px] sm:text-xs shrink-0">Demo Controls:</span>
          <span className="hidden md:inline text-[10px] text-slate-500 truncate">
            (WebRTC signaling triggers)
          </span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
          <button
            onClick={() => {
              simulateIncomingCall?.({
                from: "+61 480 000 111",
                intentTag: "Emergency",
                priority: "CRITICAL",
                note: "Test call from Trusted Guardian",
              });
            }}
            className="rounded-lg bg-[#F2F7E6] hover:bg-[#E5F0D0] border border-[#A7C957] text-[#3F6010] px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold transition shadow-2xs whitespace-nowrap"
          >
            Guardian (+61...)
          </button>

          <button
            onClick={() => {
              simulateIncomingCall?.({
                from: "+1 555 987 6543",
                intentTag: "Need to talk",
                priority: "NORMAL",
                note: "Test call from Untrusted Caller",
              });
            }}
            className="hidden sm:inline-block rounded-lg bg-[#F8F9FB] hover:bg-[#EBF4FC] border border-[#E2E8F0] text-slate-700 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-medium transition shadow-2xs whitespace-nowrap"
          >
            Untrusted (+1...)
          </button>

          {callState !== "IDLE" && (
            <button
              onClick={handleEndCall}
              className="rounded-lg bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 px-2 sm:px-2.5 py-1 text-[10px] sm:text-[11px] font-bold transition shadow-2xs whitespace-nowrap"
            >
              Reset
            </button>
          )}

          <Link
            href="/dependent"
            className="rounded-lg bg-[#2B6CB0] hover:bg-[#235891] text-white px-2.5 sm:px-3 py-1 text-[10px] sm:text-[11px] font-bold shadow-sm transition flex items-center gap-1 whitespace-nowrap"
          >
            <span>Emergency</span>
            <span>➔</span>
          </Link>
        </div>
      </footer>
    </div>
  );
}
