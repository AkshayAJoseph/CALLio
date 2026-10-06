import { act, renderHook } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { useWebRTC } from "./useWebRTC.mock";

describe("useWebRTC mock", () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it("sends text messages and resets call fallback state when a call ends", () => {
    const { result } = renderHook(() => useWebRTC());

    act(() => {
      result.current.setFallbackMode("TEXT");
      result.current.sendTextFallback("Hello");
    });

    expect(result.current.networkMode).toBe("TEXT");
    expect(result.current.chatMessages).toHaveLength(1);
    expect(result.current.chatMessages[0]).toMatchObject({
      sender: "+61 480 000 111",
      text: "Hello",
    });

    act(() => {
      result.current.endActiveCall();
    });

    expect(result.current.callState).toBe("IDLE");
    expect(result.current.networkMode).toBe("FULL_AUDIO");
    expect(result.current.chatMessages).toEqual([]);
  });

  it("ignores empty text and resets remote push-to-talk after the simulated hold", () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useWebRTC());

    act(() => {
      result.current.sendTextFallback("  ");
      result.current.__simulatePartnerPTT();
    });

    expect(result.current.chatMessages).toEqual([]);
    expect(result.current.isRemotePTTTalking).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(result.current.isRemotePTTTalking).toBe(false);
  });
});
