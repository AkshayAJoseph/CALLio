"use client";

import React from "react";

interface CooeeLogoProps {
  size?: "sm" | "md" | "lg";
  showTagline?: boolean;
  theme?: "light" | "dark";
}

export function CooeeLogo({
  size = "md",
  showTagline = false,
}: CooeeLogoProps) {
  const dimensions =
    size === "sm"
      ? "h-9 w-auto"
      : size === "lg"
        ? "h-16 w-auto"
        : "h-12 w-auto";

  return (
    <div className="flex items-center select-none">
      <img
        src="/callio-logo.jpg"
        alt="Cooee"
        className={`${dimensions} object-contain`}
      />

      {showTagline && (
        <span className="sr-only">
          Adaptive Communication &amp; Emergency Network
        </span>
      )}
    </div>
  );
}