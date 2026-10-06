"use client";
import { useEffect, useRef, useState } from "react";
import { getIntent, formatTimeIn, cityFromTz, isLateNight } from "../utils/intents";
import {
  notifyIncomingCall, closeCallNotification, startRingtone, stopRingtone,
} from "../utils/notifications";

/**
 * Props (all come from useWebRTC()):
 *  - incomingCall: null | { from, intentTag, priority, note, callerTime, callerTz }
 *  - callState: any value. The modal does NOT need "RINGING"; it opens whenever
 *    incomingCall is set and the call is not yet CONNECTED.
 *  - onAccept: answerIncomingCall
 *  - onDecline: endActiveCall
 *  - suppress: true on /dependent for trusted guardians (Anjali's auto-answer takes over)
 */
export default function IncomingCallModal({
  incomingCall, callState, onAccept, onDecline, suppress = false,
}) {
  // Stable id for a call, so a re-created object from the hook does not re-ring.
  const sig = incomingCall
    ? `${incomingCall.from}|${incomingCall.callerTime}|${incomingCall.intentTag}`
    : null;

  // Locally remember Accept/Decline, in case the hook leaves incomingCall set.
  const [dismissedSig, setDismissedSig] = useState(null);
  useEffect(() => {
    if (!incomingCall) setDismissedSig(null); // reset once the hook clears it
  }, [incomingCall]);

  const open =
    !!incomingCall && callState !== "CONNECTED" && sig !== dismissedSig && !suppress;

  const handleAccept = () => { setDismissedSig(sig); onAccept?.(); };
  const handleDecline = () => { setDismissedSig(sig); onDecline?.(); };

  const acceptRef = useRef(null);
  const [, force] = useState(0);

  // Re-render every 30s so the caller's clock stays correct while ringing.
  useEffect(() => {
    if (!open) return;
    const id = setInterval(() => force((n) => n + 1), 30000);
    return () => clearInterval(id);
  }, [open]);

  // Notification + ringtone lifecycle.
  useEffect(() => {
    if (!open) return;
    notifyIncomingCall(incomingCall);
    startRingtone();
    acceptRef.current?.focus();
    return () => {
      stopRingtone();
      closeCallNotification();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, sig]);

  if (!open) return null;

  const intent = getIntent(incomingCall.intentTag, incomingCall.priority);
  const tz = incomingCall.callerTz;
  const callerClock = formatTimeIn(tz) || incomingCall.callerTime || "";
  const city = cityFromTz(tz);
  const late = tz ? isLateNight(tz) : false;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="incoming-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95 p-4"
    >
      <p className="sr-only" aria-live="assertive">
        Incoming {intent.label} call from {incomingCall.from}
      </p>

      <div className="relative w-full max-w-md rounded-3xl bg-slate-900 p-6 text-center text-slate-100 shadow-2xl">
        {/* Separate ring so only the border pulses, not the text */}
        <div
          aria-hidden="true"
          className={`pointer-events-none absolute inset-0 rounded-3xl border-4 ${intent.ring} ${
            intent.pulse ? "animate-pulse" : "opacity-70"
          }`}
        />

        <p className="text-sm text-slate-400">Incoming Cooee call</p>
        <h1 id="incoming-title" className="mt-1 text-3xl font-bold tabular-nums sm:text-4xl">
          {incomingCall.from}
        </h1>

        <p className={`mx-auto mt-4 inline-flex items-center gap-2 rounded-full px-4 py-2 text-base font-semibold ${intent.badge}`}>
          <span aria-hidden="true">{intent.icon}</span>
          {intent.label}
        </p>

        {incomingCall.note && (
          <p className="mt-4 text-lg text-slate-200">&ldquo;{incomingCall.note}&rdquo;</p>
        )}

        {tz && (
          <div className="mt-5 rounded-2xl bg-slate-800 px-4 py-3 text-sm text-slate-200">
            <span aria-hidden="true">🌏 </span>
            Caller local time: <strong>{callerClock}</strong> ({city})
            {late && (
              <p className="mt-2 inline-block rounded-full bg-indigo-500/20 px-3 py-1 text-indigo-200">
                🌙 It is late at night for the caller
              </p>
            )}
          </div>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={handleDecline}
            className="min-h-14 rounded-2xl bg-slate-700 px-4 py-4 text-lg font-semibold hover:bg-slate-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Decline
          </button>
          <button
            ref={acceptRef}
            type="button"
            onClick={handleAccept}
            className="min-h-14 rounded-2xl bg-emerald-500 px-4 py-4 text-lg font-semibold text-slate-950 hover:bg-emerald-400 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
