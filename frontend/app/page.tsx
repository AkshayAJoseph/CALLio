"use client";

import { useState } from "react";
import Link from "next/link";
import { CooeeLogo } from "@/components/CooeeLogo";

export default function Home() {
  const [number, setNumber] = useState("");

  const dialPad = [
    ["1", ""],
    ["2", "ABC"],
    ["3", "DEF"],
    ["4", "GHI"],
    ["5", "JKL"],
    ["6", "MNO"],
    ["7", "PQRS"],
    ["8", "TUV"],
    ["9", "WXYZ"],
    ["*", ""],
    ["0", "+"],
    ["#", ""],
  ];

  const addDigit = (digit: string) => {
    setNumber((prev) => prev + digit);
  };

  const deleteDigit = () => {
    setNumber((prev) => prev.slice(0, -1));
  };

  return (
    <main className="min-h-screen bg-[#F8F9FB] text-slate-900 font-sans antialiased">
      {/* Header with CooeeLogo */}
      <header className="flex items-center justify-between bg-[#173B63] px-6 py-4 shadow-sm text-white">
        <Link href="/">
          <CooeeLogo size="md" showTagline={true} theme="dark" />
        </Link>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 rounded-full bg-[#0F2742] px-3 py-1 border border-white/10">
            <span className="h-2.5 w-2.5 rounded-full bg-[#A7C957]"></span>
            <span className="text-xs font-semibold text-slate-200">Online</span>
          </div>

          <Link
            href="/dialer"
            className="rounded-xl bg-[#2B6CB0] hover:bg-[#235891] px-3.5 py-1.5 text-xs font-bold text-white transition shadow-sm"
          >
            Launch WebDialer ➔
          </Link>
        </div>
      </header>

      {/* Main content */}
      <div className="mx-auto grid max-w-6xl gap-8 px-6 py-8 lg:grid-cols-3">
        {/* Left - Dialer */}
        <section className="rounded-3xl bg-white border border-[#E2E8F0] p-6 shadow-sm lg:col-span-2">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Your Cooee Number
              </p>
              <p className="mt-1 text-lg font-bold font-mono text-[#173B63]">
                +91 98765 43210
              </p>
            </div>
            <span className="text-xs font-bold text-[#2B6CB0] bg-[#EBF4FC] px-2.5 py-1 rounded-full border border-[#2B6CB0]/20">
              Prototype Mode
            </span>
          </div>

          {/* Number display */}
          <div className="mb-6 rounded-2xl bg-[#F8F9FB] border border-[#E2E8F0] px-5 py-4 text-center">
            <p className="min-h-9 text-3xl font-bold font-mono tracking-wider text-[#173B63]">
              {number || "Enter number"}
            </p>
          </div>

          {/* Dial pad */}
          <div className="mx-auto grid max-w-md grid-cols-3 gap-3.5">
            {dialPad.map(([digit, letters]) => (
              <button
                key={digit}
                onClick={() => addDigit(digit)}
                className="flex h-20 flex-col items-center justify-center rounded-2xl bg-[#F8F9FB] hover:bg-[#EBF4FC] hover:border-[#7FB3E6] border border-[#E2E8F0] transition active:scale-95 shadow-2xs"
              >
                <span className="text-2xl font-bold font-mono text-[#173B63]">
                  {digit}
                </span>
                <span className="text-xs font-bold text-slate-500">{letters}</span>
              </button>
            ))}
          </div>

          {/* Call controls */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <button
              onClick={deleteDigit}
              className="rounded-2xl bg-[#F1F4F9] hover:bg-[#E2E8F0] px-6 py-3.5 text-xs font-bold text-slate-700 transition"
            >
              Delete
            </button>

            <button
              onClick={() => {}}
              className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[#2B6CB0] hover:bg-[#235891] text-white text-2xl shadow-md transition active:scale-95"
            >
              ☎
            </button>

            <button
              onClick={() => setNumber("")}
              className="rounded-2xl bg-[#F1F4F9] hover:bg-[#E2E8F0] px-6 py-3.5 text-xs font-bold text-slate-700 transition"
            >
              Clear
            </button>
          </div>
        </section>

        {/* Right - Quick contacts */}
        <aside className="rounded-3xl bg-white border border-[#E2E8F0] p-6 shadow-sm">
          <h2 className="text-xl font-bold text-[#173B63]">Quick Contacts</h2>
          <p className="mt-1 text-xs text-slate-500">
            Call your trusted contacts quickly.
          </p>

          <div className="mt-6 space-y-3">
            <button className="w-full rounded-2xl bg-[#F8F9FB] hover:bg-[#EBF4FC] border border-[#E2E8F0] p-4 text-left transition shadow-2xs">
              <p className="font-bold text-sm text-[#173B63]">Amma</p>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                +91 98XXX XXXXX
              </p>
            </button>

            <button className="w-full rounded-2xl bg-[#F8F9FB] hover:bg-[#EBF4FC] border border-[#E2E8F0] p-4 text-left transition shadow-2xs">
              <p className="font-bold text-sm text-[#173B63]">Akhil</p>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                +91 97XXX XXXXX
              </p>
            </button>

            <button className="w-full rounded-2xl bg-[#F8F9FB] hover:bg-[#EBF4FC] border border-[#E2E8F0] p-4 text-left transition shadow-2xs">
              <p className="font-bold text-sm text-[#173B63]">Home</p>
              <p className="text-xs font-mono text-slate-500 mt-0.5">
                +91 70XXX XXXXX
              </p>
            </button>
          </div>

          {/* Accessibility portal */}
          <div className="mt-8 rounded-2xl border border-[#7FB3E6]/40 bg-gradient-to-br from-[#EBF4FC] to-[#F1F7FD] p-4">
            <p className="font-bold text-[#173B63]">Accessibility Portal</p>
            <p className="mt-1 text-xs text-slate-600">
              Simple calling interface for elderly and dependent users with auto-answer.
            </p>

            <Link
              href="/dependent"
              className="mt-4 block w-full text-center rounded-xl bg-[#2B6CB0] hover:bg-[#235891] px-4 py-3 font-bold text-white shadow-sm transition"
            >
              Open Portal
            </Link>

            <Link
              href="/dialer"
              className="mt-2.5 block w-full text-center rounded-xl bg-white hover:bg-[#F8F9FB] px-4 py-2.5 text-xs font-bold text-[#173B63] transition border border-[#DDE4EE]"
            >
              Open Full WebDialer ➔
            </Link>
          </div>
        </aside>
      </div>
    </main>
  );
}