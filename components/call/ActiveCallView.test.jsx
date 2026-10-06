import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import ActiveCallView from "./ActiveCallView";

const makeCall = (overrides = {}) => ({
  networkMode: "FULL_AUDIO",
  incomingCall: {
    from: "+61 480 000 222",
    intentTag: "Urgent, Please Pick Up",
    priority: "HIGH",
    note: "Call me back please",
    callerTime: "10:00",
    callerTz: "Australia/Sydney",
  },
  isRemotePTTTalking: false,
  endActiveCall: vi.fn(),
  ...overrides,
});

describe("ActiveCallView", () => {
  it("shows the live audio layout in FULL_AUDIO", () => {
    render(<ActiveCallView call={makeCall()} />);

    expect(screen.getByRole("heading", { name: "Live audio" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Push to Talk" })).not.toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Live text" })).not.toBeInTheDocument();
    expect(screen.getByText("Network: Optimal")).toBeInTheDocument();
  });

  it("shows the Push to Talk layout and the partner talking indicator", () => {
    const { rerender } = render(
      <ActiveCallView call={makeCall({ networkMode: "PTT" })} />
    );

    expect(screen.getByRole("heading", { name: "Push to Talk" })).toBeInTheDocument();
    expect(screen.getByText("Network: Degraded")).toBeInTheDocument();
    expect(screen.queryByText("Partner is talking")).not.toBeInTheDocument();

    rerender(
      <ActiveCallView
        call={makeCall({ networkMode: "PTT", isRemotePTTTalking: true })}
      />
    );
    expect(screen.getByText("Partner is talking")).toBeInTheDocument();
  });

  it("shows the live text layout in TEXT", () => {
    render(<ActiveCallView call={makeCall({ networkMode: "TEXT" })} />);

    expect(screen.getByRole("heading", { name: "Live text" })).toBeInTheDocument();
    expect(screen.getByText("Network: Critical")).toBeInTheDocument();
  });

  it("shows the intent badge, note and partner number", () => {
    render(<ActiveCallView call={makeCall()} />);

    expect(screen.getByText("Urgent, Please Pick Up")).toBeInTheDocument();
    expect(screen.getByText("Call me back please")).toBeInTheDocument();
    expect(screen.getByText("+61 480 000 222")).toBeInTheDocument();
  });

  it("falls back to the dialed number and hides the badge without an incoming call", () => {
    render(
      <ActiveCallView
        call={makeCall({ incomingCall: null })}
        dialedNumber="+61 400 111 222"
      />
    );

    expect(screen.getByText("+61 400 111 222")).toBeInTheDocument();
    expect(screen.queryByTestId("intent-badge")).not.toBeInTheDocument();
  });

  it("calls endActiveCall when End call is pressed", () => {
    const call = makeCall();
    render(<ActiveCallView call={call} />);

    fireEvent.click(screen.getByRole("button", { name: "End call" }));
    expect(call.endActiveCall).toHaveBeenCalledTimes(1);
  });

  it("always renders the remote audio element in every mode", () => {
    const { rerender } = render(<ActiveCallView call={makeCall()} />);
    expect(document.getElementById("remoteAudio")).not.toBeNull();

    rerender(<ActiveCallView call={makeCall({ networkMode: "PTT" })} />);
    expect(document.getElementById("remoteAudio")).not.toBeNull();

    rerender(<ActiveCallView call={makeCall({ networkMode: "TEXT" })} />);
    expect(document.getElementById("remoteAudio")).not.toBeNull();
    expect(document.querySelectorAll("#remoteAudio")).toHaveLength(1);
  });

  it("shows a toast when the mode changes and hides it after a few seconds", () => {
    vi.useFakeTimers();
    const { rerender } = render(<ActiveCallView call={makeCall()} />);

    expect(
      screen.queryByText("Network degraded. Switched to Push to Talk. Call kept alive.")
    ).not.toBeInTheDocument();

    rerender(<ActiveCallView call={makeCall({ networkMode: "PTT" })} />);
    expect(
      screen.getByText("Network degraded. Switched to Push to Talk. Call kept alive.")
    ).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(
      screen.queryByText("Network degraded. Switched to Push to Talk. Call kept alive.")
    ).not.toBeInTheDocument();
  });

  it("collapses and expands the simulator bar", () => {
    render(<ActiveCallView call={makeCall()} />);

    const toggle = screen.getByRole("button", { name: "Hide Dev Network Simulator" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(toggle);
    expect(
      screen.getByRole("button", { name: "Show Dev Network Simulator" })
    ).toHaveAttribute("aria-expanded", "false");
  });
});
