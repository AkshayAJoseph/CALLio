"use client";

import { useState } from "react";
import { useWebRTC } from "../../hooks/useWebRTC";
import IntentPicker from "../../components/intent/IntentPicker";
import IncomingCallModal from "../../components/intent/IncomingCallModal";
import ActiveCallView from "../../components/call/ActiveCallView";

export default function DialerPage() {
  const { 
    myNumber, 
    registerNumber, 
    isRegistered, 
    onlineNumbers,
    callState, 
    startCall 
  } = useWebRTC();
  
  const [targetNumber, setTargetNumber] = useState("");
  const [intentObject, setIntentObject] = useState(null);

  const virtualSims = [
    "+61 480 000 111",
    "+61 480 000 222",
    "+44 770 000 333"
  ];

  const handleDial = () => {
    if (!targetNumber) return alert("Enter a number to dial");
    if (!intentObject) return alert("Please set a Call Intent first");
    startCall(targetNumber, intentObject);
  };

  // If in a call, show the active call view instead of the dialer
  if (callState === "CONNECTED" || callState === "CALLING") {
    return (
      <main className="p-4 md:p-8 min-h-screen bg-slate-100">
        <ActiveCallView />
      </main>
    );
  }

  return (
    <main className="p-4 md:p-8 min-h-screen bg-slate-100 flex flex-col items-center">
      <IncomingCallModal />

      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-6">
        <h1 className="text-2xl font-bold text-center mb-6">Cooee WebDialer</h1>
        
        {/* Virtual SIM Switcher */}
        <div className="mb-6 p-4 bg-gray-50 rounded-lg border">
          <p className="text-sm text-gray-500 mb-2 font-semibold">Active Virtual SIM</p>
          <div className="flex flex-col gap-2">
            {virtualSims.map((sim) => (
              <label key={sim} className="flex items-center gap-2 cursor-pointer">
                <input 
                  type="radio" 
                  name="virtualSim" 
                  checked={myNumber === sim}
                  onChange={() => registerNumber(sim)}
                />
                <span className={`font-mono ${myNumber === sim ? 'font-bold text-blue-600' : ''}`}>
                  {sim}
                </span>
              </label>
            ))}
          </div>
          <div className="mt-2 text-xs">
            Status: {isRegistered ? <span className="text-green-600">Registered on Network</span> : <span className="text-red-500">Disconnected</span>}
          </div>
        </div>

        {/* Dialing Area */}
        <div className="mb-6">
          <input 
            type="text"
            value={targetNumber}
            onChange={(e) => setTargetNumber(e.target.value)}
            placeholder="Enter number to dial..."
            className="w-full text-center text-2xl p-4 border-b-2 font-mono focus:outline-none focus:border-blue-500 mb-4 bg-transparent"
          />
          <IntentPicker onIntentSelect={setIntentObject} />
          
          {intentObject && (
             <div className="mt-2 p-2 bg-green-50 text-green-800 text-xs rounded border border-green-200">
               Intent Ready: {intentObject.intentTag} ({intentObject.priority})
             </div>
          )}
        </div>

        <button 
          onClick={handleDial}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-full shadow-lg transition-transform active:scale-95"
        >
          Dial
        </button>
      </div>

      {/* Debug: Online Users */}
      <div className="mt-8 text-xs text-gray-500">
        <p className="font-bold">Online Network Nodes:</p>
        <ul className="list-disc ml-4">
          {onlineNumbers.map(n => <li key={n}>{n} {n === myNumber ? "(You)" : ""}</li>)}
        </ul>
      </div>
    </main>
  );
}
