// TEMPORARY UI DEVELOPMENT MOCK
// Replace this adapter with Akshay's shared useWebRTC hook when his implementation is integrated.

"use client";

import { useState, useEffect, useCallback } from "react";

export interface MockIncomingCall {
  from: string;
  intentTag: "Just saying hello" | "Need to talk" | "Urgent" | "Emergency" | string;
  priority: "LOW" | "NORMAL" | "HIGH" | "CRITICAL" | string;
  note?: string;
  callerTime?: string;
  callerTz?: string;
}

export type MockCallState = "IDLE" | "CALLING" | "RINGING" | "CONNECTED" | "ENDED";

export type MockNetworkMode =
  | "VOIP"
  | "CELLULAR"
  | "SATELLITE"
  | "LOW_BANDWIDTH"
  | "DATA_SAVER";

export interface MockTelemetry {
  latencyMs?: number;
  packetLossPercent?: number;
  jitterMs?: number;
  dataSavedMb?: number;
  codec?: string;
  bitrateKbps?: number;
  [key: string]: unknown;
}

export interface MockChatMessage {
  id: string;
  sender: string;
  text: string;
  timestamp: string;
}

export interface MockWebRTCState {
  myNumber: string;
  callState: MockCallState;
  incomingCall: MockIncomingCall | null;
  networkMode: MockNetworkMode;
  isPTTTalking: boolean;
  telemetry: MockTelemetry;
  chatMessages: MockChatMessage[];
  activeTargetNumber: string;
  activeIntentTag: string;
}

const defaultTelemetry: MockTelemetry = {
  latencyMs: 24,
  packetLossPercent: 0.1,
  jitterMs: 3,
  dataSavedMb: 14.8,
  codec: "Opus-NB (12kbps)",
  bitrateKbps: 16,
};

// Module-level shared store so components share consistent state without requiring a layout provider
let globalState: MockWebRTCState = {
  myNumber: "+61 480 000 111",
  callState: "IDLE",
  incomingCall: null,
  networkMode: "DATA_SAVER",
  isPTTTalking: false,
  telemetry: defaultTelemetry,
  chatMessages: [],
  activeTargetNumber: "",
  activeIntentTag: "Just saying hello",
};

const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function updateGlobalState(partial: Partial<MockWebRTCState>) {
  globalState = { ...globalState, ...partial };
  emitChange();
}

/**
 * useMockWebRTC()
 * Temporary React hook for UI development of /dialer and /dependent.
 * Matches all contract values and methods expected from Akshay's useWebRTC().
 */
export function useMockWebRTC() {
  const [state, setState] = useState<MockWebRTCState>(globalState);

  useEffect(() => {
    const handleChange = () => setState({ ...globalState });
    listeners.add(handleChange);
    return () => {
      listeners.delete(handleChange);
    };
  }, []);

  const registerNumber = useCallback((num: string) => {
    updateGlobalState({ myNumber: num });
  }, []);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const startCall = useCallback((targetNumber: string, intentTag?: string, _options?: unknown) => {
    updateGlobalState({
      activeTargetNumber: targetNumber,
      activeIntentTag: intentTag || "Just saying hello",
      callState: "CALLING",
    });

    // Simulate connecting after 1.8 seconds in UI mock
    setTimeout(() => {
      if (globalState.callState === "CALLING") {
        updateGlobalState({ callState: "CONNECTED" });
      }
    }, 1800);
  }, []);

  const answerIncomingCall = useCallback(() => {
    updateGlobalState({ callState: "CONNECTED" });
  }, []);

  const endActiveCall = useCallback(() => {
    updateGlobalState({ callState: "ENDED" });
    setTimeout(() => {
      updateGlobalState({
        callState: "IDLE",
        incomingCall: null,
        activeTargetNumber: "",
      });
    }, 400);
  }, []);

  const setFallbackMode = useCallback((mode: unknown) => {
    if (typeof mode === "string") {
      updateGlobalState({ networkMode: mode as MockNetworkMode });
    }
  }, []);

  const setPTTActive = useCallback((active: boolean) => {
    updateGlobalState({ isPTTTalking: active });
  }, []);

  const sendTextFallback = useCallback((text: string) => {
    const newMessage: MockChatMessage = {
      id: "msg-" + Date.now(),
      sender: "Me",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    updateGlobalState({ chatMessages: [...globalState.chatMessages, newMessage] });
  }, []);

  // Simulation helpers for UI verification and demonstration
  const simulateIncomingCall = useCallback((customCall: Partial<MockIncomingCall>) => {
    const call: MockIncomingCall = {
      from: customCall.from || "+61 480 000 111",
      intentTag: customCall.intentTag || "Urgent",
      priority: customCall.priority || "HIGH",
      note: customCall.note || "Automated test incoming call",
      callerTime: customCall.callerTime || "18:30",
      callerTz: customCall.callerTz || "Australia/Sydney",
    };
    updateGlobalState({
      incomingCall: call,
      callState: "RINGING",
    });
  }, []);

  return {
    // Exact contract properties
    myNumber: state.myNumber,
    callState: state.callState,
    incomingCall: state.incomingCall,
    networkMode: state.networkMode,
    isPTTTalking: state.isPTTTalking,
    telemetry: state.telemetry,
    chatMessages: state.chatMessages,
    registerNumber,
    startCall,
    answerIncomingCall,
    endActiveCall,
    setFallbackMode,
    setPTTActive,
    sendTextFallback,

    // Development simulation triggers for UI demo
    simulateIncomingCall,
    activeTargetNumber: state.activeTargetNumber,
    activeIntentTag: state.activeIntentTag,
  };
}
