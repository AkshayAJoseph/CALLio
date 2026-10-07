import React from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import PTTControl from "./PTTControl";

function setup(props = {}) {
  const setPTTActive = vi.fn();
  const utils = render(
    <PTTControl networkMode="PTT" setPTTActive={setPTTActive} {...props} />
  );
  return { setPTTActive, ...utils };
}

describe("PTTControl", () => {
  it("renders nothing outside PTT mode", () => {
    setup({ networkMode: "FULL_AUDIO" });
    expect(screen.queryByTestId("ptt-control")).toBeNull();
    setup({ networkMode: "TEXT" });
    expect(screen.queryByTestId("ptt-control")).toBeNull();
  });

  it("mouse down and up toggles the mic", () => {
    const { setPTTActive } = setup();
    const btn = screen.getByRole("button", { name: "Hold to talk" });
    fireEvent.mouseDown(btn);
    expect(setPTTActive).toHaveBeenLastCalledWith(true);
    fireEvent.mouseUp(btn);
    expect(setPTTActive).toHaveBeenLastCalledWith(false);
    expect(setPTTActive).toHaveBeenCalledTimes(2);
  });

  it("releases when the mouse leaves the button", () => {
    const { setPTTActive } = setup();
    const btn = screen.getByRole("button");
    fireEvent.mouseDown(btn);
    fireEvent.mouseLeave(btn);
    expect(setPTTActive).toHaveBeenLastCalledWith(false);
  });

  it("touch start and end toggle the mic and prevent default", () => {
    const { setPTTActive } = setup();
    const btn = screen.getByRole("button");
    const startNotPrevented = fireEvent.touchStart(btn);
    expect(startNotPrevented).toBe(false);
    expect(setPTTActive).toHaveBeenLastCalledWith(true);
    fireEvent.touchEnd(btn);
    expect(setPTTActive).toHaveBeenLastCalledWith(false);
  });

  it("spacebar holds and releases, and blocks page scroll", () => {
    const { setPTTActive } = setup();
    const notPrevented = fireEvent.keyDown(window, { code: "Space" });
    expect(notPrevented).toBe(false);
    expect(setPTTActive).toHaveBeenLastCalledWith(true);
    fireEvent.keyUp(window, { code: "Space" });
    expect(setPTTActive).toHaveBeenLastCalledWith(false);
  });

  it("ignores repeated keydown events", () => {
    const { setPTTActive } = setup();
    fireEvent.keyDown(window, { code: "Space" });
    fireEvent.keyDown(window, { code: "Space", repeat: true });
    fireEvent.keyDown(window, { code: "Space", repeat: true });
    expect(setPTTActive).toHaveBeenCalledTimes(1);
  });

  it("ignores the spacebar while typing in an input", () => {
    const { setPTTActive } = setup();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireEvent.keyDown(input, { code: "Space" });
    expect(setPTTActive).not.toHaveBeenCalled();
    input.remove();
  });

  it("releases on window blur while holding Space", () => {
    const { setPTTActive } = setup();
    fireEvent.keyDown(window, { code: "Space" });
    fireEvent.blur(window);
    expect(setPTTActive).toHaveBeenLastCalledWith(false);
    expect(setPTTActive).toHaveBeenCalledTimes(2);
  });

  it("releases when the mode leaves PTT while held", () => {
    const { setPTTActive, rerender } = setup();
    fireEvent.mouseDown(screen.getByRole("button"));
    rerender(<PTTControl networkMode="TEXT" setPTTActive={setPTTActive} />);
    expect(setPTTActive).toHaveBeenLastCalledWith(false);
  });

  it("releases on unmount while held", () => {
    const { setPTTActive, unmount } = setup();
    fireEvent.keyDown(window, { code: "Space" });
    unmount();
    expect(setPTTActive).toHaveBeenLastCalledWith(false);
  });

  it("ignores Space when not in PTT mode", () => {
    const { setPTTActive } = setup({ networkMode: "FULL_AUDIO" });
    fireEvent.keyDown(window, { code: "Space" });
    expect(setPTTActive).not.toHaveBeenCalled();
  });

  it("shows the talking and partner talking states", () => {
    setup({ isPTTTalking: true, isRemotePTTTalking: true });
    expect(screen.getByRole("button", { name: "You are talking" })).toBeInTheDocument();
    expect(screen.getByText("Partner is talking")).toBeInTheDocument();
  });
});
