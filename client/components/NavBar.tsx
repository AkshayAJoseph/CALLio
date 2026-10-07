"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

export function NavBar() {
  const [signedIn, setSignedIn] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const updateAuthState = () => {
      setSignedIn(
        window.localStorage.getItem("callio_signed_in") === "true"
      );
    };

    updateAuthState();

    window.addEventListener("callio-auth-change", updateAuthState);

    return () => {
      window.removeEventListener(
        "callio-auth-change",
        updateAuthState
      );
    };
  }, []);

  const handleSignOut = () => {
    window.localStorage.removeItem("callio_signed_in");
    setSignedIn(false);
    setMenuOpen(false);
    window.location.href = "/dialer";
  };

  return (
    <header className="sticky top-0 z-50 bg-[#173B63] text-white shadow-md">
      <div className="mx-auto flex h-[70px] w-full max-w-7xl items-center px-4 sm:px-6 lg:px-8">
        {/* EXACT CALLiO LOGO */}
        <Link
          href="/dialer"
          className="flex shrink-0 items-center"
          aria-label="CALLiO Dialer"
        >
          <img
            src="/callio-logo.jpg"
            alt="CALLiO"
            className="h-[54px] w-auto object-contain"
          />
        </Link>

        {/* NAVIGATION */}
        <nav className="ml-6 hidden items-center gap-1 md:flex">
          <Link
            href="/dialer"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            Dialer
          </Link>

          <Link
            href="/dependent"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            Emergency Mode
          </Link>

          <Link
            href="/contacts"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            Contacts
          </Link>

          <Link
            href="/about"
            className="rounded-lg px-4 py-2 text-sm font-semibold text-white hover:bg-white/10 transition"
          >
            About
          </Link>
        </nav>

        {/* RIGHT SIDE */}
        <div className="ml-auto flex items-center gap-2">
          {!signedIn ? (
            <>
              <Link
                href="/login"
                className="rounded-lg border border-white/30 px-3 py-2 text-xs font-bold text-white hover:bg-white/10 transition"
              >
                Sign In
              </Link>

              <Link
                href="/register"
                className="rounded-lg bg-white px-3 py-2 text-xs font-bold text-[#173B63] hover:bg-[#F5F8FC] transition"
              >
                Register
              </Link>
            </>
          ) : (
            <div className="relative">
              <button
                type="button"
                onClick={() => setMenuOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-white/10 transition"
                aria-label="Open profile menu"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#A7C957] text-sm font-extrabold text-[#173B63]">
                  A
                </div>

                <div className="hidden text-left sm:block">
                  <p className="text-xs font-bold">
                    Anjali
                  </p>

                  <p className="text-[9px] text-blue-200">
                    CALLiO member
                  </p>
                </div>

                <span className="text-xs text-blue-200">
                  {menuOpen ? "⌃" : "⌄"}
                </span>
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl border border-[#E2E8F0] bg-white text-slate-800 shadow-xl">
                  <div className="border-b border-[#E8EDF3] px-4 py-3">
                    <p className="text-sm font-bold">
                      Anjali
                    </p>

                    <p className="mt-0.5 text-[10px] text-slate-500">
                      CALLiO member
                    </p>
                  </div>

                  <Link
                    href="/profile"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm hover:bg-[#F5F8FC] transition"
                  >
                    👤 My Profile
                  </Link>

                  <button
                    type="button"
                    onClick={() => setMenuOpen(false)}
                    className="w-full px-4 py-3 text-left text-sm hover:bg-[#F5F8FC] transition"
                  >
                    ⚙️ Settings
                  </button>

                  <Link
                    href="/about"
                    onClick={() => setMenuOpen(false)}
                    className="block px-4 py-3 text-sm hover:bg-[#F5F8FC] transition"
                  >
                    ℹ️ About CALLiO
                  </Link>

                  <div className="border-t border-[#E8EDF3]" />

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full px-4 py-3 text-left text-sm font-semibold text-red-600 hover:bg-red-50 transition"
                  >
                    ↪ Sign Out
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MOBILE NAVIGATION */}
      <div className="border-t border-white/10 px-4 py-2 md:hidden">
        <div className="flex items-center justify-center gap-1 overflow-x-auto">
          <Link
            href="/dialer"
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            Dialer
          </Link>

          <Link
            href="/dependent"
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            Emergency Mode
          </Link>

          <Link
            href="/contacts"
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            Contacts
          </Link>

          <Link
            href="/about"
            className="whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold hover:bg-white/10"
          >
            About
          </Link>
        </div>
      </div>
    </header>
  );
}