"use client";

import React from "react";
import type { Contact } from "../lib/contacts";

interface ContactAvatarProps {
  contact: Pick<Contact, "name" | "initials" | "avatarBg" | "avatarText" | "photoUrl">;
  size?: "xs" | "sm" | "md" | "lg" | "xl";
  className?: string;
}

const SIZE_MAP = {
  xs: "h-7 w-7 text-[10px]",
  sm: "h-9 w-9 text-xs",
  md: "h-12 w-12 text-sm",
  lg: "h-16 w-16 text-lg",
  xl: "h-24 w-24 text-2xl",
};

export function ContactAvatar({ contact, size = "md", className = "" }: ContactAvatarProps) {
  const sizeClass = SIZE_MAP[size];

  if (contact.photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={contact.photoUrl}
        alt={contact.name}
        className={`${sizeClass} rounded-full object-cover border-2 border-white shadow-sm flex-shrink-0 ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizeClass} rounded-full flex items-center justify-center font-bold border-2 border-white shadow-sm flex-shrink-0 ${contact.avatarBg} ${contact.avatarText} ${className}`}
    >
      {contact.initials}
    </div>
  );
}
