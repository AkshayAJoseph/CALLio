"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
// TEMPORARY UI DEVELOPMENT MOCK:
// Replace useMockWebRTC with Akshay's shared useWebRTC hook when his implementation is integrated.
import { useWebRTC as useMockWebRTC } from "../../hooks/useWebRTC";
import { CooeeLogo } from "@/components/CooeeLogo";
import { playDTMFTone, playChime } from "@/lib/audio";

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
    carrier: "Cooee AU",
  },
  {
    number: "+44 770 000 222",
    country: "United Kingdom",
    flag: "🇬🇧",
    label: "London Gateway (Roaming eSIM)",
    carrier: "Cooee UK Global",
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

  const [inputNumber, setInputNumber] = useState<string>("");
  const [selectedIntent, setSelectedIntent] = useState<CallIntent>("Just saying hello");
  const [simMenuOpen, setSimMenuOpen] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState<boolean>(true);
  const [callDurationSec, setCallDurationSec] = useState<number>(0);

  const normalizeForMatch = (num: string) => num.replace(/[\s\-\(\)]/g, "");

  const activeSIM =
    AVAILABLE_SIMS.find((s) => normalizeForMatch(s.number) === myNumber) || AVAILABLE_SIMS[0];

  // Call duration counter
  useEffect(() => {
    if (callState !== "CONNECTED") return;
    const timer = setInterval(() => {
      setCallDurationSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [callState]);

  // Handle dialpad click
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

  const formatSeconds = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
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
    <div className="min-h-screen bg-[#F8F9FB] text-slate-900 flex flex-col font-sans antialiased selection:bg-[#7FB3E6] selection:text-[#173B63]">
      {/* =================================================================== */}
      {/* 1. TOP HEADER & BRANDING NAVIGATION */}
      {/* =================================================================== */}
      <header className="sticky top-0 z-40 bg-[#173B63] text-white shadow-md px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/dialer" className="group">
            <CooeeLogo size="md" showTagline={true} theme="dark" />
          </Link>

          {/* Quick link to Elderly / Dependent Portal */}
          <Link
            href="/dependent"
            className="hidden md:flex items-center gap-2 rounded-xl bg-white/10 hover:bg-white/20 border border-white/20 px-3.5 py-1.5 text-xs font-semibold text-white transition shadow-sm"
          >
            <span className="text-sm">👵</span>
            <span>Switch to Elderly Portal</span>
          </Link>
        </div>

        {/* Right Header Status & eSIM Switcher */}
        <div className="flex items-center gap-3">
          {/* Data Saver eSIM Status Badge */}
          <div className="hidden lg:flex items-center gap-2.5 rounded-full bg-[#0F2742] border border-[#7FB3E6]/30 px-3.5 py-1.5 text-xs shadow-inner">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#A7C957] opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-[#A7C957]"></span>
            </span>
            <div className="flex items-center gap-1.5 font-medium text-slate-200">
              <span className="text-[#A7C957] font-bold">Data Saver</span>
              <span className="text-slate-400">•</span>
              <span>eSIM Active</span>
              <span className="text-slate-400">•</span>
              <span className="text-[#7FB3E6] font-mono text-[11px]">
                {telemetry.latencyMs ?? 24}ms
              </span>
            </div>
          </div>

          {/* Virtual SIM Dropdown */}
          <div className="relative">
            <button
              onClick={() => setSimMenuOpen(!simMenuOpen)}
              className="flex items-center gap-2.5 rounded-xl bg-[#1E4670] hover:bg-[#255282] border border-white/15 px-3.5 py-1.5 text-xs font-medium text-white transition focus:outline-none focus:ring-2 focus:ring-[#7FB3E6]/60 shadow-sm"
              aria-expanded={simMenuOpen}
              aria-label="Select Virtual SIM"
            >
              <span className="text-base">{activeSIM.flag}</span>
              <div className="text-left">
                <p className="text-[10px] uppercase font-semibold text-[#7FB3E6] leading-tight">
                  Active SIM Line
                </p>
                <p className="font-mono text-xs font-bold text-white leading-tight">
                  {activeSIM.number}
                </p>
              </div>
              <svg
                className={`w-3.5 h-3.5 text-slate-300 transition-transform ${
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
              <div className="absolute right-0 mt-2 w-72 rounded-2xl bg-white border border-[#E2E8F0] p-2 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100 text-slate-900">
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
                        className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition ${
                          isSelected
                            ? "bg-[#EBF4FC] border border-[#2B6CB0]/40 text-[#173B63]"
                            : "hover:bg-[#F8F9FB] text-slate-700"
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-xl">{sim.flag}</span>
                          <div>
                            <p className="text-xs font-bold font-mono text-[#173B63]">
                              {sim.number}
                            </p>
                            <p className="text-[11px] text-slate-500">{sim.label}</p>
                          </div>
                        </div>
                        {isSelected && (
                          <span className="text-[#2B6CB0] text-xs font-bold bg-[#2B6CB0]/10 px-2 py-0.5 rounded-full">
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

      {/* =================================================================== */}
      {/* 2. MAIN COOEE DASHBOARD CONTENT */}
      {/* =================================================================== */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 grid gap-8 lg:grid-cols-12">
        {/* Left Column: Quick Contacts & Telemetry eSIM Info (5 cols) */}
        <section className="lg:col-span-5 flex flex-col gap-6 order-2 lg:order-1">
          {/* Quick-Contact Cards */}
          <div className="rounded-3xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div>
                <h2 className="text-base font-bold text-[#173B63] tracking-tight">
                  Quick Contacts
                </h2>
                <p className="text-xs text-slate-500">
                  Tap to populate number and prioritized intent
                </p>
              </div>
              <span className="text-xs font-mono font-bold text-[#2B6CB0] bg-[#EBF4FC] px-2.5 py-1 rounded-full border border-[#2B6CB0]/20">
                4 Saved
              </span>
            </div>

            <div className="space-y-3">
              {QUICK_CONTACTS.map((contact) => (
                <button
                  key={contact.id}
                  onClick={() => handleSelectQuickContact(contact)}
                  className="w-full group flex items-center justify-between p-3.5 rounded-2xl bg-[#F8F9FB] hover:bg-[#EBF4FC] border border-[#E2E8F0] hover:border-[#7FB3E6] transition active:scale-[0.99] text-left shadow-2xs"
                >
                  <div className="flex items-center gap-3.5">
                    <div
                      className={`h-11 w-11 rounded-2xl ${contact.avatarBg} ${contact.avatarText} flex items-center justify-center font-bold text-sm shadow-xs`}
                    >
                      {contact.initials}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-sm text-[#173B63] group-hover:text-[#2B6CB0] transition">
                          {contact.name}
                        </p>
                        {contact.isTrustedGuardian && (
                          <span className="text-[10px] bg-[#A7C957]/25 text-[#3F6010] font-bold px-2 py-0.5 rounded-full border border-[#A7C957]/50">
                            GUARDIAN
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-mono text-slate-500 mt-0.5">
                        {contact.number}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-1 rounded-full border ${
                        INTENT_CONFIG[contact.defaultIntent].badgeStyle
                      }`}
                    >
                      {contact.defaultIntent}
                    </span>
                    <span className="text-slate-400 group-hover:text-[#2B6CB0] text-sm transition">
                      ➔
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Cooee eSIM & Data Saver Technical Telemetry Card */}
          <div className="rounded-3xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="flex h-2.5 w-2.5 rounded-full bg-[#A7C957]"></span>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#173B63]">
                  Adaptive eSIM Telemetry
                </h3>
              </div>
              <span className="text-[11px] font-mono text-[#2B6CB0] font-bold bg-[#EBF4FC] px-2.5 py-0.5 rounded-full border border-[#2B6CB0]/25">
                {networkMode} MODE
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="rounded-2xl bg-[#F8F9FB] p-3.5 border border-[#E2E8F0]">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  Audio Compression
                </p>
                <p className="font-mono font-bold text-[#173B63] mt-1 text-sm">
                  {telemetry.codec || "Opus-NB 12kbps"}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Ultralow bandwidth</p>
              </div>

              <div className="rounded-2xl bg-[#F8F9FB] p-3.5 border border-[#E2E8F0]">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  Roundtrip Latency
                </p>
                <p className="font-mono font-bold text-[#2B6CB0] mt-1 text-sm">
                  {telemetry.latencyMs || 24} ms
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">Jitter: ~3ms</p>
              </div>

              <div className="rounded-2xl bg-[#F8F9FB] p-3.5 border border-[#E2E8F0]">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  Active Line
                </p>
                <p className="font-mono font-bold text-[#173B63] mt-1 text-sm">
                  {myNumber}
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">
                  {activeSIM.country} Primary
                </p>
              </div>

              <div className="rounded-2xl bg-[#F8F9FB] p-3.5 border border-[#E2E8F0]">
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-wider">
                  Cellular Data Saved
                </p>
                <p className="font-mono font-bold text-[#A7C957] font-extrabold mt-1 text-sm">
                  {telemetry.dataSavedMb || 14.8} MB
                </p>
                <p className="text-[10px] text-slate-500 mt-0.5">85% compression</p>
              </div>
            </div>

            {/* Portal Banner */}
            <div className="mt-5 rounded-2xl bg-gradient-to-r from-[#EBF4FC] to-[#F1F7FD] border border-[#7FB3E6]/40 p-4 flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-[#173B63]">
                  Elderly &amp; Dependent Portal Ready
                </p>
                <p className="text-[11px] text-slate-600 mt-0.5">
                  Tablet view with auto-answer for trusted guardians
                </p>
              </div>
              <Link
                href="/dependent"
                className="rounded-xl bg-[#2B6CB0] hover:bg-[#235891] text-white font-bold px-3.5 py-1.5 text-xs transition shadow-sm"
              >
                Open
              </Link>
            </div>
          </div>
        </section>

        {/* Right Column: WebDialer & Intent Selector (7 cols) */}
        <section className="lg:col-span-7 flex flex-col gap-6 order-1 lg:order-2">
          <div className="rounded-3xl bg-white border border-[#E2E8F0] p-6 sm:p-8 shadow-sm">
            {/* Active Caller Header */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs uppercase font-bold tracking-wider text-slate-500">
                Dial Outgoing Call
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs text-slate-500">Active Caller ID:</span>
                <span className="font-mono text-xs font-bold text-[#2B6CB0] bg-[#EBF4FC] px-2.5 py-1 rounded-full border border-[#2B6CB0]/25">
                  {myNumber}
                </span>
              </div>
            </div>

            {/* Telephone Number Display (Clean Soft Cream card with Deep Navy text) */}
            <div className="relative mb-6 rounded-2xl bg-[#F8F9FB] border border-[#E2E8F0] px-6 py-5 text-center flex items-center justify-between shadow-inner">
              <div className="w-8"></div>
              <div className="flex-1 overflow-x-auto text-center">
                <span
                  className={`font-mono font-bold tracking-widest text-3xl sm:text-4xl ${
                    inputNumber ? "text-[#173B63]" : "text-slate-400"
                  }`}
                >
                  {inputNumber || "Enter number"}
                </span>
              </div>
              <div className="w-8 flex justify-end">
                {inputNumber && (
                  <button
                    onClick={handleDeleteDigit}
                    aria-label="Delete last digit"
                    className="p-1.5 rounded-lg text-slate-500 hover:text-[#173B63] hover:bg-[#E2E8F0] transition"
                  >
                    ⌫
                  </button>
                )}
              </div>
            </div>

            {/* CALL INTENT SELECTOR (Restyled with Cooee Brand Accents) */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-bold uppercase tracking-wider text-[#173B63]">
                  Select Call Intent:
                </label>
                <span className="text-[11px] text-slate-500">
                  Communicates priority before answering
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
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
                      className={`flex flex-col items-center justify-center p-3.5 rounded-2xl border transition text-center ${
                        isSelected ? cfg.activeCard : cfg.inactiveCard
                      }`}
                    >
                      <span className="text-2xl mb-1.5">{cfg.icon}</span>
                      <span className="text-xs font-bold leading-tight">
                        {cfg.title}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Informative helper note for selected intent */}
              <div className="mt-3 px-3.5 py-2.5 rounded-2xl bg-[#F8F9FB] border border-[#E2E8F0] text-[11px] text-slate-600 flex items-center gap-2.5">
                <span className="text-base">{INTENT_CONFIG[selectedIntent].icon}</span>
                <span>
                  <strong className="text-[#173B63]">Intent Note:</strong>{" "}
                  {INTENT_CONFIG[selectedIntent].description}
                </span>
              </div>
            </div>

            {/* Interactive Telephone Dial Pad (Skype / modern calling app aesthetic) */}
            <div className="mx-auto grid max-w-sm grid-cols-3 gap-3.5 mb-6">
              {dialPadKeys.map(({ digit, sub }) => (
                <button
                  key={digit}
                  onClick={() => handleDigitPress(digit)}
                  className="flex h-16 sm:h-20 flex-col items-center justify-center rounded-2xl bg-[#F8F9FB] hover:bg-[#EBF4FC] hover:border-[#7FB3E6] active:scale-95 border border-[#E2E8F0] shadow-2xs transition focus:outline-none focus:ring-2 focus:ring-[#2B6CB0]/40"
                >
                  <span className="text-2xl sm:text-3xl font-bold font-mono text-[#173B63]">
                    {digit}
                  </span>
                  <span className="text-[10px] font-bold text-slate-500 tracking-wider">
                    {sub}
                  </span>
                </button>
              ))}
            </div>

            {/* Action Bar (Clear, Call, Delete) */}
            <div className="flex items-center justify-center gap-4">
              <button
                onClick={handleClearNumber}
                disabled={!inputNumber}
                className="flex-1 max-w-[105px] py-3.5 rounded-2xl bg-[#F1F4F9] hover:bg-[#E2E8F0] disabled:opacity-40 text-xs font-bold text-slate-700 transition"
              >
                Clear
              </button>

              {/* Main Call Button (Styles dynamically according to intent) */}
              <button
                onClick={handleInitiateCall}
                disabled={!inputNumber}
                className={`flex-2 flex items-center justify-center gap-3 px-8 py-4 rounded-2xl font-bold text-base shadow-md transition active:scale-95 disabled:opacity-40 disabled:pointer-events-none ${
                  INTENT_CONFIG[selectedIntent].btnColor
                }`}
              >
                <span className="text-xl">📞</span>
                <span>Call ({selectedIntent})</span>
              </button>

              <button
                onClick={handleDeleteDigit}
                disabled={!inputNumber}
                className="flex-1 max-w-[105px] py-3.5 rounded-2xl bg-[#F1F4F9] hover:bg-[#E2E8F0] disabled:opacity-40 text-xs font-bold text-slate-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </section>
      </main>

      {/* =================================================================== */}
      {/* 3. ACTIVE CALL MODAL / OVERLAY (COOEE BRANDED NAVY / BLUE CARD) */}
      {/* =================================================================== */}
      {callState !== "IDLE" && callState !== "ENDED" && (
        <div className="fixed inset-0 z-50 bg-[#173B63]/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-3xl bg-[#173B63] border border-white/20 p-8 shadow-2xl text-center text-white animate-in fade-in zoom-in-95 duration-150">
            {/* Intent Badge */}
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-6 bg-white/10 border border-white/20">
              <span>{INTENT_CONFIG[selectedIntent].icon}</span>
              <span className="text-white">
                Intent: {incomingCall ? incomingCall.intentTag : selectedIntent}
              </span>
            </div>

            {/* Status & Callee */}
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
                : callState === "CONNECTED"
                ? `In Call • ${formatSeconds(callDurationSec)}`
                : callState === "RINGING"
                ? "Ringing..."
                : callState}
            </p>

            <p className="text-xs text-slate-300 mb-6 font-mono">
              Via {myNumber} • {telemetry.codec || "Opus 12kbps"}
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

              {/* If incoming call is ringing, provide answer button */}
              {callState === "RINGING" && (
                <button
                  onClick={answerIncomingCall}
                  className="h-14 w-14 rounded-full bg-[#A7C957] hover:bg-[#92b543] text-[#173B63] flex items-center justify-center text-2xl font-bold shadow-lg transition active:scale-95"
                  aria-label="Answer call"
                >
                  ✓
                </button>
              )}

              {/* End Active Call Button */}
              <button
                onClick={handleEndCall}
                className="h-14 w-14 rounded-full bg-red-600 hover:bg-red-700 text-white flex items-center justify-center text-2xl font-bold shadow-lg transition active:scale-95"
                aria-label="End call"
              >
                ✕
              </button>
            </div>

            <div className="rounded-2xl bg-[#0F2742] p-3 text-[11px] font-mono text-slate-300 flex justify-between">
              <span>Bitrate: {telemetry.bitrateKbps || 16} kbps</span>
              <span className="text-[#A7C957]">Data Saver: Active</span>
              <span>Loss: {telemetry.packetLossPercent || 0}%</span>
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. DEMO SIMULATION FOOTER */}
      {/* =================================================================== */}
      <aside className="border-t border-[#E2E8F0] bg-white py-3 px-4 text-xs text-slate-600">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-bold text-[#173B63]">Demo Testing Controls:</span>
            <span className="text-[11px] text-slate-500">
              (Simulates WebRTC signaling triggers)
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => {
                simulateIncomingCall?.({
                  from: "+61 480 000 111",
                  intentTag: "Emergency",
                  priority: "CRITICAL",
                  note: "Test call from Trusted Guardian",
                });
              }}
              className="rounded-xl bg-[#F2F7E6] hover:bg-[#E5F0D0] border border-[#A7C957] text-[#3F6010] px-3 py-1.5 text-[11px] font-bold transition shadow-2xs"
            >
              Simulate Guardian Call (+61 480 000 111)
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
              className="rounded-xl bg-[#F8F9FB] hover:bg-[#EBF4FC] border border-[#E2E8F0] text-slate-700 px-3 py-1.5 text-[11px] font-medium transition shadow-2xs"
            >
              Simulate Untrusted Caller (+1 555...)
            </button>

            {callState !== "IDLE" && (
              <button
                onClick={handleEndCall}
                className="rounded-xl bg-red-50 hover:bg-red-100 border border-red-300 text-red-700 px-3 py-1.5 text-[11px] font-bold transition shadow-2xs"
              >
                Reset Call
              </button>
            )}

            <Link
              href="/dependent"
              className="rounded-xl bg-[#2B6CB0] hover:bg-[#235891] text-white px-3.5 py-1.5 text-[11px] font-bold shadow-sm transition"
            >
              Go to /dependent ➔
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
