"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useWebRTC } from "../../hooks/useWebRTC";
import { CooeeLogo } from "@/components/CooeeLogo";
import { playChime } from "@/lib/audio";

// Official trusted guardian numbers
const trustedGuardians = ["+61 480 000 111"];

function normalizePhone(num: string): string {
  return num.replace(/[\s\-\(\)]/g, "");
}

export default function DependentPortalPage() {
  const {
    callState,
    incomingCall,
    startCall,
    answerIncomingCall,
    endActiveCall,
    simulateIncomingCall,
  } = useWebRTC();

  // Auto-answer timer and state
  const [countdown, setCountdown] = useState<number>(3);
  const [isAutoAnswerCancelled, setIsAutoAnswerCancelled] = useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  const autoAnswerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasAnsweredRef = useRef<boolean>(false);
  const lastProcessedCallRef = useRef<string | null>(null);

  // Large accessible clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTimeStr(
        now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Connected call duration timer
  useEffect(() => {
    if (callState !== "CONNECTED") return;
    const interval = setInterval(() => {
      setCallDuration((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [callState]);

  // Check if incoming caller is in the trusted guardians list
  const isCallerTrusted = incomingCall
    ? trustedGuardians.some(
        (guardian) => normalizePhone(guardian) === normalizePhone(incomingCall.from)
      )
    : false;

  // Cleanup auto-answer timers helper
  const clearAutoAnswerTimers = useCallback(() => {
    if (autoAnswerTimeoutRef.current) {
      clearTimeout(autoAnswerTimeoutRef.current);
      autoAnswerTimeoutRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  // Handle incoming call & trusted auto-answer logic
  useEffect(() => {
    // Only run when there is an active ringing incoming call
    if (callState === "RINGING" && incomingCall) {
      const callKey = `${incomingCall.from}-${incomingCall.intentTag || ""}`;

      // Avoid creating multiple timers for the same call
      if (lastProcessedCallRef.current !== callKey) {
        lastProcessedCallRef.current = callKey;
        hasAnsweredRef.current = false;
        setIsAutoAnswerCancelled(false);
        setCountdown(3);
        clearAutoAnswerTimers();

        // If caller is in trustedGuardians list, initiate 3-second auto-answer
        if (isCallerTrusted) {
          playChime(true);

          // 1-second countdown tick for visible 3 -> 2 -> 1
          countdownIntervalRef.current = setInterval(() => {
            setCountdown((prev) => {
              if (prev <= 1) {
                if (countdownIntervalRef.current) {
                  clearInterval(countdownIntervalRef.current);
                  countdownIntervalRef.current = null;
                }
                return 1;
              }
              return prev - 1;
            });
          }, 1000);

          // Exactly 3000ms timer to answer the incoming call
          autoAnswerTimeoutRef.current = setTimeout(() => {
            if (!hasAnsweredRef.current) {
              hasAnsweredRef.current = true;
              answerIncomingCall();
              clearAutoAnswerTimers();
            }
          }, 3000);
        }
      }
    } else {
      // Incoming call ended, cancelled, or connected: clean up timers
      clearAutoAnswerTimers();
      lastProcessedCallRef.current = null;
      hasAnsweredRef.current = false;
    }

    return () => {
      clearAutoAnswerTimers();
    };
  }, [callState, incomingCall, isCallerTrusted, answerIncomingCall, clearAutoAnswerTimers]);

  // Cancel button handler for auto-answer
  const handleCancelAutoAnswer = () => {
    clearAutoAnswerTimers();
    setIsAutoAnswerCancelled(true);
    hasAnsweredRef.current = true; // Prevents timer from firing
    playChime(false);
  };

  const handleEndCall = () => {
    setCallDuration(0);
    endActiveCall();
  };

  const formatCallDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#173B63] flex flex-col justify-between selection:bg-[#7FB3E6] selection:text-[#173B63] font-sans antialiased p-4 sm:p-8 md:p-12">
      {/* =================================================================== */}
      {/* 1. REASSURING ACCESSIBLE HEADER WITH COOEE LOGO */}
      {/* =================================================================== */}
      <header className="border-b-2 border-[#DDE4EE] pb-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <Link href="/dependent" className="group">
            <CooeeLogo size="lg" showTagline={true} theme="light" />
          </Link>

          <div className="hidden sm:block h-12 w-px bg-[#DDE4EE]"></div>

          <div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[#173B63]">
              HELLO!
            </h1>
            <p className="text-lg sm:text-xl lg:text-2xl font-bold text-[#2B6CB0] mt-1">
              Tap who you want to talk to.
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-3xl sm:text-5xl font-black text-[#173B63]">
            {currentTimeStr || "12:00"}
          </div>
          <div className="flex items-center justify-end gap-2 mt-2">
            <span className="h-3.5 w-3.5 rounded-full bg-[#A7C957] animate-pulse"></span>
            <span className="text-base font-bold text-slate-600">Tablet Ready</span>
          </div>
        </div>
      </header>

      {/* =================================================================== */}
      {/* 2. TRUSTED AUTO-ANSWER INCOMING CALL BANNER (WHEN RINGING) */}
      {/* =================================================================== */}
      {callState === "RINGING" && incomingCall && (
        <div className="fixed inset-0 z-50 bg-[#173B63]/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-150">
          {isCallerTrusted && !isAutoAnswerCancelled ? (
            /* TRUSTED GUARDIAN AUTO-ANSWER SCREEN */
            <div className="w-full max-w-3xl rounded-3xl border-8 border-[#A7C957] bg-white p-8 sm:p-12 shadow-2xl flex flex-col items-center text-[#173B63]">
              {/* Emergency / Trusted Indicator Badge */}
              <div className="rounded-full bg-[#A7C957] px-6 py-2.5 text-xl font-black text-[#173B63] uppercase tracking-wider mb-6 shadow-sm animate-pulse">
                Guardian Priority Calling
              </div>

              {/* VERY LARGE BANNER REQUIRED BY SPEC */}
              <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-[#173B63] mb-4 leading-tight">
                Auto-Answering Call from Guardian
              </h2>

              <p className="text-2xl sm:text-3xl font-bold text-[#2B6CB0] mb-8">
                {incomingCall.from} • {incomingCall.intentTag || "Urgent"}
              </p>

              {/* VISIBLE COUNTDOWN: 3 -> 2 -> 1 */}
              <div className="my-4 flex flex-col items-center">
                <span className="text-2xl font-bold text-slate-600 mb-3">
                  Answering in:
                </span>
                <div className="flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-full border-8 border-[#A7C957] bg-[#F2F7E6] text-7xl sm:text-8xl font-black text-[#173B63] shadow-xl animate-bounce">
                  {countdown}
                </div>
              </div>

              {/* CANCEL BUTTON (REQUIRED) */}
              <div className="mt-8 w-full max-w-lg">
                <button
                  onClick={handleCancelAutoAnswer}
                  className="w-full rounded-3xl bg-red-600 hover:bg-red-700 active:scale-95 border-4 border-red-500 py-6 text-2xl sm:text-3xl font-black text-white shadow-xl transition"
                >
                  ✕ CANCEL AUTO-ANSWER
                </button>
                <p className="text-base text-slate-500 mt-3 font-semibold">
                  Pressing Cancel lets you decline or answer manually.
                </p>
              </div>
            </div>
          ) : (
            /* REGULAR UNTRUSTED OR CANCELLED INCOMING CALL */
            <div className="w-full max-w-3xl rounded-3xl border-8 border-[#DDE4EE] bg-white p-8 sm:p-12 shadow-2xl flex flex-col items-center text-[#173B63]">
              <div className="rounded-full bg-[#EBF4FC] px-6 py-2 text-xl font-black text-[#2B6CB0] uppercase tracking-wider mb-6">
                Incoming Call
              </div>

              <h2 className="text-4xl sm:text-6xl font-black text-[#173B63] mb-4">
                {incomingCall.from}
              </h2>

              <p className="text-2xl font-bold text-slate-500 mb-10">
                Intent: {incomingCall.intentTag || "General Call"}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-xl">
                <button
                  onClick={answerIncomingCall}
                  className="w-full rounded-3xl bg-[#2B6CB0] hover:bg-[#235891] active:scale-95 border-4 border-[#2B6CB0] py-8 text-3xl font-black text-white shadow-xl transition flex items-center justify-center gap-3"
                >
                  <span>📞</span>
                  <span>ANSWER</span>
                </button>

                <button
                  onClick={handleEndCall}
                  className="w-full rounded-3xl bg-red-600 hover:bg-red-700 active:scale-95 border-4 border-red-500 py-8 text-3xl font-black text-white shadow-xl transition flex items-center justify-center gap-3"
                >
                  <span>✕</span>
                  <span>DECLINE</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* 3. CONNECTED CALL OVERLAY (WHEN SPEAKING) */}
      {/* =================================================================== */}
      {callState === "CONNECTED" && (
        <div className="fixed inset-0 z-50 bg-[#173B63] text-white flex flex-col items-center justify-between p-8 sm:p-16 text-center animate-in fade-in duration-200">
          <div className="flex flex-col items-center mt-6">
            <span className="rounded-full bg-[#A7C957]/20 text-[#A7C957] border-2 border-[#A7C957]/50 px-6 py-2 text-2xl font-black uppercase">
              CONNECTED &amp; SPEAKING
            </span>

            <h2 className="text-5xl sm:text-7xl font-black text-white mt-8 mb-4">
              Talking with Family
            </h2>

            <div className="font-mono text-4xl sm:text-5xl font-black text-[#7FB3E6]">
              {formatCallDuration(callDuration)}
            </div>
          </div>

          {/* Visual Voice Waves Indicator */}
          <div className="flex items-center gap-4 py-8">
            <div className="h-16 w-4 bg-[#A7C957] rounded-full animate-pulse"></div>
            <div className="h-28 w-4 bg-[#7FB3E6] rounded-full animate-bounce"></div>
            <div className="h-20 w-4 bg-[#A7C957] rounded-full animate-pulse"></div>
            <div className="h-32 w-4 bg-[#7FB3E6] rounded-full animate-bounce"></div>
            <div className="h-24 w-4 bg-[#A7C957] rounded-full animate-pulse"></div>
          </div>

          {/* Giant End Call Button */}
          <div className="w-full max-w-xl mb-6">
            <button
              onClick={handleEndCall}
              className="w-full rounded-3xl bg-red-600 hover:bg-red-700 active:scale-95 border-4 border-white py-8 sm:py-10 text-3xl sm:text-4xl font-black text-white shadow-2xl transition flex items-center justify-center gap-4"
            >
              <span>✕</span>
              <span>END CALL</span>
            </button>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* 4. CALLING / OUTGOING OVERLAY */}
      {/* =================================================================== */}
      {callState === "CALLING" && (
        <div className="fixed inset-0 z-50 bg-[#173B63] text-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-150">
          <div className="h-36 w-36 rounded-full border-8 border-[#7FB3E6] flex items-center justify-center text-6xl animate-pulse mb-8 bg-[#1E4670]">
            📞
          </div>

          <h2 className="text-4xl sm:text-6xl font-black text-white mb-4">
            Calling Family...
          </h2>
          <p className="text-2xl text-slate-300 mb-10">
            Please wait while we connect your audio.
          </p>

          <button
            onClick={handleEndCall}
            className="w-full max-w-md rounded-3xl bg-red-600 hover:bg-red-700 py-6 text-2xl font-black text-white border-4 border-white transition"
          >
            ✕ CANCEL CALL
          </button>
        </div>
      )}

      {/* =================================================================== */}
      {/* 5. TWO GIANT FAMILY CONTACT TILES (COOEE BRANDED WARM PALETTE) */}
      {/* =================================================================== */}
      <main className="my-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch max-w-6xl mx-auto w-full">
        {/* TILE 1: MUM (GUARDIAN - LEAF GREEN & COOEE BLUE) */}
        <section className="rounded-3xl border-4 border-[#A7C957] bg-white p-6 sm:p-10 flex flex-col justify-between shadow-lg">
          <div className="flex items-center gap-6">
            {/* Contact Photo / High Contrast Avatar */}
            <div className="relative flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-3xl bg-[#F2F7E6] text-6xl sm:text-7xl font-black shadow-md border-4 border-[#A7C957]">
              👩
              <span className="absolute -bottom-2 -right-2 rounded-full bg-[#A7C957] border-2 border-white px-2.5 py-0.5 text-xs font-black text-[#173B63]">
                TRUSTED
              </span>
            </div>

            <div>
              <p className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#4A6B1A]">
                Primary Guardian
              </p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#173B63] mt-1">
                MUM
              </h2>
              <p className="font-mono text-lg sm:text-xl font-bold text-slate-500 mt-1">
                +61 480 000 111
              </p>
            </div>
          </div>

          {/* ONE OBVIOUS ACTION PER CONTACT */}
          <button
            onClick={() => {
              playChime(true);
              startCall("+61 480 000 111", "Urgent");
            }}
            className="mt-8 w-full rounded-3xl bg-[#A7C957] hover:bg-[#95b846] active:scale-95 border-4 border-[#A7C957] py-8 sm:py-10 text-3xl sm:text-4xl lg:text-5xl font-black text-[#173B63] shadow-md transition flex items-center justify-center gap-4 cursor-pointer"
          >
            <span className="text-4xl sm:text-5xl">📞</span>
            <span>CALL MUM</span>
          </button>
        </section>

        {/* TILE 2: AKHIL (FAMILY - WARM PEACH & COOEE BLUE) */}
        <section className="rounded-3xl border-4 border-[#F4A261] bg-white p-6 sm:p-10 flex flex-col justify-between shadow-lg">
          <div className="flex items-center gap-6">
            {/* Contact Photo / High Contrast Avatar */}
            <div className="flex h-28 w-28 sm:h-36 sm:w-36 items-center justify-center rounded-3xl bg-[#FDF3EA] text-6xl sm:text-7xl font-black shadow-md border-4 border-[#F4A261]">
              👨
            </div>

            <div>
              <p className="text-lg sm:text-xl font-bold uppercase tracking-wider text-[#B85D1B]">
                Family
              </p>
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#173B63] mt-1">
                AKHIL
              </h2>
              <p className="font-mono text-lg sm:text-xl font-bold text-slate-500 mt-1">
                +44 770 000 222
              </p>
            </div>
          </div>

          {/* ONE OBVIOUS ACTION PER CONTACT */}
          <button
            onClick={() => {
              playChime(true);
              startCall("+44 770 000 222", "Just saying hello");
            }}
            className="mt-8 w-full rounded-3xl bg-[#2B6CB0] hover:bg-[#235891] active:scale-95 border-4 border-[#2B6CB0] py-8 sm:py-10 text-3xl sm:text-4xl lg:text-5xl font-black text-white shadow-md transition flex items-center justify-center gap-4 cursor-pointer"
          >
            <span className="text-4xl sm:text-5xl">📞</span>
            <span>CALL AKHIL</span>
          </button>
        </section>
      </main>

      {/* =================================================================== */}
      {/* 6. EMERGENCY ASSISTANCE BUTTON (HIGH VISIBILITY RED) */}
      {/* =================================================================== */}
      <div className="max-w-6xl mx-auto w-full mb-6">
        <button
          onClick={() => {
            playChime(true);
            startCall("000", "Emergency");
          }}
          className="w-full rounded-3xl bg-red-600 hover:bg-red-700 active:scale-95 border-4 border-red-500 py-6 text-2xl sm:text-3xl font-black text-white shadow-lg transition flex items-center justify-center gap-4"
        >
          <span className="text-3xl">🚨</span>
          <span>EMERGENCY HELP (CALL 000)</span>
        </button>
      </div>

      {/* =================================================================== */}
      {/* 7. FOOTER & CAREGIVER NAVIGATION */}
      {/* =================================================================== */}
      <footer className="border-t-2 border-[#DDE4EE] pt-4 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#173B63]">Cooee Dependent Mode</span>
          <span>•</span>
          <span>Tablet Simplified Screen</span>
        </div>

        {/* Discreet caregiver controls & live simulation triggers for demo */}
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          <span className="text-[11px] text-slate-500 font-medium">Simulate:</span>
          <button
            onClick={() => {
              simulateIncomingCall?.({
                from: "+61 480 000 111",
                intentTag: "Emergency",
                priority: "CRITICAL",
                note: "Guardian auto-answer test",
              });
            }}
            className="rounded-xl bg-[#F2F7E6] hover:bg-[#E5F0D0] border border-[#A7C957] text-[#3F6010] px-3 py-1.5 text-[11px] font-bold transition shadow-2xs"
          >
            Test Guardian Call (Triggers 3s Auto-Answer)
          </button>

          <button
            onClick={() => {
              simulateIncomingCall?.({
                from: "+1 555 333 4444",
                intentTag: "Need to talk",
                priority: "NORMAL",
                note: "Untrusted caller test",
              });
            }}
            className="rounded-xl bg-white hover:bg-[#F8F9FB] border border-[#DDE4EE] text-slate-700 px-3 py-1.5 text-[11px] font-semibold transition shadow-2xs"
          >
            Test Untrusted Caller
          </button>

          <Link
            href="/dialer"
            className="rounded-xl bg-[#173B63] hover:bg-[#102742] text-white px-3.5 py-1.5 text-[11px] font-bold shadow-sm transition"
          >
            Switch to WebDialer ➔
          </Link>
        </div>
      </footer>
    </div>
  );
}
