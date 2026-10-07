"use client";

import React, { useEffect, useRef } from "react";

// Walkie talkie control. Only shown in PTT mode, returns null in every other mode.
// Three ways to talk: mouse, touch and the Space bar. They share one set of held
// sources, so the mic opens when the first source is pressed and closes when the
// last one is released.
//
// Props:
//   networkMode, isPTTTalking, isRemotePTTTalking, setPTTActive(boolean)

function isTypingTarget(target) {
  if (!target || !target.tagName) return false;
  const tag = target.tagName.toUpperCase();
  return tag === "INPUT" || tag === "TEXTAREA" || target.isContentEditable === true;
}

export default function PTTControl({
  networkMode = "FULL_AUDIO",
  isPTTTalking = false,
  isRemotePTTTalking = false,
  setPTTActive,
}) {
  const buttonRef = useRef(null);
  const heldRef = useRef(new Set());
  const setPTTActiveRef = useRef(setPTTActive);
  setPTTActiveRef.current = setPTTActive;

  const isPTT = networkMode === "PTT";

  function press(source) {
    const held = heldRef.current;
    const wasEmpty = held.size === 0;
    held.add(source);
    if (wasEmpty) setPTTActiveRef.current?.(true);
  }

  function release(source) {
    const held = heldRef.current;
    if (!held.has(source)) return;
    held.delete(source);
    if (held.size === 0) setPTTActiveRef.current?.(false);
  }

  function releaseAll() {
    const held = heldRef.current;
    if (held.size === 0) return;
    held.clear();
    setPTTActiveRef.current?.(false);
  }

  // Keep the latest helpers in a ref so the window listeners never go stale.
  const actionsRef = useRef({ press, release, releaseAll });
  actionsRef.current = { press, release, releaseAll };

  // Spacebar and window blur. Window level so it works without focus on the button.
  useEffect(() => {
    if (!isPTT) return undefined;

    function onKeyDown(e) {
      if (e.code !== "Space") return;
      if (isTypingTarget(e.target) || isTypingTarget(document.activeElement)) return;
      e.preventDefault(); // stop the page from scrolling
      if (e.repeat) return;
      actionsRef.current.press("space");
    }

    function onKeyUp(e) {
      if (e.code !== "Space") return;
      actionsRef.current.release("space");
    }

    function onBlur() {
      actionsRef.current.releaseAll();
    }

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    window.addEventListener("blur", onBlur);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      window.removeEventListener("blur", onBlur);
    };
  }, [isPTT]);

  // Touch listeners are added natively because React touch handlers are passive,
  // and passive handlers cannot call preventDefault.
  useEffect(() => {
    const button = buttonRef.current;
    if (!isPTT || !button) return undefined;

    function onTouchStart(e) {
      e.preventDefault();
      actionsRef.current.press("touch");
    }
    function onTouchEnd(e) {
      e.preventDefault();
      actionsRef.current.release("touch");
    }
    function onTouchCancel() {
      actionsRef.current.release("touch");
    }

    button.addEventListener("touchstart", onTouchStart, { passive: false });
    button.addEventListener("touchend", onTouchEnd, { passive: false });
    button.addEventListener("touchcancel", onTouchCancel);
    return () => {
      button.removeEventListener("touchstart", onTouchStart);
      button.removeEventListener("touchend", onTouchEnd);
      button.removeEventListener("touchcancel", onTouchCancel);
    };
  }, [isPTT]);

  // Leaving PTT mode must never leave the mic open.
  useEffect(() => {
    if (!isPTT) actionsRef.current.releaseAll();
  }, [isPTT]);

  // Unmount (call ended) also releases.
  useEffect(() => {
    return () => actionsRef.current.releaseAll();
  }, []);

  if (!isPTT) return null;

  return (
    <div className="flex flex-col items-center gap-4" data-testid="ptt-control">
      <button
        ref={buttonRef}
        type="button"
        aria-pressed={isPTTTalking}
        onMouseDown={(e) => {
          if (e.button !== 0) return;
          actionsRef.current.press("mouse");
        }}
        onMouseUp={() => actionsRef.current.release("mouse")}
        onMouseLeave={() => actionsRef.current.release("mouse")}
        onContextMenu={(e) => e.preventDefault()}
        style={{ touchAction: "none", WebkitUserSelect: "none", userSelect: "none" }}
        className={`flex h-48 w-48 select-none items-center justify-center rounded-full border-4 px-4 text-center text-xl font-bold text-white focus:outline-none focus:ring-4 focus:ring-violet-400 ${
          isPTTTalking
            ? "border-amber-400 bg-amber-500 motion-safe:animate-pulse"
            : "border-indigo-500 bg-indigo-600"
        }`}
      >
        {isPTTTalking ? "You are talking" : "Hold to talk"}
      </button>

      <p className="text-base text-slate-400">Or hold the Space bar</p>

      <div role="status" aria-live="polite" className="min-h-[48px]">
        {isRemotePTTTalking && (
          <p className="rounded-full border border-amber-500 px-4 py-2 text-lg font-semibold text-amber-400">
            Partner is talking
          </p>
        )}
      </div>
    </div>
  );
}
