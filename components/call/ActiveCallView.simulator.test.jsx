import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import ActiveCallView from "./ActiveCallView";

function makeCall(overrides = {}) {
  return {
    networkMode: "FULL_AUDIO",
    incomingCall: null,
    isRemotePTTTalking: false,
    peerConnectionRef: { current: null },
    setFallbackMode: vi.fn(),
    endActiveCall: vi.fn(),
    ...overrides,
  };
}

describe("ActiveCallView simulator wiring", () => {
  it("calls setFallbackMode once per level change, not every render", () => {
    const call = makeCall();
    const { rerender } = render(<ActiveCallView call={call} />);

    fireEvent.click(screen.getByRole("button", { name: "Edge Roaming" }));
    expect(call.setFallbackMode).toHaveBeenCalledTimes(1);
    expect(call.setFallbackMode).toHaveBeenLastCalledWith("PTT");

    rerender(<ActiveCallView call={{ ...call }} />);
    fireEvent.click(screen.getByRole("button", { name: "Edge Roaming" }));
    expect(call.setFallbackMode).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByRole("button", { name: "Critical Drop" }));
    expect(call.setFallbackMode).toHaveBeenCalledTimes(2);
    expect(call.setFallbackMode).toHaveBeenLastCalledWith("TEXT");
  });

  it("Normal does nothing when already in FULL_AUDIO", () => {
    const call = makeCall();
    render(<ActiveCallView call={call} />);
    fireEvent.click(screen.getByRole("button", { name: "Normal" }));
    expect(call.setFallbackMode).not.toHaveBeenCalled();
  });

  it("shows simulated numbers in the HUD and the active label", () => {
    render(<ActiveCallView call={makeCall()} />);
    fireEvent.click(screen.getByRole("button", { name: "Critical Drop" }));
    expect(screen.getByTestId("hud-jitter")).toHaveTextContent("450");
    expect(screen.getByText("Simulation active")).toBeInTheDocument();
  });

  it("Return to live stats clears the simulation", () => {
    render(<ActiveCallView call={makeCall()} />);
    fireEvent.click(screen.getByRole("button", { name: "Critical Drop" }));
    fireEvent.click(screen.getByText("Return to live stats"));
    expect(screen.queryByText("Simulation active")).toBeNull();
  });

  it("shows a toast when networkMode changes", () => {
    const call = makeCall();
    const { rerender } = render(<ActiveCallView call={call} />);
    expect(screen.queryByText(/Call kept alive/)).toBeNull();
    rerender(<ActiveCallView call={{ ...call, networkMode: "PTT" }} />);
    expect(screen.getByText(/Switched to Push to Talk/)).toBeInTheDocument();
  });
});
