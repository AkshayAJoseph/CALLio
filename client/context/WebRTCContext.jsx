"use client";

import { createContext, useState, useRef, useEffect } from "react";
import { io } from "socket.io-client";
import { getIceServers } from "../utils/iceConfig";
import { createSilentAudioStream } from "../utils/audioFallback";

export const WebRTCContext = createContext(null);

const SOCKET_URL = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000";

export function WebRTCProvider({ children }) {

  // --- STATE VARIABLES (LOCKED CONTRACT) ---
  const [myNumber, setMyNumber] = useState("+61480000111");
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
      transports: ["websocket"], // Force pure WebSocket
        extraHeaders: {
          "Bypass-Tunnel-Reminder": "true"
        },
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
      if (pc && pc.remoteDescription && pc.remoteDescription.type) {
        try { await pc.addIceCandidate(new RTCIceCandidate(data.candidate)); } catch (e) {}
      } else {
        iceCandidateQueueRef.current.push(data.candidate);
      }
    });

    socket.on("call-ended", () => {
      setCallState("IDLE");
      setIncomingCall(null);
      setActiveCallMeta(null);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
        localStreamRef.current = null;
      }
    });

    socket.on("call-error", (data) => {
      console.error("[WebRTC] Call failed:", data.message);
      alert("Call failed: " + data.message);
      setCallState("IDLE");
      setActiveCallMeta(null);
      if (peerConnectionRef.current) {
        peerConnectionRef.current.close();
        peerConnectionRef.current = null;
      }
    });

    const handleFocus = () => {
      if (socket.connected) {
        socket.emit("register", myNumber);
      }
    };
    window.addEventListener("focus", handleFocus);

    return () => {
      window.removeEventListener("focus", handleFocus);
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

      // --- DATA CHANNEL SETUP ("callio-channel") ---
      // If we are the caller, we create the channel
      if (callState === "CALLING" || callState === "IDLE") { // Caller initiates
        const dc = pc.createDataChannel("callio-channel", { ordered: true });
        setupDataChannel(dc);
      }
      
      // If we are the receiver, we wait for the channel
      pc.ondatachannel = (event) => {
        setupDataChannel(event.channel);
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

  const typingTimeoutRef = useRef(null);

  const setupDataChannel = (dc) => {
    dataChannelRef.current = dc;
    dc.onmessage = (event) => {
      try {
        const msg = JSON.parse(event.data);
        if (msg.type === "MODE_SWITCH") {
          setNetworkMode(msg.mode);
          if (localStreamRef.current) {
            const audioTrack = localStreamRef.current.getAudioTracks()[0];
            if (audioTrack) audioTrack.enabled = (msg.mode === "FULL_AUDIO");
          }
          setIsPTTTalking(false);
          setIsRemotePTTTalking(false);
        } else if (msg.type === "PTT_STATUS") {
          setIsRemotePTTTalking(msg.talking);
        } else if (msg.type === "TYPING_EVENT") {
          setIsRemoteTyping(msg.isTyping);
          setRemoteLiveDraft(msg.liveDraft);
          
          if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
          typingTimeoutRef.current = setTimeout(() => {
            setIsRemoteTyping(false);
            setRemoteLiveDraft("");
          }, 1500);
        } else if (msg.type === "CHAT") {
          setIsRemoteTyping(false);
          setRemoteLiveDraft("");
          setChatMessages(prev => [...prev, { sender: msg.sender, text: msg.text, time: msg.time }]);
        }
      } catch (e) {
        console.error("DataChannel parse error:", e);
      }
    };
  };

  // --- ACTION FUNCTIONS (STUBS REPLACED) ---
  const registerNumber = useCallback((phoneNumberString) => {
    const normalized = phoneNumberString.replace(/[\s\-\(\)]/g, "");
    setMyNumber(normalized);
    if (socketRef.current?.connected) {
      socketRef.current.emit("register", normalized);
    }
  };

  const startCall = async (targetNumberString, intentObject) => {
    setCallState("CALLING");
    const normalizedTarget = targetNumberString.replace(/[\s\-\(\)]/g, "");
    // If user forgot +61 for Australia, prefix it automatically
    const finalTarget = (normalizedTarget.startsWith("4") && normalizedTarget.length === 9) ? "+61" + normalizedTarget : (normalizedTarget.startsWith("+") ? normalizedTarget : "+" + normalizedTarget);
    
    setActiveCallMeta({ remoteNumber: finalTarget, ...intentObject });

    if (isDemoLoopbackMode) {
      console.log("[Demo Mode] Simulating call connection in 1.2s...");
      setTimeout(() => {
        setCallState("CONNECTED");
        setNetworkMode("TEXT"); // Demo forces text mode to show off fallback
        setChatMessages([{
          sender: finalTarget,
          text: "Auto-reply: Connection degraded. Switched to TEXT mode.",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
        }]);
      }, 1200);
      return;
    }

    const pc = await createPeerConnection(finalTarget);
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    socketRef.current.emit("call-user", {
      to: finalTarget,
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
    setNetworkMode(mode);
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = (mode === "FULL_AUDIO");
      }
    }
    setIsPTTTalking(false);
    setIsRemotePTTTalking(false);

    if (dataChannelRef.current?.readyState === "open") {
      dataChannelRef.current.send(JSON.stringify({ type: "MODE_SWITCH", mode }));
    }
  };

  const setPTTActive = (isHolding) => {
    setIsPTTTalking(isHolding);
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isHolding;
      }
    }
    if (dataChannelRef.current?.readyState === "open") {
      dataChannelRef.current.send(JSON.stringify({ type: "PTT_STATUS", talking: isHolding }));
    }
  };

  const handleTypingInput = (draftString) => {
    const isCurrentlyTyping = draftString.trim().length > 0;
    if (dataChannelRef.current?.readyState === "open") {
      dataChannelRef.current.send(JSON.stringify({
        type: "TYPING_EVENT",
        isTyping: isCurrentlyTyping,
        liveDraft: isLiveDraftEnabled && isCurrentlyTyping ? draftString : ""
      }));
    }
  };

  const sendTextFallback = (text) => {
    const msgObj = {
      sender: myNumber,
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    };
    setChatMessages(prev => [...prev, msgObj]);
    
    if (dataChannelRef.current?.readyState === "open") {
      dataChannelRef.current.send(JSON.stringify({ type: "CHAT", ...msgObj }));
      dataChannelRef.current.send(JSON.stringify({ type: "TYPING_EVENT", isTyping: false, liveDraft: "" }));
    }
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
