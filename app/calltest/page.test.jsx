import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import CallTest from "./page";

describe("CallTest page", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it("starts a fake call, connects, and switches fallback modes", () => {
    render(<CallTest />);

    expect(screen.getByText("callState: IDLE | networkMode: FULL_AUDIO")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Start fake call" }));
    expect(screen.getByText("callState: CALLING | networkMode: FULL_AUDIO")).toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(1500);
    });
    expect(screen.getByRole("heading", { name: "CONNECTED (ActiveCallView goes here)" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "PTT" }));
    expect(screen.getByText("callState: CONNECTED | networkMode: PTT")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "TEXT" }));
    expect(screen.getByText("callState: CONNECTED | networkMode: TEXT")).toBeInTheDocument();
  });

  it("accepts and ends an incoming call", () => {
    render(<CallTest />);

    fireEvent.click(screen.getByRole("button", { name: "Simulate incoming" }));
    expect(screen.getByText("callState: RINGING | networkMode: FULL_AUDIO")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Answer" }));
    expect(screen.getByRole("heading", { name: "CONNECTED (ActiveCallView goes here)" })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "End call" }));
    expect(screen.getByText("callState: IDLE | networkMode: FULL_AUDIO")).toBeInTheDocument();
  });
});
