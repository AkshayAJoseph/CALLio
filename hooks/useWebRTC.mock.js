import { useCallback, useEffect, useRef, useState } from "react";

// Mock of the shared useWebRTC contract. Swap the import line for the real hook later.
// It connects locally with no remote peer, so it also covers the ?demo=true demo mode.

const MY_NUMBER = "+61 480 000 111";
const PARTNER_NUMBER = "+61 480 000 222";
const CONNECT_DELAY_MS = 1500;
const REMOTE_PTT_HOLD_MS = 3000;
const TYPING_STEP_MS = 60;

const formatTime = () =>
  new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

export function useWebRTC() {
  const [callState, setCallState] = useState("IDLE");
  const [incomingCall, setIncomingCall] = useState(null);
  const [networkMode, setNetworkMode] = useState("FULL_AUDIO");
  const [isPTTTalking, setIsPTTTalking] = useState(false);
  const [isRemotePTTTalking, setIsRemotePTTTalking] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [remoteTypingText, setRemoteTypingText] = useState("");

  // Always null in the mock, so stats polling must guard against it.
  const peerConnectionRef = useRef(null);

  const connectTimerRef = useRef(null);
  const remotePTTTimerRef = useRef(null);
  const typingTimerRef = useRef(null);

  const clearTimers = useCallback(() => {
    clearTimeout(connectTimerRef.current);
    clearTimeout(remotePTTTimerRef.current);
    clearInterval(typingTimerRef.current);
    connectTimerRef.current = null;
    remotePTTTimerRef.current = null;
    typingTimerRef.current = null;
  }, []);

  useEffect(() => clearTimers, [clearTimers]);

  const registerNumber = useCallback(() => { }, []);

  const startCall = useCallback(
    (targetNumber, intentObject) => {
      if (callState !== "IDLE") return;
      setIncomingCall(
        intentObject
          ? {
            from: targetNumber || PARTNER_NUMBER,
            intentTag: intentObject.intentTag ?? "",
            priority: intentObject.priority ?? "MEDIUM",
            note: intentObject.note ?? "",
            callerTime: intentObject.callerTime ?? "",
            callerTz: intentObject.callerTz ?? "",
          }
          : null
      );
      setCallState("CALLING");
      clearTimeout(connectTimerRef.current);
      connectTimerRef.current = setTimeout(() => {
        setCallState("CONNECTED");
      }, CONNECT_DELAY_MS);
    },
    [callState]
  );

  const simulateIncomingCall = useCallback(() => {
    if (callState !== "IDLE") return;
    setIncomingCall({
      from: PARTNER_NUMBER,
      intentTag: "Urgent, Please Pick Up",
      priority: "HIGH",
      note: "Please call me back as soon as you can",
      callerTime: formatTime(),
      callerTz: "Australia/Sydney",
    });
    setCallState("RINGING");
  }, [callState]);

  const answerIncomingCall = useCallback(() => {
    setCallState((current) => (current === "RINGING" ? "CONNECTED" : current));
  }, []);

  const endActiveCall = useCallback(() => {
    clearTimers();
    setCallState("IDLE");
    setIncomingCall(null);
    setNetworkMode("FULL_AUDIO");
    setIsPTTTalking(false);
    setIsRemotePTTTalking(false);
    setChatMessages([]);
    setRemoteTypingText("");
  }, [clearTimers]);

  const setFallbackMode = useCallback((mode) => {
    setNetworkMode(mode);
    // Leaving PTT must never leave the mic held open.
    if (mode !== "PTT") setIsPTTTalking(false);
  }, []);

  const setPTTActive = useCallback((active) => {
    setIsPTTTalking(Boolean(active));
  }, []);

  const sendTextFallback = useCallback((text) => {
    const trimmed = typeof text === "string" ? text.trim() : "";
    if (!trimmed) return;
    setChatMessages((prev) => [
      ...prev,
      { sender: MY_NUMBER, text: trimmed, time: formatTime() },
    ]);
  }, []);

  // The mock has no partner to notify, so the live draft goes nowhere.
  const sendLiveTyping = useCallback(() => { }, []);

  // Test helper: partner holds push to talk for a few seconds.
  const __simulatePartnerPTT = useCallback(() => {
    setIsRemotePTTTalking(true);
    clearTimeout(remotePTTTimerRef.current);
    remotePTTTimerRef.current = setTimeout(() => {
      setIsRemotePTTTalking(false);
    }, REMOTE_PTT_HOLD_MS);
  }, []);

  // Test helper: reveal the partner draft one character at a time, then send it as a message.
  const __simulatePartnerTyping = useCallback((fullText) => {
    const text = typeof fullText === "string" ? fullText : "";
    if (!text) return;
    clearInterval(typingTimerRef.current);
    let index = 0;
    typingTimerRef.current = setInterval(() => {
      index += 1;
      setRemoteTypingText(text.slice(0, index));
      if (index >= text.length) {
        clearInterval(typingTimerRef.current);
        typingTimerRef.current = null;
        setRemoteTypingText("");
        setChatMessages((prev) => [
          ...prev,
          { sender: PARTNER_NUMBER, text, time: formatTime() },
        ]);
      }
    }, TYPING_STEP_MS);
  }, []);

  return {
    myNumber: MY_NUMBER,
    callState,
    incomingCall,
    networkMode,
    isPTTTalking,
    isRemotePTTTalking,
    chatMessages,
    remoteTypingText,
    peerConnectionRef,
    startCall,
    answerIncomingCall,
    endActiveCall,
    registerNumber,
    setFallbackMode,
    setPTTActive,
    sendTextFallback,
    sendLiveTyping,
    simulateIncomingCall,
    __simulatePartnerPTT,
    __simulatePartnerTyping,
  };
}