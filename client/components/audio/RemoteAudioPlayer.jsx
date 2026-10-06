"use client";

import { forwardRef } from "react";

/**
 * A persistent global audio element mounted at the root layout.
 * We use this so that remote WebRTC audio continues playing seamlessly
 * even if the user navigates between different routes (e.g., /dialer to /dependent).
 */
const RemoteAudioPlayer = forwardRef((props, ref) => {
  return (
    <audio
      id="remoteAudio"
      ref={ref}
      autoPlay
      playsInline
      // Keep it hidden, audio is managed via the WebRTC stream attached to the ref
      className="hidden"
    />
  );
});

RemoteAudioPlayer.displayName = "RemoteAudioPlayer";

export default RemoteAudioPlayer;
