"use client";

import { useWebRTC } from "../../hooks/useWebRTC";

/**
 * A persistent global audio element mounted at the root layout.
 * We use this so that remote WebRTC audio continues playing seamlessly
 * even if the user navigates between different routes (e.g., /dialer to /dependent).
 */
export default function RemoteAudioPlayer() {
  const { remoteAudioRef } = useWebRTC();

  return (
    <audio
      id="remoteAudio"
      ref={remoteAudioRef}
      autoPlay
      playsInline
      // Keep it hidden, audio is managed via the WebRTC stream attached to the ref
      className="hidden"
    />
  );
}
