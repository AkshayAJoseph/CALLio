"use client";

import { createContext, useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";

export const WebRTCContext = createContext(null);

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export function WebRTCProvider({ children }) {
  // --- STATE VARIABLES (LOCKED CONTRACT) ---
  const [myNumber, setMyNumber] = useState("+61 480 000 111");
  const [isRegistered, setIsRegistered] = useState(false);
  const [onlineNumbers, setOnlineNumbers] = useState([]);
  
  const [callState, setCallState] = useState("IDLE"); // "IDLE" | "CALLING" | "RINGING" | "CONNECTED"
  const [incomingCall, setIncomingCall] = useState(null);
  const [activeCallMeta, setActiveCallMeta] = useState(null);
  
  const [networkMode, setNetworkMode] = useState("FULL_AUDIO"); // "FULL_AUDIO" | "PTT" | "TEXT"
  const [isPTTTalking, setIsPTTTalking] = useState(false);
  const [isRemotePTTTalking, setIsRemotePTTTalking] = useState(false);
  
  const [chatMessages, setChatMessages] = useState([]);
  const [isLiveDraftEnabled, setIsLiveDraftEnabled] = useState(true);
  const [isRemoteTyping, setIsRemoteTyping] = useState(false);
  const [remoteLiveDraft, setRemoteLiveDraft] = useState("");
  
  const [telemetry, setTelemetry] = useState({ jitter: 0, packetLoss: 0, rtt: 0 });
  const [isDemoLoopbackMode, setIsDemoLoopbackMode] = useState(false);

  // --- REFS ---
  const socketRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const localStreamRef = useRef(null);
  const remoteAudioRef = useRef(null);
  const dataChannelRef = useRef(null); // Used internally for the data channel
  const iceCandidateQueueRef = useRef([]); // Crucial for WebRTC stability

  // --- SOCKET.IO SETUP & AUTO-REGISTRATION ---
  useEffect(() => {
    // Check URL for demo mode
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("demo") === "true") {
        setIsDemoLoopbackMode(true);
      }
    }

    socketRef.current = io(SOCKET_URL, {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    const socket = socketRef.current;

    socket.on("connect", () => {
      console.log("[WebRTCContext] Socket connected:", socket.id);
      // Auto-register on connect/reconnect
      socket.emit("register", myNumber);
      setIsRegistered(true);
    });

    socket.on("online-numbers", (numbers) => {
      setOnlineNumbers(numbers);
    });

    socket.on("disconnect", () => {
      console.log("[WebRTCContext] Socket disconnected");
      setIsRegistered(false);
    });

    return () => {
      socket.disconnect();
    };
  }, [myNumber]);

  // --- ACTION FUNCTIONS (STUBS FOR NOW) ---
  const registerNumber = (phoneNumberString) => {
    setMyNumber(phoneNumberString);
    if (socketRef.current?.connected) {
      socketRef.current.emit("register", phoneNumberString);
    }
  };

  const startCall = async (targetNumberString, intentObject) => {
    console.log("startCall stub", targetNumberString, intentObject);
  };

  const simulateIncomingCall = (mockPayloadOptional) => {
    console.log("simulateIncomingCall stub", mockPayloadOptional);
  };

  const answerIncomingCall = async () => {
    console.log("answerIncomingCall stub");
  };

  const endActiveCall = () => {
    console.log("endActiveCall stub");
  };

  const setFallbackMode = (mode) => {
    console.log("setFallbackMode stub", mode);
  };

  const setPTTActive = (isHolding) => {
    console.log("setPTTActive stub", isHolding);
  };

  const handleTypingInput = (draftString) => {
    console.log("handleTypingInput stub", draftString);
  };

  const sendTextFallback = (messageString) => {
    console.log("sendTextFallback stub", messageString);
  };

  // The locked contract object
  const value = {
    myNumber,
    isRegistered,
    onlineNumbers,
    callState,
    incomingCall,
    activeCallMeta,
    networkMode,
    isPTTTalking,
    isRemotePTTTalking,
    chatMessages,
    isLiveDraftEnabled,
    setIsLiveDraftEnabled,
    isRemoteTyping,
    remoteLiveDraft,
    telemetry,
    setTelemetry,
    isDemoLoopbackMode,
    setIsDemoLoopbackMode,

    peerConnectionRef,
    localStreamRef,
    remoteAudioRef,

    registerNumber,
    startCall,
    simulateIncomingCall,
    answerIncomingCall,
    endActiveCall,
    setFallbackMode,
    setPTTActive,
    handleTypingInput,
    sendTextFallback,
  };

  return (
    <WebRTCContext.Provider value={value}>
      {children}
    </WebRTCContext.Provider>
  );
}
