"use client";

import React, { useEffect, useRef, useState } from "react";
import NetworkSimulator from "./NetworkSimulator";
import PTTControl from "./PTTControl";
import TextFallbackPanel from "./TextFallbackPanel";
import TelemetryHUD from "./TelemetryHUD";
import { useNetworkStats } from "./useNetworkStats";

// The in call screen, shown whenever callState is CONNECTED.
// It receives the whole useWebRTC result as the `call` prop, so the parent owns
// the one and only hook instance.

const TOAST_MESSAGES = {
  FULL_AUDIO: "Network recovered. Back to full audio. Call kept alive.",
  PTT: "Network degraded. Switched to Push to Talk. Call kept alive.",
  TEXT: "Network critical. Switched to live text. Call kept alive.",
};

const TOAST_DURATION_MS = 4000;

function formatSeconds(sec) {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export default function ActiveCallView({ call, dialedNumber }) {
  const {
    networkMode = "FULL_AUDIO",
    incomingCall = null,
    activeCallMeta = null,
    isPTTTalking = false,
    isRemotePTTTalking = false,
    myNumber = "",
    chatMessages = [],
    remoteLiveDraft = "",
    remoteTypingText = "",
    remoteAudioRef = null,
    peerConnectionRef = null,
    setFallbackMode,
    setPTTActive,
    sendTextFallback,
    sendLiveTyping,
    handleTypingInput,
    endActiveCall,
  } = call ?? {};

  const partnerNumber =
    incomingCall?.from ??
    activeCallMeta?.remoteNumber ??
    dialedNumber ??
    "Unknown number";

  const partnerTypingText = remoteTypingText || remoteLiveDraft || "";
  const onTyping = sendLiveTyping || handleTypingInput;

  // Phase 9: Call duration timer
  const [callDurationSec, setCallDurationSec] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCallDurationSec((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Telemetry numbers
  const { telemetry, source, setOverride, isOverridden, evaluatedLevel } =
    useNetworkStats({ peerConnectionRef, networkMode });

  // Edge triggered switching
  const networkModeRef = useRef(networkMode);
  networkModeRef.current = networkMode;
  const lastLevelRef = useRef(null);

  useEffect(() => {
    if (!evaluatedLevel) {
      lastLevelRef.current = null;
      return;
    }
    const baseline = lastLevelRef.current ?? networkModeRef.current;
    lastLevelRef.current = evaluatedLevel;
    if (evaluatedLevel !== baseline) {
      setFallbackMode?.(evaluatedLevel);
    }
  }, [evaluatedLevel, setFallbackMode]);

  // Chat draft survives switching away from TEXT and back
  const [draft, setDraft] = useState("");

  // Mode change toast
  const [toast, setToast] = useState("");
  const previousMode = useRef(networkMode);

  useEffect(() => {
    if (previousMode.current === networkMode) return undefined;
    previousMode.current = networkMode;
    setToast(TOAST_MESSAGES[networkMode] ?? "");
    const timer = setTimeout(() => setToast(""), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [networkMode]);

  const intentTag = incomingCall?.intentTag || activeCallMeta?.intentTag;
  const note = incomingCall?.note || activeCallMeta?.note;

  return (
    <section
      aria-label="Active call"
      className="h-screen w-screen bg-slate-950 px-4 sm:px-6 py-4 text-white flex flex-col justify-between overflow-hidden"
    >
      <div className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-between overflow-hidden min-h-0">
        {/* Header row: telemetry HUD, call timer and intent badge */}
        <header className="flex flex-wrap items-start justify-between gap-3 shrink-0 pb-2">
          <TelemetryHUD
            networkMode={networkMode}
            telemetry={telemetry}
            source={source}
          />

          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-2 rounded-full border border-slate-700 bg-slate-900 px-3 py-1 font-mono text-xs font-semibold text-slate-200 shadow-inner">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
              <span>{formatSeconds(callDurationSec)}</span>
            </div>

            {intentTag && (
              <div
                data-testid="intent-badge"
                className="max-w-full rounded-xl border border-violet-600 bg-violet-600/10 px-3 py-1 text-right"
              >
                <p className="break-words text-xs font-semibold text-violet-200">
                  {intentTag}
                </p>
                {note && (
                  <p className="break-words text-[10px] text-slate-400">
                    {note}
                  </p>
                )}
              </div>
            )}
          </div>
        </header>

        {/* Partner number */}
        <div className="shrink-0 py-1 text-center sm:text-left">
          <p className="text-xs text-slate-400">On a call with</p>
          <p className="text-2xl sm:text-3xl font-bold font-mono text-white">{partnerNumber}</p>
        </div>

        {/* Mode area, switched by networkMode (flex-1 fills available viewport) */}
        <div
          data-testid="mode-area"
          data-mode={networkMode}
          className="my-2 flex-1 rounded-2xl border border-slate-800 bg-slate-900/90 p-4 flex flex-col justify-center items-center overflow-hidden min-h-0"
        >
          {networkMode === "FULL_AUDIO" && (
            <div className="flex flex-col items-center gap-3 text-center my-auto">
              <div
                aria-hidden="true"
                className="h-20 w-20 rounded-full border-4 border-emerald-500 bg-emerald-500/20 motion-safe:animate-pulse"
              />
              <h3 className="text-xl font-semibold">Live audio</h3>
              <p className="text-sm text-slate-400">
                Talk normally. The call is clear.
              </p>
            </div>
          )}

          {networkMode === "PTT" && (
            <div className="flex flex-col items-center gap-3 text-center my-auto">
              <h3 className="text-xl font-semibold">Push to Talk</h3>
              <PTTControl
                networkMode={networkMode}
                isPTTTalking={isPTTTalking}
                isRemotePTTTalking={isRemotePTTTalking}
                setPTTActive={setPTTActive}
              />
            </div>
          )}

          {networkMode === "TEXT" && (
            <div className="flex flex-col items-center gap-2 text-center w-full h-full overflow-hidden">
              <h3 className="text-lg font-semibold shrink-0">Live text</h3>
              <div className="w-full flex-1 min-h-0 flex flex-col">
                <TextFallbackPanel
                  chatMessages={chatMessages}
                  remoteTypingText={partnerTypingText}
                  myNumber={myNumber}
                  draft={draft}
                  onDraftChange={setDraft}
                  sendTextFallback={sendTextFallback}
                  sendLiveTyping={onTyping}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mode change toast */}
        <div role="status" aria-live="polite" className="h-[40px] shrink-0 flex items-center justify-center">
          {toast && (
            <p className="rounded-xl border border-indigo-500 bg-indigo-500/15 px-4 py-1.5 text-xs text-indigo-200">
              {toast}
            </p>
          )}
        </div>

        {/* End Call Button */}
        <button
          type="button"
          onClick={() => endActiveCall?.()}
          className="h-[50px] shrink-0 w-full rounded-xl bg-rose-600 px-6 text-base font-semibold text-white focus:outline-none focus:ring-4 focus:ring-rose-300 transition hover:bg-rose-700 active:scale-[0.99]"
        >
          End call
        </button>
      </div>

      <audio id="remoteAudio" ref={remoteAudioRef} autoPlay />

      <NetworkSimulator
        isOverridden={isOverridden}
        onSelectPreset={setOverride}
        onReturnToLive={() => setOverride(null)}
      />
    </section>
  );
}
