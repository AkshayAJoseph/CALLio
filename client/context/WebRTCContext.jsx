"use client";

import { createContext, useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { getIceServers } from "../utils/iceConfig";
import { createSilentAudioStream } from "../utils/audioFallback";

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

    socket.on("incoming-call", (data) => {
      // data: { from, to, intentObject, offer }
      setIncomingCall(data);
      setCallState("RINGING");
      setActiveCallMeta({ remoteNumber: data.from, ...data.intentObject });
    });

    socket.on("call-accepted", async (data) => {
      // data: { from, answer }
      const pc = peerConnectionRef.current;
      if (pc) {
        await pc.setRemoteDescription(new RTCSessionDescription(data.answer));
        setCallState("CONNECTED");
        // Flush ICE queue
        iceCandidateQueueRef.current.forEach(async (c) => {
          try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
        });
        iceCandidateQueueRef.current = [];
      }
    });

    socket.on("ice-candidate", async (data) => {
      // data: { from, candidate }
      const pc = peerConnectionRef.current;
      if (pc) {
        if (pc.remoteDescription && pc.remoteDescription.type) {
          try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch (e) {}
        } else {
          iceCandidateQueueRef.current.push(data.candidate);
        }
      }
    });

    socket.on("call-ended", () => {
      // We will fully implement endActiveCall next, but for now reset state
      setCallState("IDLE");
      setIncomingCall(null);
      setActiveCallMeta(null);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    });

    return () => {
      socket.disconnect();
    };
  }, [myNumber]);

  // --- WEBRTC CORE LIFECYCLE ---
  const createPeerConnection = async (targetNumber) => {
    try {
      const pc = new RTCPeerConnection({
        iceServers: getIceServers(),
      });
      peerConnectionRef.current = pc;

      // ICE Candidate Gathering
      pc.onicecandidate = (event) => {
        if (event.candidate && socketRef.current) {
          socketRef.current.emit("ice-candidate", {
            to: targetNumber,
            from: myNumber,
            candidate: event.candidate,
          });
        }
      };

      // Handle incoming audio tracks
      pc.ontrack = (event) => {
        console.log("[WebRTC] Received remote track");
        if (remoteAudioRef.current && event.streams[0]) {
          remoteAudioRef.current.srcObject = event.streams[0];
          remoteAudioRef.current.play().catch((e) => console.error("Audio play error:", e));
        }
      };

      // Get Local Audio
      let stream;
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true },
          video: false,
        });
        console.log("[WebRTC] Acquired real microphone stream");
      } catch (err) {
        console.warn("[WebRTC] Microphone access denied or unavailable, using silent fallback", err);
        stream = createSilentAudioStream();
      }

      localStreamRef.current = stream;
      stream.getTracks().forEach((track) => {
        pc.addTrack(track, stream);
      });

      return pc;
    } catch (err) {
      console.error("[WebRTC] Error creating peer connection:", err);
      throw err;
    }
  };

  // --- ACTION FUNCTIONS (STUBS FOR NOW) ---
  const registerNumber = (phoneNumberString) => {
    setMyNumber(phoneNumberString);
    if (socketRef.current?.connected) {
      socketRef.current.emit("register", phoneNumberString);
    }
  };

  const startCall = async (targetNumberString, intentObject) => {
    setCallState("CALLING");
    setActiveCallMeta({ remoteNumber: targetNumberString, ...intentObject });

    const pc = await createPeerConnection(targetNumberString);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current.emit("call-user", {
      to: targetNumberString,
      from: myNumber,
      intentObject,
      offer,
    });
  };

  const simulateIncomingCall = (mockPayloadOptional) => {
    const payload = mockPayloadOptional || {
      from: "+61 480 000 222",
      to: myNumber,
      intentTag: "Urgent - Please Pick Up",
      priority: "HIGH",
      note: "Simulated Test Call",
      callerTime: "10:00",
      callerTz: "Australia/Sydney"
    };
    setIncomingCall(payload);
    setCallState("RINGING");
    setActiveCallMeta({ remoteNumber: payload.from, ...payload });
  };

  const answerIncomingCall = async () => {
    if (!incomingCall) return;
    
    const pc = await createPeerConnection(incomingCall.from);
    await pc.setRemoteDescription(new RTCSessionDescription(incomingCall.offer));
    
    const answer = await pc.createAnswer();
    await pc.setLocalDescription(answer);

    socketRef.current.emit("answer-call", {
      to: incomingCall.from,
      from: myNumber,
      answer,
    });

    setCallState("CONNECTED");
    
    // Flush ICE queue now that remoteDescription is set
    iceCandidateQueueRef.current.forEach(async (c) => {
      try { await pc.addIceCandidate(new RTCIceCandidate(c)); } catch (e) {}
    });
    iceCandidateQueueRef.current = [];
    
    // Clear incoming call so modal unmounts, but keep activeCallMeta!
    setIncomingCall(null);
  };

  const endActiveCall = () => {
    if (activeCallMeta && socketRef.current) {
      socketRef.current.emit("end-call", {
        to: activeCallMeta.remoteNumber,
        from: myNumber,
      });
    }
    
    setCallState("IDLE");
    setIncomingCall(null);
    setActiveCallMeta(null);
    setNetworkMode("FULL_AUDIO");
    setChatMessages([]);
    setRemoteLiveDraft("");
    setIsRemoteTyping(false);
    
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
      peerConnectionRef.current = null;
    }
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
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
