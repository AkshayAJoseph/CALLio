"use client";

import { useWebRTC } from "../../hooks/useWebRTC";

export default function IncomingCallModal() {
  const { callState, incomingCall, answerIncomingCall, endActiveCall } = useWebRTC();

  if (callState !== "RINGING" || !incomingCall) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full text-center">
        <h2 className="text-2xl font-bold animate-pulse text-blue-600 mb-2">Incoming Call</h2>
        <p className="text-lg font-mono">{incomingCall.from}</p>
        
        {incomingCall.intentTag && (
          <div className={`mt-4 p-3 rounded ${incomingCall.priority === 'HIGH' ? 'bg-red-100 text-red-800' : 'bg-gray-100'}`}>
            <p className="font-semibold">{incomingCall.intentTag}</p>
            {incomingCall.note && <p className="text-sm italic">"{incomingCall.note}"</p>}
            <p className="text-xs mt-2 opacity-70">
              Their time: {incomingCall.callerTime} ({incomingCall.callerTz})
            </p>
          </div>
        )}

        <div className="flex gap-4 mt-6">
          <button 
            onClick={endActiveCall} 
            className="flex-1 bg-red-500 text-white py-2 rounded font-bold"
          >
            Decline
          </button>
          <button 
            onClick={answerIncomingCall} 
            className="flex-1 bg-green-500 text-white py-2 rounded font-bold"
          >
            Accept
          </button>
        </div>
      </div>
    </div>
  );
}
