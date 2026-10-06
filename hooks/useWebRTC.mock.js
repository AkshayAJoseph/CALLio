"use client";
import { useState, useRef, useCallback } from "react";

export function useWebRTC() {
  const [myNumber, setMyNumber] = useState("+61 480 000 111");
  const [callState, setCallState] = useState("IDLE");
  const [incomingCall, setIncomingCall] = useState(null);
  const [networkMode, setNetworkMode] = useState("FULL_AUDIO");
  const [isPTTTalking, setIsPTTTalking] = useState(false);
  const [isRemotePTTTalking, setIsRemotePTTTalking] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [remoteTypingText, setRemoteTypingText] = useState("");

  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const dataChannelRef = useRef(null);

  const registerNumber = useCallback((n) => setMyNumber(n), []);

  const startCall = useCallback((targetNumber, intentObject) => {
    setCallState("CALLING");
    setIncomingCall({ from: myNumber, to: targetNumber, ...intentObject });
    setTimeout(() => setCallState("CONNECTED"), 1500);
  }, [myNumber]);

  const simulateIncomingCall = useCallback((payload) => {
    setIncomingCall(
      payload || {
        from: "+61 480 111 222",
        intentTag: "Urgent, Please Pick Up",
        priority: "HIGH",
        note: "Flight delayed in Sydney",
        callerTime: "18:30",
        callerTz: "Australia/Sydney",
      }
    );
    setCallState("RINGING");
  }, []);

  const answerIncomingCall = useCallback(() => setCallState("CONNECTED"), []);

  const endActiveCall = useCallback(() => {
    setCallState("IDLE");
    setIncomingCall(null);
    setNetworkMode("FULL_AUDIO");
    setIsPTTTalking(false);
    setIsRemotePTTTalking(false);
    setChatMessages([]);
    setRemoteTypingText("");
  }, []);

  const setFallbackMode = useCallback((mode) => {
    setNetworkMode(mode);
  }, []);

  const setPTTActive = useCallback((holding) => {
    setIsPTTTalking(holding);
  }, []);

  const sendTextFallback = useCallback((text) => {
    if (!text.trim()) return;
    const msg = {
      sender: myNumber,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, msg]);
  }, [myNumber]);

  const sendLiveTyping = useCallback(() => {}, []);

  // Dev helper: partner types a message character by character
  const __simulatePartnerTyping = useCallback((fullText, msPerChar = 90) => {
    let i = 0;
    const timer = setInterval(() => {
      i += 1;
      setRemoteTypingText(fullText.slice(0, i));
      if (i >= fullText.length) {
        clearInterval(timer);
        setTimeout(() => {
          setRemoteTypingText("");
          setChatMessages((prev) => [
            ...prev,
            { sender: "+61 480 111 222", text: fullText, time: "10:05" },
          ]);
        }, 600);
      }
    }, msPerChar);
  }, []);

  // Dev helper: partner holds the talk button for 3 seconds
  const __simulatePartnerPTT = useCallback(() => {
    setIsRemotePTTTalking(true);
    setTimeout(() => setIsRemotePTTTalking(false), 3000);
  }, []);

  return {
    myNumber, callState, incomingCall, networkMode, isPTTTalking,
    isRemotePTTTalking, chatMessages, remoteTypingText, peerConnectionRef,
    registerNumber, startCall, simulateIncomingCall, answerIncomingCall,
    endActiveCall, setFallbackMode, setPTTActive, sendTextFallback,
    sendLiveTyping, __simulatePartnerTyping, __simulatePartnerPTT,
  };
}