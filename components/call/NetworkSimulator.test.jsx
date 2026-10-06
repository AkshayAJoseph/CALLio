import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import NetworkSimulator from "./NetworkSimulator";
import { PRESETS } from "./thresholds";

describe("NetworkSimulator", () => {
  it("each button sends its preset", () => {
    const onSelectPreset = vi.fn();
    render(<NetworkSimulator onSelectPreset={onSelectPreset} />);
    fireEvent.click(screen.getByRole("button", { name: "Normal" }));
    fireEvent.click(screen.getByRole("button", { name: "Edge Roaming" }));
    fireEvent.click(screen.getByRole("button", { name: "Critical Drop" }));
    expect(onSelectPreset).toHaveBeenNthCalledWith(1, PRESETS.NORMAL);
    expect(onSelectPreset).toHaveBeenNthCalledWith(2, PRESETS.EDGE_ROAMING);
    expect(onSelectPreset).toHaveBeenNthCalledWith(3, PRESETS.CRITICAL_DROP);
  });

  it("hides the label and reset control when not overridden", () => {
    render(<NetworkSimulator />);
    expect(screen.queryByText("Simulation active")).toBeNull();
    expect(screen.queryByText("Return to live stats")).toBeNull();
  });

  it("shows the label and reset control when overridden", () => {
    const onReturnToLive = vi.fn();
    render(<NetworkSimulator isOverridden onReturnToLive={onReturnToLive} />);
    expect(screen.getByText("Simulation active")).toBeInTheDocument();
    fireEvent.click(screen.getByText("Return to live stats"));
    expect(onReturnToLive).toHaveBeenCalledTimes(1);
  });

  it("collapses and expands", () => {
    render(<NetworkSimulator />);
    fireEvent.click(screen.getByText("Hide Dev Network Simulator"));
    expect(screen.queryByRole("button", { name: "Normal" })).toBeNull();
    fireEvent.click(screen.getByText("Show Dev Network Simulator"));
    expect(screen.getByRole("button", { name: "Normal" })).toBeInTheDocument();
  });
});
