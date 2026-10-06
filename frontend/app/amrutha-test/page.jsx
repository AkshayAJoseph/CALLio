"use client";
import { useState } from "react";
// Swap this line to the real hook once Akshay pushes it:
import useWebRTC from "../../hooks/useWebRTC.mock";
import IntentPicker from "../../components/IntentPicker";
import IncomingCallModal from "../../components/IncomingCallModal";
import EnableAlertsButton from "../../components/EnableAlertsButton";

// Private test harness for Pillar 1. Visit /amrutha-test. Not part of the final demo.
export default function Page() {
  const rtc = useWebRTC();
  const [target, setTarget] = useState("+61 480 111 222");

  return (
    <main className="flex min-h-screen flex-col items-center gap-6 bg-slate-950 p-6 text-slate-100">
      <h1 className="text-2xl font-bold">Pillar 1 test page</h1>
      <p className="text-sm text-slate-400">Call state: {rtc.callState}</p>
      <EnableAlertsButton />

      <input
        value={target}
        onChange={(e) => setTarget(e.target.value)}
        aria-label="Number to call"
        className="w-full max-w-md rounded-xl border border-slate-700 bg-slate-900 px-4 py-3"
      />

      <IntentPicker
        targetNumber={target}
        disabled={rtc.callState !== "IDLE"}
        onCall={(intent) => rtc.startCall(target, intent)}
      />

      {rtc.__simulateIncoming && (
        <div className="flex flex-wrap justify-center gap-2">
          <p className="w-full text-center text-sm text-slate-400">
            Simulate incoming (switch to another tab within 3s to test the notification)
          </p>
          {["Urgent", "Work", "Casual"].map((t) => (
            <button
              key={t}
              onClick={() => setTimeout(() => rtc.__simulateIncoming(t), 3000)}
              className="rounded-full bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
            >
              {t} in 3s
            </button>
          ))}
          <button
            onClick={() => rtc.__simulateIncoming("Urgent", "Asia/Kolkata")}
            className="rounded-full bg-slate-800 px-4 py-2 text-sm hover:bg-slate-700"
          >
            Now (late-night test)
          </button>
        </div>
      )}

      <IncomingCallModal
        incomingCall={rtc.incomingCall}
        callState={rtc.callState}
        onAccept={rtc.answerIncomingCall}
        onDecline={rtc.endActiveCall}
      />
    </main>
  );
}
