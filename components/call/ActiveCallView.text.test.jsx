import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ActiveCallView from "./ActiveCallView";

function makeCall(overrides = {}) {
  return {
    networkMode: "TEXT",
    myNumber: "+61 480 000 111",
    incomingCall: null,
    chatMessages: [],
    remoteTypingText: "",
    peerConnectionRef: { current: null },
    setFallbackMode: vi.fn(),
    setPTTActive: vi.fn(),
    sendTextFallback: vi.fn(),
    sendLiveTyping: vi.fn(),
    endActiveCall: vi.fn(),
    ...overrides,
  };
}

describe("ActiveCallView text fallback", () => {
  it("shows the chat panel in TEXT mode only", () => {
    const call = makeCall();
    const { rerender } = render(<ActiveCallView call={call} />);
    expect(screen.getByLabelText("Type a message")).toBeInTheDocument();
    rerender(<ActiveCallView call={{ ...call, networkMode: "FULL_AUDIO" }} />);
    expect(screen.queryByLabelText("Type a message")).toBeNull();
  });

  it("keeps the draft across mode switches", () => {
    const call = makeCall();
    const { rerender } = render(<ActiveCallView call={call} />);
    fireEvent.change(screen.getByLabelText("Type a message"), {
      target: { value: "half written" },
    });
    rerender(<ActiveCallView call={{ ...call, networkMode: "PTT" }} />);
    rerender(<ActiveCallView call={{ ...call, networkMode: "TEXT" }} />);
    expect(screen.getByLabelText("Type a message")).toHaveValue("half written");
  });

  it("passes messages and the partner draft to the panel", () => {
    const call = makeCall({
      chatMessages: [{ sender: "+61 480 000 222", text: "are you there", time: "9:00" }],
      remoteTypingText: "yes",
    });
    render(<ActiveCallView call={call} />);
    expect(screen.getByTestId("message-partner")).toHaveTextContent("are you there");
    expect(screen.getByTestId("ghost-bubble")).toHaveTextContent("yes");
  });
});
