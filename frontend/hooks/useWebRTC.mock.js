"use client";
import { useState, useCallback } from "react";

// Mock of Akshay's useWebRTC() with the EXACT shared contract.
// When the real hook lands, change ONE import line:
//   import useWebRTC from "../hooks/useWebRTC.mock";   ->   import useWebRTC from "../hooks/useWebRTC";
export default function useWebRTC() {
  const [callState, setCallState] = useState("IDLE");
  const [incomingCall, setIncomingCall] = useState(null);

  const startCall = useCallback((to, intent) => {
    console.log("[mock] startCall", to, intent);
    setCallState("CALLING");
  }, []);
  const answerIncomingCall = useCallback(() => {
    setIncomingCall(null);
    setCallState("CONNECTED");
  }, []);
  const endActiveCall = useCallback(() => {
    setIncomingCall(null);
    setCallState("IDLE");
  }, []);

  // DEV ONLY (not in the real contract): fake an incoming call.
  const __simulateIncoming = useCallback((tag = "Urgent", tz = "Australia/Sydney") => {
    const map = { Urgent: "HIGH", Work: "MEDIUM", Casual: "LOW" };
    const labels = { Urgent: "Urgent - Please Pick Up", Work: "Work / Flight Update", Casual: "Casual - Catching Up" };
    setIncomingCall({
      from: "+61 480 111 222",
      intentTag: labels[tag],
      priority: map[tag],
      note: tag === "Urgent" ? "Flight delayed" : "",
      callerTime: "02:30",
      callerTz: tz,
    });
    // Real hook currently has only 2 states and never sets RINGING, so we don't either.
  }, []);

  return {
    myNumber: "+61 480 000 111",
    callState,
    incomingCall,
    networkMode: "FULL_AUDIO",
    isPTTTalking: false,
    telemetry: { jitter: 14, packetLoss: 0.2, rtt: 52 },
    chatMessages: [],
    registerNumber: () => {},
    startCall,
    answerIncomingCall,
    endActiveCall,
    setFallbackMode: () => {},
    setPTTActive: () => {},
    sendTextFallback: () => {},
    __simulateIncoming,
  };
}
