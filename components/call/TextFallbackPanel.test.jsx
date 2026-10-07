import React, { useState } from "react";
import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import TextFallbackPanel from "./TextFallbackPanel";

const ME = "+61 480 000 111";
const PARTNER = "+61 480 000 222";

// Wrapper that owns the draft, like ActiveCallView does.
function Harness({ initial = "", ...props }) {
  const [draft, setDraft] = useState(initial);
  return (
    <TextFallbackPanel
      myNumber={ME}
      draft={draft}
      onDraftChange={setDraft}
      {...props}
    />
  );
}

function setup(props = {}) {
  const sendTextFallback = vi.fn();
  const sendLiveTyping = vi.fn();
  render(
    <Harness
      sendTextFallback={sendTextFallback}
      sendLiveTyping={sendLiveTyping}
      {...props}
    />
  );
  return { sendTextFallback, sendLiveTyping, input: screen.getByLabelText("Type a message") };
}

describe("TextFallbackPanel", () => {
  it("shows my messages and partner messages separately with times", () => {
    setup({
      chatMessages: [
        { sender: ME, text: "hello", time: "10:01" },
        { sender: PARTNER, text: "hi back", time: "10:02" },
      ],
    });
    expect(screen.getByTestId("message-mine")).toHaveTextContent("hello");
    expect(screen.getByTestId("message-mine")).toHaveTextContent("10:01");
    expect(screen.getByTestId("message-partner")).toHaveTextContent("hi back");
  });

  it("shows the ghost bubble only when the partner is typing", () => {
    const { unmount } = render(<Harness remoteTypingText="" />);
    expect(screen.queryByTestId("ghost-bubble")).toBeNull();
    unmount();
    render(<Harness remoteTypingText="on my way" />);
    expect(screen.getByTestId("ghost-bubble")).toHaveTextContent("Partner is typing");
    expect(screen.getByTestId("ghost-bubble")).toHaveTextContent("on my way");
  });

  it("sends the whole draft on every change", () => {
    const { sendLiveTyping, input } = setup();
    fireEvent.change(input, { target: { value: "h" } });
    fireEvent.change(input, { target: { value: "hi" } });
    expect(sendLiveTyping).toHaveBeenNthCalledWith(1, "h");
    expect(sendLiveTyping).toHaveBeenNthCalledWith(2, "hi");
  });

  it("sends with Enter and clears the draft", () => {
    const { sendTextFallback, input } = setup();
    fireEvent.change(input, { target: { value: "hello" } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(sendTextFallback).toHaveBeenCalledWith("hello");
    expect(input).toHaveValue("");
  });

  it("sends with the Send button", () => {
    const { sendTextFallback, input } = setup();
    fireEvent.change(input, { target: { value: "hey" } });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(sendTextFallback).toHaveBeenCalledWith("hey");
  });

  it("ignores empty and whitespace only drafts", () => {
    const { sendTextFallback, input } = setup();
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.change(input, { target: { value: "    " } });
    fireEvent.keyDown(input, { key: "Enter" });
    fireEvent.click(screen.getByRole("button", { name: "Send" }));
    expect(sendTextFallback).not.toHaveBeenCalled();
  });

  it("sends long pasted text in one piece", () => {
    const { sendTextFallback, input } = setup();
    const long = "word ".repeat(400).trim();
    fireEvent.change(input, { target: { value: long } });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(sendTextFallback).toHaveBeenCalledWith(long);
  });

  it("keeps key events inside the input away from window handlers", () => {
    const { input } = setup();
    const windowHandler = vi.fn();
    window.addEventListener("keydown", windowHandler);
    fireEvent.keyDown(input, { code: "Space", key: " " });
    window.removeEventListener("keydown", windowHandler);
    expect(windowHandler).not.toHaveBeenCalled();
  });

  it("does not crash without send functions", () => {
    render(<Harness />);
    const input = screen.getByLabelText("Type a message");
    fireEvent.change(input, { target: { value: "x" } });
    fireEvent.keyDown(input, { key: "Enter" });
  });
});
