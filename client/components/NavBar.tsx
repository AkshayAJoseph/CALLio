"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { CALLioLogo } from "@/components/CALLioLogo";

interface NavItem {
  label: string;
  href: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Home",
    href: "/",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10 2.5L2 9h2v8h5v-5h2v5h5V9h2L10 2.5z" />
      </svg>
    ),
  },
  {
    label: "Dialer",
    href: "/dialer",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M2 3.5A1.5 1.5 0 013.5 2h1.148a1.5 1.5 0 011.465 1.175l.716 3.582a1.5 1.5 0 01-1.052 1.74l-.537.17a.75.75 0 00-.49.72c.031 1.23.4 2.47 1.078 3.562.712 1.147 1.72 2.08 2.91 2.739a.75.75 0 00.758-.048l.47-.334a1.5 1.5 0 011.844.12l2.623 2.623A1.5 1.5 0 0116.5 19h-1C7.163 19 1 12.837 1 5V4a1.5 1.5 0 011-1.415V3.5z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: "Contacts",
    href: "/contacts",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path d="M10 9a3 3 0 100-6 3 3 0 000 6zM6 8a2 2 0 11-4 0 2 2 0 014 0zM1.49 15.326a.78.78 0 01-.358-.442 3 3 0 014.308-3.516 6.484 6.484 0 00-1.905 3.959c-.023.222-.014.442.025.654a4.97 4.97 0 01-2.07-.655zM16.44 15.98a4.97 4.97 0 002.07-.654.78.78 0 00.357-.442 3 3 0 00-4.308-3.517 6.484 6.484 0 011.907 3.96 2.32 2.32 0 01-.026.654zM18 8a2 2 0 11-4 0 2 2 0 014 0zM5.304 16.19a.844.844 0 01-.277-.71 5 5 0 019.947 0 .843.843 0 01-.277.71A6.975 6.975 0 0110 18a6.974 6.974 0 01-4.696-1.81z" />
      </svg>
    ),
  },
  {
    label: "Dependent",
    href: "/dependent",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
  {
    label: "Profile",
    href: "/profile",
    icon: (
      <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
        <path
          fillRule="evenodd"
          d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
          clipRule="evenodd"
        />
      </svg>
    ),
  },
];

export function NavBar() {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-30 flex items-center justify-between bg-[#173B63] px-5 py-3 shadow-md shadow-[#0a1f3a]/40">
      {/* Brand */}
      <Link href="/" className="shrink-0">
        <CALLioLogo size="md" theme="dark" />
      </Link>

      {/* Nav links */}
      <nav className="flex items-center gap-1">
        {NAV_ITEMS.map(({ label, href, icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-sm font-medium transition-all duration-150 ${
                active
                  ? "bg-[#2B6CB0] text-white shadow-sm"
                  : "text-sky-200 hover:bg-white/10 hover:text-white"
              }`}
            >
              {icon}
              <span className="hidden sm:inline">{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Status pill */}
      <div className="hidden md:flex items-center gap-2 rounded-full bg-[#0F2742] px-3 py-1.5 border border-white/10 shrink-0">
        <span className="h-2 w-2 rounded-full bg-[#A7C957] animate-pulse" />
        <span className="text-xs font-semibold text-slate-200">Online</span>
      </div>
    </header>
  );
}
