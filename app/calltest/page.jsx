"use client";

import { useWebRTC } from "../../hooks/useWebRTC.mock";
import ActiveCallView from "../../components/call/ActiveCallView";

// Swap the hook import above for the real hook when it lands. Nothing else should change.

const DIALED_NUMBER = "+61 480 000 222";

const buttonClass =
  "min-h-[56px] rounded-xl bg-indigo-500 px-5 text-lg font-semibold text-white focus:outline-none focus:ring-4 focus:ring-violet-400";
const dangerClass = buttonClass.replace("bg-indigo-500", "bg-rose-600");
const quietClass = buttonClass.replace("bg-indigo-500", "bg-slate-700");

export default function CallTest() {
  const call = useWebRTC();
  const {
    callState,
    networkMode,
    incomingCall,
    startCall,
    answerIncomingCall,
    endActiveCall,
    setFallbackMode,
    simulateIncomingCall,
    __simulatePartnerPTT,
    __simulatePartnerTyping,
  } = call;

  return (
    <main className="min-h-screen bg-slate-950 p-6 text-white">
      <section className="mx-auto flex max-w-xl flex-col gap-6">
        <h1 className="text-2xl font-bold">Call test page</h1>

        <p
          className="rounded-xl border border-slate-800 bg-slate-900 p-4 text-lg"
          role="status"
          aria-live="polite"
        >
          {`callState: ${callState} | networkMode: ${networkMode}`}
        </p>

        {callState === "IDLE" && (
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              className={buttonClass}
              onClick={() => startCall(DIALED_NUMBER, null)}
            >
              Start fake call
            </button>
            <button
              type="button"
              className={quietClass}
              onClick={simulateIncomingCall}
            >
              Simulate incoming
            </button>
          </div>
        )}

        {callState === "CALLING" && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xl text-slate-400">Calling...</h2>
            <button type="button" className={dangerClass} onClick={endActiveCall}>
              End call
            </button>
          </div>
        )}

        {callState === "RINGING" && (
          <div className="flex flex-col gap-3">
            <h2 className="text-xl text-slate-400">
              {`Incoming call from ${incomingCall?.from ?? "unknown"}`}
            </h2>
            <div className="flex gap-3">
              <button
                type="button"
                className={buttonClass}
                onClick={answerIncomingCall}
              >
                Answer
              </button>
              <button
                type="button"
                className={dangerClass}
                onClick={endActiveCall}
              >
                Decline
              </button>
            </div>
          </div>
        )}

        {callState === "CONNECTED" && (
          <div className="flex flex-col gap-4">
            {/* Test harness heading. The page tests look for this exact text. */}
            <h2 className="text-xl font-semibold text-emerald-500">
              CONNECTED (ActiveCallView goes here)
            </h2>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={quietClass}
                onClick={() => setFallbackMode("FULL_AUDIO")}
              >
                FULL_AUDIO
              </button>
              <button
                type="button"
                className={quietClass}
                onClick={() => setFallbackMode("PTT")}
              >
                PTT
              </button>
              <button
                type="button"
                className={quietClass}
                onClick={() => setFallbackMode("TEXT")}
              >
                TEXT
              </button>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                className={quietClass}
                onClick={__simulatePartnerPTT}
              >
                Simulate partner talking
              </button>
              <button
                type="button"
                className={quietClass}
                onClick={() => __simulatePartnerTyping("Hello from the other side")}
              >
                Simulate partner typing
              </button>
            </div>
          </div>
        )}
      </section>

      {/* The End call button lives inside ActiveCallView while connected. */}
      {callState === "CONNECTED" && (
        <ActiveCallView call={call} dialedNumber={DIALED_NUMBER} />
      )}
    </main>
  );
}
