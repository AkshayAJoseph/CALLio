import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import ActiveCallView from "./ActiveCallView";

function makeCall(overrides = {}) {
  return {
    networkMode: "PTT",
    incomingCall: null,
    isPTTTalking: false,
    isRemotePTTTalking: false,
    peerConnectionRef: { current: null },
    setFallbackMode: vi.fn(),
    setPTTActive: vi.fn(),
    endActiveCall: vi.fn(),
    ...overrides,
  };
}

describe("ActiveCallView push to talk", () => {
  it("shows the PTT button in PTT mode", () => {
    render(<ActiveCallView call={makeCall()} />);
    expect(screen.getByRole("button", { name: "Hold to talk" })).toBeInTheDocument();
  });

  it("hides the PTT button in other modes", () => {
    render(<ActiveCallView call={makeCall({ networkMode: "FULL_AUDIO" })} />);
    expect(screen.queryByRole("button", { name: "Hold to talk" })).toBeNull();
  });

  it("shows Partner is talking once", () => {
    render(<ActiveCallView call={makeCall({ isRemotePTTTalking: true })} />);
    expect(screen.getAllByText("Partner is talking")).toHaveLength(1);
  });
});
