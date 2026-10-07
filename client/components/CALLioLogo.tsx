"use client";

import React from "react";

interface CALLioLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  theme?: "light" | "dark";
}

/**
 * CALLioLogo — Callio-style bird + branch + wordmark logo.
 * Inspired by the official Callio brand (blue bird on a branch, communication wave).
 */
export function CALLioLogo({
  size = "md",
  showTagline = false,
  theme = "dark",
}: CALLioLogoProps) {
  const iconSize = size === "sm" ? 30 : size === "lg" ? 48 : 38;
  const isDark = theme === "dark";
  const textSize =
    size === "sm" ? "text-base" : size === "lg" ? "text-2xl" : "text-xl";

  return (
    <div className="flex items-center gap-2.5 select-none">
      {/* Bird + branch icon */}
      <div
        className="shrink-0 relative"
        style={{ width: iconSize, height: iconSize }}
      >
        <svg
          viewBox="0 0 48 48"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          style={{ width: iconSize, height: iconSize }}
        >
          {/* Branch */}
          <path
            d="M6 38 C14 34 22 30 36 32"
            stroke="#7FB3E6"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          {/* Leaf 1 */}
          <path
            d="M22 30 Q20 24 26 22 Q24 28 22 30Z"
            fill="#A7C957"
          />
          {/* Leaf 2 */}
          <path
            d="M30 28 Q30 22 36 20 Q32 26 30 28Z"
            fill="#A7C957"
          />
          {/* Bird body */}
          <ellipse cx="28" cy="20" rx="7" ry="5" fill="#2B6CB0" />
          {/* Bird head */}
          <circle cx="35" cy="17" r="4" fill="#2B6CB0" />
          {/* Bird beak */}
          <path
            d="M38.5 16.5 L43 15.5 L38.5 18Z"
            fill="#F4A261"
          />
          {/* Bird eye */}
          <circle cx="36.5" cy="16" r="1.2" fill="white" />
          <circle cx="36.8" cy="16" r="0.6" fill="#173B63" />
          {/* Wing */}
          <path
            d="M22 20 Q25 14 31 16 Q27 20 22 20Z"
            fill="#173B63"
          />
          {/* Tail */}
          <path
            d="M21 21 L15 19 L21 24Z"
            fill="#173B63"
          />
          {/* Communication wave arc 1 */}
          <path
            d="M41 10 Q47 17 41 24"
            stroke="#7FB3E6"
            strokeWidth="2"
            strokeLinecap="round"
            fill="none"
          />
          {/* Communication wave arc 2 */}
          <path
            d="M44 7 Q53 17 44 27"
            stroke="#7FB3E6"
            strokeWidth="1.5"
            strokeLinecap="round"
            fill="none"
            opacity="0.5"
          />
        </svg>
      </div>

      {/* Wordmark */}
      <div>
        <div className="flex items-baseline gap-1.5">
          <span
            className={`font-black tracking-tight leading-none ${textSize} ${
              isDark ? "text-white" : "text-[#173B63]"
            }`}
          >
            Callio
          </span>
          <span
            className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-widest border ${
              isDark
                ? "bg-white/10 text-sky-200 border-sky-300/30"
                : "bg-[#2B6CB0]/10 text-[#2B6CB0] border-[#2B6CB0]/25"
            }`}
          >
            Telecom
          </span>
        </div>
        {showTagline && (
          <p
            className={`text-[10px] mt-0.5 font-medium tracking-wide ${
              isDark ? "text-sky-200/70" : "text-slate-500"
            }`}
          >
            Adaptive Communication &amp; Emergency Network
          </p>
        )}
      </div>
    </div>
  );
}
