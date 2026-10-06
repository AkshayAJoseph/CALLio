"use client";

import Link from "next/link";
import { NavBar } from "@/components/NavBar";

const recentCalls = [
  {
    name: "Mum",
    relationship: "Guardian",
    number: "+61 480 000 111",
    time: "Today, 8:42 PM",
    status: "Incoming",
    duration: "04:32",
    initials: "M",
    avatarClass: "bg-[#E8F2D2] text-[#5D7A22]",
  },
  {
    name: "Dr. Sarah Adams",
    relationship: "Doctor",
    number: "+61 480 000 999",
    time: "Today, 4:15 PM",
    status: "Outgoing",
    duration: "12:08",
    initials: "SA",
    avatarClass: "bg-[#E3EEF9] text-[#2B6CB0]",
  },
  {
    name: "Akhil",
    relationship: "Brother",
    number: "+44 770 000 222",
    time: "Yesterday, 9:10 PM",
    status: "Missed",
    duration: "—",
    initials: "A",
    avatarClass: "bg-[#FCE9D9] text-[#C56A20]",
  },
];

const communicationModes = [
  {
    title: "Full Audio",
    description: "Clear voice communication",
    icon: "●",
    accent: "bg-[#E8F2D2] text-[#5D7A22]",
  },
  {
    title: "Push-to-Talk",
    description: "Low-bandwidth voice",
    icon: "◉",
    accent: "bg-[#E3EEF9] text-[#2B6CB0]",
  },
  {
    title: "Text Fallback",
    description: "Works when audio is weak",
    icon: "▤",
    accent: "bg-[#FCE9D9] text-[#C56A20]",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#F8F9FB] text-slate-900">
      <NavBar />

      <main className="mx-auto w-full max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Welcome */}
        <section className="mb-8">
          <p className="mb-1 text-sm font-semibold text-[#2B6CB0]">
            Welcome back 👋
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-[#173B63] sm:text-4xl">
            Stay connected with the people who matter.
          </h1>

          <p className="mt-2 max-w-2xl text-sm text-slate-500 sm:text-base">
            Cooee adapts the way you communicate to your situation, your
            connection, and the people you care about.
          </p>
        </section>

        {/* Number / Status Card */}
        <section className="mb-8 overflow-hidden rounded-3xl bg-[#173B63] p-6 text-white shadow-sm sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-3 flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-[#A7C957]" />
                <span className="text-xs font-bold uppercase tracking-[0.18em] text-blue-100">
                  My Cooee Number
                </span>
              </div>

              <p className="font-mono text-3xl font-bold tracking-wide sm:text-4xl">
                +91 98765 43210
              </p>

              <p className="mt-2 text-sm text-blue-100">
                Your primary communication identity
              </p>
            </div>

            <div className="flex items-center gap-2 self-start rounded-full bg-white/10 px-4 py-2 sm:self-center">
              <span className="h-2 w-2 rounded-full bg-[#A7C957]" />
              <span className="text-sm font-semibold">Online</span>
            </div>
          </div>
        </section>

        {/* Quick Actions */}
        <section className="mb-8">
          <div className="mb-4">
            <h2 className="text-lg font-bold text-[#173B63]">
              Quick Actions
            </h2>
            <p className="text-sm text-slate-500">
              Get where you need to go quickly.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {/* Dialer */}
            <Link
              href="/dialer"
              className="group rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#7FB3E6] hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E3EEF9] text-xl text-[#2B6CB0]">
                ☎
              </div>

              <h3 className="font-bold text-[#173B63]">Open Dialer</h3>

              <p className="mt-1 text-sm text-slate-500">
                Make a call with adaptive communication.
              </p>

              <div className="mt-5 text-sm font-bold text-[#2B6CB0]">
                Start a call →
              </div>
            </Link>

            {/* Contacts */}
            <Link
              href="/contacts"
              className="group rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#7FB3E6] hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#FCE9D9] text-xl text-[#C56A20]">
                ●
              </div>

              <h3 className="font-bold text-[#173B63]">Contacts</h3>

              <p className="mt-1 text-sm text-slate-500">
                View family, guardians, doctors and friends.
              </p>

              <div className="mt-5 text-sm font-bold text-[#2B6CB0]">
                View contacts →
              </div>
            </Link>

            {/* Dependent Portal */}
            <Link
              href="/dependent"
              className="group rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-[#A7C957] hover:shadow-md"
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E8F2D2] text-xl text-[#5D7A22]">
                ♡
              </div>

              <h3 className="font-bold text-[#173B63]">
                Dependent Portal
              </h3>

              <p className="mt-1 text-sm text-slate-500">
                A simplified calling experience for trusted users.
              </p>

              <div className="mt-5 text-sm font-bold text-[#5D7A22]">
                Open portal →
              </div>
            </Link>
          </div>
        </section>

        {/* Main Dashboard */}
        <section className="grid gap-6 lg:grid-cols-5">
          {/* Recent Calls */}
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:col-span-3">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-[#173B63]">Recent Calls</h2>
                <p className="mt-1 text-xs text-slate-500">
                  Your latest conversations
                </p>
              </div>

              <Link
                href="/dialer"
                className="text-xs font-bold text-[#2B6CB0] hover:underline"
              >
                Open Dialer
              </Link>
            </div>

            <div className="divide-y divide-[#EEF1F5]">
              {recentCalls.map((call) => (
                <div
                  key={call.name}
                  className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                >
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-bold ${call.avatarClass}`}
                  >
                    {call.initials}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-bold text-[#173B63]">
                        {call.name}
                      </p>

                      {call.relationship === "Guardian" && (
                        <span className="rounded-full bg-[#E8F2D2] px-2 py-0.5 text-[9px] font-bold uppercase text-[#5D7A22]">
                          Guardian
                        </span>
                      )}
                    </div>

                    <p className="mt-0.5 text-xs text-slate-500">
                      {call.time}
                    </p>
                  </div>

                  <div className="hidden text-right sm:block">
                    <p
                      className={`text-xs font-semibold ${
                        call.status === "Missed"
                          ? "text-red-500"
                          : call.status === "Incoming"
                            ? "text-[#5D7A22]"
                            : "text-[#2B6CB0]"
                      }`}
                    >
                      {call.status}
                    </p>

                    <p className="mt-0.5 text-[11px] text-slate-400">
                      {call.duration}
                    </p>
                  </div>

                  <Link
                    href="/dialer"
                    className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F1F5F9] text-sm text-[#2B6CB0] transition hover:bg-[#E3EEF9]"
                    aria-label={`Call ${call.name}`}
                  >
                    ☎
                  </Link>
                </div>
              ))}
            </div>
          </div>

          {/* Communication Modes */}
          <div className="rounded-3xl border border-[#E2E8F0] bg-white p-6 shadow-sm lg:col-span-2">
            <div className="mb-5">
              <h2 className="font-bold text-[#173B63]">
                Adaptive Communication
              </h2>

              <p className="mt-1 text-xs text-slate-500">
                Cooee adjusts communication to the connection.
              </p>
            </div>

            <div className="space-y-3">
              {communicationModes.map((mode) => (
                <div
                  key={mode.title}
                  className="flex items-center gap-3 rounded-2xl border border-[#EEF1F5] bg-[#FBFCFD] p-3"
                >
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${mode.accent}`}
                  >
                    {mode.icon}
                  </div>

                  <div>
                    <p className="text-sm font-bold text-[#173B63]">
                      {mode.title}
                    </p>

                    <p className="text-xs text-slate-500">
                      {mode.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <Link
              href="/dialer"
              className="mt-5 block rounded-2xl bg-[#2B6CB0] px-4 py-3 text-center text-sm font-bold text-white transition hover:bg-[#235891]"
            >
              Explore communication options
            </Link>
          </div>
        </section>

        {/* Dependent Portal Banner */}
        <section className="mt-6 overflow-hidden rounded-3xl border border-[#CFE0F2] bg-[#EEF6FD] p-6 sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[#2B6CB0]">
                <span className="h-2 w-2 rounded-full bg-[#A7C957]" />
                Accessibility
              </div>

              <h2 className="text-lg font-bold text-[#173B63]">
                Simple communication for elderly &amp; dependent users
              </h2>

              <p className="mt-1 max-w-2xl text-sm text-slate-600">
                The Cooee Dependent Portal provides large, accessible controls
                and trusted-guardian auto-answer for easier communication.
              </p>
            </div>

            <Link
              href="/dependent"
              className="shrink-0 rounded-2xl bg-[#173B63] px-5 py-3 text-center text-sm font-bold text-white transition hover:bg-[#102C4A]"
            >
              Open Dependent Portal
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}