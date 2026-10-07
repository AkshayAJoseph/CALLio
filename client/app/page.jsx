"use client";

import Link from "next/link";
import { useWebRTC } from "../hooks/useWebRTC";
import { useState, useEffect } from "react";

export default function EngineeringControlCenter() {
  const { isRegistered, myNumber, onlineNumbers, isDemoLoopbackMode, setIsDemoLoopbackMode } = useWebRTC();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <main className="p-8 min-h-screen bg-slate-900 text-slate-100 font-mono">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8 border-b border-slate-700 pb-4">
          <h1 className="text-3xl font-bold text-green-400">Cooee Echo: Engineering Control Center</h1>
          <div className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${isRegistered ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
            <span className="text-sm">{isRegistered ? 'Connected to Signaling Server' : 'Disconnected'}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-blue-400">Local Identity</h2>
            <p className="text-lg">Number: <span className="font-bold text-white">{myNumber}</span></p>
            <div className="mt-4 p-3 bg-slate-900 rounded text-xs text-slate-400">
              <p>To test end-to-end WebRTC:</p>
              <ol className="list-decimal ml-4 mt-2">
                <li>Open a second tab/window</li>
                <li>Go to the Dialer</li>
                <li>Switch to a different Virtual SIM</li>
                <li>Call {myNumber}</li>
              </ol>
            </div>
          </div>

          <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl">
            <h2 className="text-xl font-bold mb-4 text-purple-400">Network Presence</h2>
            <p className="text-sm text-slate-400 mb-2">Registered Nodes ({onlineNumbers.length}):</p>
            <ul className="flex flex-col gap-2">
              {onlineNumbers.map(num => (
                <li key={num} className="bg-slate-900 px-3 py-2 rounded text-sm flex justify-between">
                  <span>{num}</span>
                  {num === myNumber && <span className="text-green-500 text-xs">THIS NODE</span>}
                </li>
              ))}
              {onlineNumbers.length === 0 && <li className="text-slate-500 italic">Waiting for nodes...</li>}
            </ul>
          </div>
        </div>

        <div className="bg-slate-800 p-6 rounded-lg border border-slate-700 shadow-xl mb-8">
          <h2 className="text-xl font-bold mb-4 text-orange-400">Demo Loopback Mode</h2>
          <label className="flex items-center gap-3 cursor-pointer">
            <input 
              type="checkbox" 
              checked={isDemoLoopbackMode}
              onChange={(e) => setIsDemoLoopbackMode(e.target.checked)}
              className="w-5 h-5 accent-orange-500"
            />
            <span>Enable Stage-Safe Demo Simulation (Auto-answers & degrades to text)</span>
          </label>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Link href="/dialer" className="group">
            <div className="bg-blue-900 hover:bg-blue-800 p-6 rounded-lg border border-blue-700 transition transform hover:-translate-y-1">
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-blue-200">📞 Open Dialer</h2>
              <p className="text-blue-300 text-sm">Anjali's WebDialer UI with Virtual SIM Switcher and Amrutha's Intent Picker.</p>
            </div>
          </Link>

          <Link href="/dependent" className="group">
            <div className="bg-emerald-900 hover:bg-emerald-800 p-6 rounded-lg border border-emerald-700 transition transform hover:-translate-y-1">
              <h2 className="text-2xl font-bold text-white mb-2 group-hover:text-emerald-200">🛡️ Open Dependent Portal</h2>
              <p className="text-emerald-300 text-sm">Elderly accessibility interface with Trusted Guardian 3s Auto-Answer.</p>
            </div>
          </Link>
        </div>
      </div>
    </main>
  );
}
