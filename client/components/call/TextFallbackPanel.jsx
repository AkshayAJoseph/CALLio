"use client";

import React, { useEffect, useRef } from "react";

// Chat panel for TEXT mode with live typing.
//
// The draft is controlled by the parent (draft and onDraftChange), so it survives
// switching away from TEXT mode and back.
//
// Props:
//   chatMessages: [{ sender, text, time }]
//   remoteTypingText: partner's live draft, empty string when not typing
//   myNumber: used to tell my messages from the partner's
//   draft, onDraftChange(string)
//   sendTextFallback(text), sendLiveTyping(fullDraft)

function formatTime(time) {
  if (time === undefined || time === null || time === "") return "";
  if (typeof time === "string") return time;
  const date = new Date(time);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function TextFallbackPanel({
  chatMessages = [],
  remoteTypingText = "",
  myNumber = "",
  draft = "",
  onDraftChange = () => {},
  sendTextFallback,
  sendLiveTyping,
}) {
  const endRef = useRef(null);

  // Keep the newest message or typing text in view.
  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: "end" });
  }, [chatMessages, remoteTypingText]);

  function handleChange(e) {
    const value = e.target.value;
    onDraftChange(value);
    sendLiveTyping?.(value); // always the whole draft
  }

  function send() {
    if (draft.trim() === "") return;
    sendTextFallback?.(draft);
    onDraftChange("");
  }

  function handleKeyDown(e) {
    // Keep typing keys away from any window level handler such as the spacebar.
    e.stopPropagation();
    if (e.key === "Enter" && !e.nativeEvent?.isComposing) {
      e.preventDefault();
      send();
    }
  }

  return (
    <div className="flex w-full flex-col gap-3 text-left" data-testid="text-panel">
      <div
        role="log"
        aria-label="Messages"
        aria-live="polite"
        className="flex max-h-72 min-h-[8rem] flex-col gap-2 overflow-y-auto rounded-xl bg-slate-950 p-3"
      >
        {chatMessages.length === 0 && !remoteTypingText && (
          <p className="text-base text-slate-400">No messages yet. Type below.</p>
        )}

        {chatMessages.map((message, index) => {
          const mine = message.sender === myNumber;
          const time = formatTime(message.time);
          return (
            <div
              key={`${index}-${message.time ?? ""}`}
              data-testid={mine ? "message-mine" : "message-partner"}
              className={`max-w-[85%] rounded-2xl px-4 py-2 ${
                mine
                  ? "self-end bg-indigo-600 text-white"
                  : "self-start bg-slate-800 text-white"
              }`}
            >
              <p className="whitespace-pre-wrap break-words text-lg">{message.text}</p>
              {time && <p className="text-xs text-slate-300">{time}</p>}
            </div>
          );
        })}

        {remoteTypingText && (
          <div
            data-testid="ghost-bubble"
            className="max-w-[85%] self-start rounded-2xl border border-dashed border-slate-600 bg-slate-800/60 px-4 py-2 opacity-70"
          >
            <p className="text-xs text-slate-400">Partner is typing</p>
            <p className="whitespace-pre-wrap break-words text-lg">
              {remoteTypingText}
              <span
                aria-hidden="true"
                className="ml-0.5 inline-block w-0.5 bg-white align-middle text-lg motion-safe:animate-pulse"
              >
                &nbsp;
              </span>
            </p>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={draft}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onKeyUp={(e) => e.stopPropagation()}
          aria-label="Type a message"
          placeholder="Type a message"
          autoComplete="off"
          className="min-h-[56px] min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-950 px-4 text-lg text-white placeholder-slate-500 focus:outline-none focus:ring-4 focus:ring-violet-400"
        />
        <button
          type="button"
          onClick={send}
          className="min-h-[56px] rounded-xl bg-indigo-600 px-5 text-lg font-semibold text-white focus:outline-none focus:ring-4 focus:ring-violet-400"
        >
          Send
        </button>
      </div>
    </div>
  );
}
