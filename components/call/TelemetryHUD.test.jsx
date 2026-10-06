import React from "react";
import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import TelemetryHUD from "./TelemetryHUD";
import { PRESETS } from "./thresholds";

describe("TelemetryHUD", () => {
  it("shows Optimal with emerald colours and the normal numbers", () => {
    render(<TelemetryHUD networkMode="FULL_AUDIO" telemetry={PRESETS.NORMAL} />);
    const pill = screen.getByTestId("status-pill");
    expect(pill).toHaveTextContent("Optimal");
    expect(pill.className).toContain("emerald");
    expect(screen.getByTestId("hud-jitter")).toHaveTextContent("15");
    expect(screen.getByTestId("hud-loss")).toHaveTextContent("0.5");
    expect(screen.getByTestId("hud-rtt")).toHaveTextContent("50");
  });

  it("shows Degraded with amber colours and the edge roaming numbers", () => {
    render(<TelemetryHUD networkMode="PTT" telemetry={PRESETS.EDGE_ROAMING} />);
    const pill = screen.getByTestId("status-pill");
    expect(pill).toHaveTextContent("Degraded");
    expect(pill.className).toContain("amber");
    expect(screen.getByTestId("hud-jitter")).toHaveTextContent("160");
    expect(screen.getByTestId("hud-loss")).toHaveTextContent("18");
    expect(screen.getByTestId("hud-rtt")).toHaveTextContent("200");
  });

  it("shows Critical with rose colours and the critical numbers", () => {
    render(<TelemetryHUD networkMode="TEXT" telemetry={PRESETS.CRITICAL_DROP} />);
    const pill = screen.getByTestId("status-pill");
    expect(pill).toHaveTextContent("Critical");
    expect(pill.className).toContain("rose");
    expect(screen.getByTestId("hud-jitter")).toHaveTextContent("450");
    expect(screen.getByTestId("hud-loss")).toHaveTextContent("42");
    expect(screen.getByTestId("hud-rtt")).toHaveTextContent("650");
  });

  it("has an icon and a polite live region so colour is never the only signal", () => {
    const { container } = render(<TelemetryHUD networkMode="PTT" telemetry={PRESETS.EDGE_ROAMING} />);
    const pill = screen.getByTestId("status-pill");
    expect(pill).toHaveAttribute("role", "status");
    expect(pill).toHaveAttribute("aria-live", "polite");
    expect(container.querySelector("svg")).not.toBeNull();
  });

  it("shows a Connecting label only while connecting", () => {
    const { rerender } = render(
      <TelemetryHUD networkMode="FULL_AUDIO" telemetry={{ packetLoss: 0, jitter: 0, rtt: 0 }} source="connecting" />
    );
    expect(screen.getByTestId("hud-connecting")).toBeInTheDocument();
    rerender(<TelemetryHUD networkMode="FULL_AUDIO" telemetry={PRESETS.NORMAL} source="live" />);
    expect(screen.queryByTestId("hud-connecting")).toBeNull();
  });

  it("falls back to Optimal styling for an unknown mode", () => {
    render(<TelemetryHUD networkMode="WHAT" telemetry={PRESETS.NORMAL} />);
    expect(screen.getByTestId("status-pill")).toHaveTextContent("Optimal");
  });
});
