"use client";

import { useState } from "react";
import { useWebRTC } from "../../hooks/useWebRTC";
import TelemetryHUD from "./TelemetryHUD";
import NetworkSimulator from "./NetworkSimulator";

export default function ActiveCallView() {
  const { 
    callState, 
    activeCallMeta, 
    endActiveCall,
    networkMode,
    isPTTTalking,
    isRemotePTTTalking,
    setPTTActive,
    chatMessages,
    isLiveDraftEnabled,
    setIsLiveDraftEnabled,
    isRemoteTyping,
    remoteLiveDraft,
    handleTypingInput,
    sendTextFallback
  } = useWebRTC();

  const [draft, setDraft] = useState("");

  if (callState !== "CONNECTED" || !activeCallMeta) return null;

  const handleSend = () => {
    if (draft.trim()) {
      sendTextFallback(draft);
      setDraft("");
    }
  };

  return (
    <div className="relative border rounded p-6 bg-slate-50 shadow-md max-w-lg mx-auto mt-8 flex flex-col h-[500px]">
      <TelemetryHUD />
      
      {/* Call Header */}
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-green-600 animate-pulse">Call Connected</h2>
        <p className="text-lg font-mono mt-2">{activeCallMeta.remoteNumber}</p>
        
        {/* Intent Badge */}
        {activeCallMeta.intentTag && (
          <div className="mt-2 inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-semibold">
            {activeCallMeta.intentTag} ({activeCallMeta.priority})
          </div>
        )}
      </div>

      {/* Dynamic Controls based on Network Mode */}
      <div className="flex-1 overflow-hidden flex flex-col">
        {networkMode === "FULL_AUDIO" && (
          <div className="flex-1 flex items-center justify-center">
            <div className="w-24 h-24 rounded-full bg-blue-500 animate-bounce flex items-center justify-center shadow-lg">
              <span className="text-white font-bold text-xs">Full Duplex</span>
            </div>
          </div>
        )}

        {networkMode === "PTT" && (
          <div className="flex-1 flex flex-col items-center justify-center gap-6">
            {isRemotePTTTalking ? (
              <p className="text-orange-500 font-bold animate-pulse">Partner is talking...</p>
            ) : (
              <p className="text-gray-400">Channel open</p>
            )}
            
            <button
              onMouseDown={() => setPTTActive(true)}
              onMouseUp={() => setPTTActive(false)}
              onMouseLeave={() => setPTTActive(false)}
              onTouchStart={() => setPTTActive(true)}
              onTouchEnd={() => setPTTActive(false)}
              className={`w-32 h-32 rounded-full font-bold text-white shadow-lg transition-all ${
                isPTTTalking ? "bg-red-500 scale-95" : "bg-blue-600 hover:bg-blue-700 scale-100"
              }`}
            >
              {isPTTTalking ? "TALKING" : "HOLD TO TALK"}
            </button>
          </div>
        )}

        {networkMode === "TEXT" && (
          <div className="flex-1 flex flex-col bg-white border rounded">
            {/* Chat History */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-2">
              {chatMessages.map((msg, idx) => (
                <div key={idx} className="bg-gray-100 p-2 rounded text-sm w-fit max-w-[80%]">
                  <span className="font-bold text-xs text-blue-600 block">{msg.sender}</span>
                  <span>{msg.text}</span>
                  <span className="text-[10px] text-gray-400 ml-2">{msg.time}</span>
                </div>
              ))}
            </div>
            
            {/* Live Draft Indicator */}
            <div className="h-6 px-4">
              {isRemoteTyping && (
                <p className="text-xs text-gray-500 italic">
                  Partner is typing... <span className="font-mono text-blue-600">{remoteLiveDraft}</span>
                </p>
              )}
            </div>

            {/* Input Area */}
            <div className="p-2 border-t bg-gray-50 flex flex-col gap-2">
              <label className="text-xs flex items-center gap-2 cursor-pointer">
                <input 
                  type="checkbox" 
                  checked={isLiveDraftEnabled}
                  onChange={(e) => setIsLiveDraftEnabled(e.target.checked)}
                />
                Enable Live Draft Streaming
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={draft}
                  onChange={(e) => {
                    setDraft(e.target.value);
                    handleTypingInput(e.target.value);
                  }}
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                  placeholder="Network critical. Fallback to text..."
                  className="flex-1 border p-2 text-sm rounded"
                />
                <button onClick={handleSend} className="bg-blue-600 text-white px-4 rounded text-sm font-bold">
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      <NetworkSimulator />

      <button 
        onClick={endActiveCall}
        className="mt-4 w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 rounded shadow"
      >
        End Call
      </button>
    </div>
  );
}
