"use client";

import React, { useEffect, useRef, useState } from "react";
import NetworkSimulator from "./NetworkSimulator";
import PTTControl from "./PTTControl";
import TextFallbackPanel from "./TextFallbackPanel";
import TelemetryHUD from "./TelemetryHUD";
import { useNetworkStats } from "./useNetworkStats";

// The in call screen, shown whenever callState is CONNECTED.
// It receives the whole useWebRTC result as the `call` prop, so the parent owns
// the one and only hook instance. Never call useWebRTC inside this component.

const TOAST_MESSAGES = {
  FULL_AUDIO: "Network recovered. Back to full audio. Call kept alive.",
  PTT: "Network degraded. Switched to Push to Talk. Call kept alive.",
  TEXT: "Network critical. Switched to live text. Call kept alive.",
};

const TOAST_DURATION_MS = 4000;

export default function ActiveCallView({ call, dialedNumber }) {
  const {
    networkMode = "FULL_AUDIO",
    incomingCall = null,
    isPTTTalking = false,
    isRemotePTTTalking = false,
    myNumber = "",
    chatMessages = [],
    remoteTypingText = "",
    peerConnectionRef = null,
    setFallbackMode,
    setPTTActive,
    sendTextFallback,
    sendLiveTyping,
    endActiveCall,
  } = call ?? {};

  const partnerNumber = incomingCall?.from ?? dialedNumber ?? "Unknown number";

  // Telemetry numbers. With the mock hook the ref is null, so these are fake values
  // until the simulator sets an override.
  const { telemetry, source, setOverride, isOverridden, evaluatedLevel } =
    useNetworkStats({ peerConnectionRef, networkMode });

  // Edge triggered switching. setFallbackMode is called only when the evaluated
  // level changes, never on every tick. When there is nothing to evaluate we forget
  // the last level, so the next level is compared with the current networkMode.
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

  // The chat draft lives here so it survives switching away from TEXT and back.
  const [draft, setDraft] = useState("");

  // Mode change toast. The first render never shows one.
  const [toast, setToast] = useState("");
  const previousMode = useRef(networkMode);

  useEffect(() => {
    if (previousMode.current === networkMode) return undefined;
    previousMode.current = networkMode;
    setToast(TOAST_MESSAGES[networkMode] ?? "");
    const timer = setTimeout(() => setToast(""), TOAST_DURATION_MS);
    return () => clearTimeout(timer);
  }, [networkMode]);

  return (
    <section
      aria-label="Active call"
      className="min-h-screen bg-slate-950 px-4 pb-72 pt-6 text-white"
    >
      <div className="mx-auto flex max-w-xl flex-col gap-6">
        {/* Header row: telemetry HUD and intent badge */}
        <header className="flex flex-wrap items-start justify-between gap-3">
          <TelemetryHUD
            networkMode={networkMode}
            telemetry={telemetry}
            source={source}
          />

          {incomingCall?.intentTag && (
            <div
              data-testid="intent-badge"
              className="max-w-full rounded-2xl border border-violet-600 bg-violet-600/10 px-4 py-2 text-right"
            >
              <p className="break-words text-base font-semibold text-violet-200">
                {incomingCall.intentTag}
              </p>
              {incomingCall.note && (
                <p className="break-words text-sm text-slate-400">
                  {incomingCall.note}
                </p>
              )}
            </div>
          )}
        </header>

        {/* Partner number. A call duration timer is a stretch goal. */}
        <div>
          <p className="text-sm text-slate-400">On a call with</p>
          <p className="text-3xl font-bold">{partnerNumber}</p>
        </div>

        {/* Mode area, switched by networkMode */}
        <div
          data-testid="mode-area"
          data-mode={networkMode}
          className="rounded-2xl border border-slate-800 bg-slate-900 p-6"
        >
          {networkMode === "FULL_AUDIO" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <div
                aria-hidden="true"
                className="h-24 w-24 rounded-full border-4 border-emerald-500 bg-emerald-500/20 motion-safe:animate-pulse"
              />
              <h3 className="text-2xl font-semibold">Live audio</h3>
              <p className="text-lg text-slate-400">
                Talk normally. The call is clear.
              </p>
            </div>
          )}

          {networkMode === "PTT" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <h3 className="text-2xl font-semibold">Push to Talk</h3>
              <PTTControl
                networkMode={networkMode}
                isPTTTalking={isPTTTalking}
                isRemotePTTTalking={isRemotePTTTalking}
                setPTTActive={setPTTActive}
              />
            </div>
          )}

          {networkMode === "TEXT" && (
            <div className="flex flex-col items-center gap-4 text-center">
              <h3 className="text-2xl font-semibold">Live text</h3>
              <TextFallbackPanel
                chatMessages={chatMessages}
                remoteTypingText={remoteTypingText}
                myNumber={myNumber}
                draft={draft}
                onDraftChange={setDraft}
                sendTextFallback={sendTextFallback}
                sendLiveTyping={sendLiveTyping}
              />
            </div>
          )}
        </div>

        {/* Mode change toast. The region is always mounted so screen readers announce changes. */}
        <div role="status" aria-live="polite" className="min-h-[56px]">
          {toast && (
            <p className="rounded-xl border border-indigo-500 bg-indigo-500/10 px-4 py-3 text-base text-indigo-200">
              {toast}
            </p>
          )}
        </div>

        <button
          type="button"
          onClick={() => endActiveCall?.()}
          className="min-h-[56px] w-full rounded-xl bg-rose-600 px-6 text-lg font-semibold text-white focus:outline-none focus:ring-4 focus:ring-rose-300"
        >
          End call
        </button>
      </div>

      {/* The hook binds the remote stream to this id, so it must exist in every mode including TEXT. */}
      <audio id="remoteAudio" autoPlay />

      <NetworkSimulator
        isOverridden={isOverridden}
        onSelectPreset={setOverride}
        onReturnToLive={() => setOverride(null)}
      />
    </section>
  );
}
