"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { useWebRTC } from "../../hooks/useWebRTC";
import { NavBar } from "@/components/NavBar";
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
  const [isAutoAnswerCancelled, setIsAutoAnswerCancelled] =
    useState<boolean>(false);
  const [callDuration, setCallDuration] = useState<number>(0);
  const [currentTimeStr, setCurrentTimeStr] = useState<string>("");

  // Name of the person involved in the current outgoing call
  const [activeContactName, setActiveContactName] = useState<string>("");

  const autoAnswerTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasAnsweredRef = useRef<boolean>(false);
  const lastProcessedCallRef = useRef<string | null>(null);

  // Large accessible clock
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();

      setCurrentTimeStr(
        now.toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        })
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

  // Check if incoming caller is in trusted guardians list
  const isCallerTrusted = incomingCall
    ? trustedGuardians.some(
        (guardian) =>
          normalizePhone(guardian) === normalizePhone(incomingCall.from)
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
    if (callState === "RINGING" && incomingCall) {
      const callKey = `${incomingCall.from}-${incomingCall.intentTag || ""}`;

      if (lastProcessedCallRef.current !== callKey) {
        lastProcessedCallRef.current = callKey;
        hasAnsweredRef.current = false;
        setIsAutoAnswerCancelled(false);
        setCountdown(3);
        clearAutoAnswerTimers();

        // 3-second auto-answer for trusted guardians
        if (isCallerTrusted) {
          playChime(true);

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
      clearAutoAnswerTimers();
      lastProcessedCallRef.current = null;
      hasAnsweredRef.current = false;
    }

    return () => {
      clearAutoAnswerTimers();
    };
  }, [
    callState,
    incomingCall,
    isCallerTrusted,
    answerIncomingCall,
    clearAutoAnswerTimers,
  ]);

  // Cancel trusted guardian auto-answer
  const handleCancelAutoAnswer = () => {
    clearAutoAnswerTimers();

    setIsAutoAnswerCancelled(true);
    hasAnsweredRef.current = true;

    playChime(false);
  };

  // Normal end-call handler
  const handleEndCall = () => {
    setCallDuration(0);
    setActiveContactName("");
    endActiveCall();
  };

  // Direct call from portal
  const handleContactCall = (
    name: string,
    phone: string,
    intent: string
  ) => {
    setActiveContactName(name);
    setCallDuration(0);

    playChime(true);

    startCall(phone, intent);
  };

  // ONE-TAP SOS
  const handleSOS = () => {
    setActiveContactName("MUM");
    setCallDuration(0);

    playChime(true);

    startCall(trustedGuardians[0], "Urgent - Please Pick Up", {
      isSOS: true,
      priority: "HIGH",
      triggeredBy: "self",
    });
  };

  const formatCallDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;

    return `${mins}:${s.toString().padStart(2, "0")}`;
  };

  const incomingCallerName = incomingCall?.from || "Family";

  return (
    <div className="min-h-screen bg-[#F8F9FB] text-[#173B63] flex flex-col justify-between selection:bg-[#7FB3E6] selection:text-[#173B63] font-sans antialiased">
      <NavBar />

      {/* EMERGENCY MODE / ELDERLY-FRIENDLY HEADER */}
      <div className="px-4 sm:px-8 md:px-12 pt-5 pb-5 border-b-2 border-[#DDE4EE] flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="rounded-full bg-red-600 px-5 py-2.5 text-lg sm:text-xl font-black text-white shadow-sm">
            🚨 EMERGENCY MODE
          </div>

          <div>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#173B63]">
              EMERGENCY PORTAL
            </h1>
            <p className="text-sm sm:text-base font-bold text-[#2B6CB0] mt-0.5">
              Tap who you want to talk to.
            </p>
          </div>
        </div>

        <div className="text-right">
          <div className="font-mono text-2xl sm:text-4xl font-black text-[#173B63]">
            {currentTimeStr || "12:00"}
          </div>

          <div className="flex items-center justify-end gap-2 mt-1">
            <span className="h-3 w-3 rounded-full bg-[#A7C957] animate-pulse" />
            <span className="text-sm font-bold text-slate-600">
              Tablet Ready
            </span>
          </div>
        </div>
      </div>

      {/* TRUSTED AUTO-ANSWER INCOMING CALL BANNER */}
      {callState === "RINGING" && incomingCall && (
        <div className="fixed inset-0 z-50 bg-[#173B63]/85 backdrop-blur-sm flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in-95 duration-150">
          {isCallerTrusted && !isAutoAnswerCancelled ? (
            <div className="w-full max-w-3xl rounded-3xl border-8 border-[#A7C957] bg-white p-8 sm:p-12 shadow-2xl flex flex-col items-center text-[#173B63]">
              <div className="rounded-full bg-[#A7C957] px-6 py-2.5 text-xl font-black text-[#173B63] uppercase tracking-wider mb-6 shadow-sm animate-pulse">
                Guardian Priority Calling
              </div>

              <h2 className="text-4xl sm:text-6xl font-black tracking-tight text-[#173B63] mb-4 leading-tight">
                Auto-Answering Call from Guardian
              </h2>

              <p className="text-2xl sm:text-3xl font-bold text-[#2B6CB0] mb-8">
                {incomingCall.from} • {incomingCall.intentTag || "Urgent"}
              </p>

              <div className="my-4 flex flex-col items-center">
                <span className="text-2xl font-bold text-slate-600 mb-3">
                  Answering in:
                </span>

                <div className="flex h-36 w-36 sm:h-44 sm:w-44 items-center justify-center rounded-full border-8 border-[#A7C957] bg-[#F2F7E6] text-7xl sm:text-8xl font-black text-[#173B63] shadow-xl animate-bounce">
                  {countdown}
                </div>
              </div>

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
            <div className="w-full max-w-3xl rounded-3xl border-8 border-[#DDE4EE] bg-white p-8 sm:p-12 shadow-2xl flex flex-col items-center text-[#173B63]">
              <div className="rounded-full bg-[#EBF4FC] px-6 py-2 text-xl font-black text-[#2B6CB0] uppercase tracking-wider mb-6">
                Incoming Call
              </div>

              <h2 className="text-4xl sm:text-6xl font-black text-[#173B63] mb-4">
                {incomingCallerName}
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

      {/* CONNECTED CALL OVERLAY */}
      {callState === "CONNECTED" && (
        <div className="fixed inset-0 z-50 bg-[#173B63] text-white flex flex-col items-center justify-between p-8 sm:p-16 text-center animate-in fade-in duration-200">
          <div className="flex flex-col items-center mt-6">
            <span className="rounded-full bg-[#A7C957]/20 text-[#A7C957] border-2 border-[#A7C957]/50 px-6 py-2 text-2xl font-black uppercase">
              CONNECTED &amp; SPEAKING
            </span>

            <h2 className="text-5xl sm:text-7xl font-black text-white mt-8 mb-4">
              Talking with {activeContactName || incomingCallerName}
            </h2>

            <div className="font-mono text-4xl sm:text-5xl font-black text-[#7FB3E6]">
              {formatCallDuration(callDuration)}
            </div>
          </div>

          {/* Voice Waves */}
          <div className="flex items-center gap-4 py-8">
            <div className="h-16 w-4 bg-[#A7C957] rounded-full animate-pulse" />
            <div className="h-28 w-4 bg-[#7FB3E6] rounded-full animate-bounce" />
            <div className="h-20 w-4 bg-[#A7C957] rounded-full animate-pulse" />
            <div className="h-32 w-4 bg-[#7FB3E6] rounded-full animate-bounce" />
            <div className="h-24 w-4 bg-[#A7C957] rounded-full animate-pulse" />
          </div>

          {/* End Call */}
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

      {/* CALLING / OUTGOING OVERLAY */}
      {callState === "CALLING" && (
        <div className="fixed inset-0 z-50 bg-[#173B63] text-white flex flex-col items-center justify-center p-8 text-center animate-in fade-in duration-150">
          <div className="h-36 w-36 rounded-full border-8 border-[#7FB3E6] flex items-center justify-center text-6xl animate-pulse mb-8 bg-[#1E4670]">
            📞
          </div>

          <div className="rounded-full bg-red-600/20 border-2 border-red-400/50 px-5 py-2 text-lg font-black text-red-200 uppercase tracking-wider mb-5">
            Emergency Mode
          </div>

          <h2 className="text-4xl sm:text-6xl font-black text-white mb-4">
            Calling {activeContactName || "Family"}...
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

      {/* TWO GIANT FAMILY CONTACT TILES */}
      <main className="my-8 flex-1 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-stretch max-w-6xl mx-auto w-full px-4">
        {/* MUM */}
        <section className="rounded-3xl border-4 border-[#A7C957] bg-white p-6 sm:p-10 flex flex-col justify-between shadow-lg">
          <div className="flex items-center gap-6">
            {/* MUM photo = SOS shortcut */}
            <button
              type="button"
              onClick={handleSOS}
              aria-label="Call Mum for help"
              className="relative flex h-28 w-28 sm:h-36 sm:w-36 shrink-0 items-center justify-center rounded-3xl bg-[#F2F7E6] text-6xl sm:text-7xl font-black shadow-md border-4 border-[#A7C957] cursor-pointer active:scale-95 transition"
            >
              👩
              <span className="absolute -bottom-2 -right-2 rounded-full bg-[#A7C957] border-2 border-white px-2.5 py-0.5 text-xs font-black text-[#173B63]">
                TRUSTED
              </span>
            </button>

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

          <button
            onClick={() =>
              handleContactCall(
                "MUM",
                "+61 480 000 111",
                "Urgent"
              )
            }
            className="mt-8 w-full rounded-3xl bg-[#A7C957] hover:bg-[#95b846] active:scale-95 border-4 border-[#A7C957] py-8 sm:py-10 text-3xl sm:text-4xl lg:text-5xl font-black text-[#173B63] shadow-md transition flex items-center justify-center gap-4 cursor-pointer"
          >
            <span className="text-4xl sm:text-5xl">📞</span>
            <span>CALL MUM</span>
          </button>
        </section>

        {/* AKHIL */}
        <section className="rounded-3xl border-4 border-[#F4A261] bg-white p-6 sm:p-10 flex flex-col justify-between shadow-lg">
          <div className="flex items-center gap-6">
            <div className="flex h-28 w-28 sm:h-36 sm:w-36 shrink-0 items-center justify-center rounded-3xl bg-[#FDF3EA] text-6xl sm:text-7xl font-black shadow-md border-4 border-[#F4A261]">
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

          <button
            onClick={() =>
              handleContactCall(
                "AKHIL",
                "+44 770 000 222",
                "Just saying hello"
              )
            }
            className="mt-8 w-full rounded-3xl bg-[#2B6CB0] hover:bg-[#235891] active:scale-95 border-4 border-[#2B6CB0] py-8 sm:py-10 text-3xl sm:text-4xl lg:text-5xl font-black text-white shadow-md transition flex items-center justify-center gap-4 cursor-pointer"
          >
            <span className="text-4xl sm:text-5xl">📞</span>
            <span>CALL AKHIL</span>
          </button>
        </section>
      </main>

      {/* ONE-TAP SOS */}
      <div className="max-w-6xl mx-auto w-full mb-8 px-4">
        <button
          type="button"
          onClick={handleSOS}
          className="w-full rounded-3xl bg-red-600 hover:bg-red-700 active:scale-[0.98] border-4 border-red-500 py-8 sm:py-10 text-3xl sm:text-4xl lg:text-5xl font-black text-white shadow-xl transition flex items-center justify-center gap-4"
          aria-label="Call guardian for help"
        >
          <span className="text-5xl sm:text-6xl">🆘</span>
          <span>CALL FOR HELP</span>
        </button>

        <p className="text-center text-base sm:text-lg font-bold text-slate-500 mt-3">
          One tap calls your trusted guardian immediately
        </p>
      </div>

      {/* FOOTER & CAREGIVER NAVIGATION */}
      <footer className="border-t-2 border-[#DDE4EE] pt-4 px-4 sm:px-6 flex flex-wrap items-center justify-between text-xs text-slate-500">
        <div className="flex items-center gap-3">
          <span className="font-bold text-[#173B63]">
            Cooee Emergency Mode
          </span>
          <span>•</span>
          <span>Elderly-Friendly</span>
        </div>

        {/* Demo controls */}
        <div className="flex flex-wrap items-center gap-2 mt-2 sm:mt-0">
          <span className="text-[11px] text-slate-500 font-medium">
            Simulate:
          </span>

          <button
            onClick={() => {
              simulateIncomingCall?.({
                from: "+61 480 000 111",
                intentTag: "Emergency",
                priority: "CRITICAL",
                note: "Guardian auto-answer test",
              });
            }}
            className="rounded-xl bg-[#F2F7E6] hover:bg-[#E5F0D0] border border-[#A7C957] text-[#3F6010] px-3 py-1.5 text-[11px] font-bold transition shadow-sm"
          >
            Test Guardian Call
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
            className="rounded-xl bg-white hover:bg-[#F8F9FB] border border-[#DDE4EE] text-slate-700 px-3 py-1.5 text-[11px] font-semibold transition shadow-sm"
          >
            Test Untrusted Caller
          </button>

          <Link
            href="/dialer"
            className="rounded-xl bg-[#173B63] hover:bg-[#102742] text-white px-3.5 py-1.5 text-[11px] font-bold shadow-sm transition"
          >
            Switch to WebDialer →
          </Link>
        </div>
      </footer>
    </div>
  );
}