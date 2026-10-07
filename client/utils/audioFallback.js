/**
 * Creates a silent audio stream using Web Audio API.
 * This is crucial as a fallback if the user denies microphone permissions
 * or if a test device has no microphone attached. The WebRTC connection
 * and DataChannel will still connect successfully without crashing!
 * 
 * @returns {MediaStream} A silent audio stream
 */
export function createSilentAudioStream() {
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const oscillator = ctx.createOscillator();
  const destination = ctx.createMediaStreamDestination();
  
  // Set oscillator type and connect to destination
  oscillator.type = "sine";
  // We keep frequency at 0 or disconnect it from master output so it's truly silent, 
  // but sending the node data keeps the track active.
  oscillator.frequency.setValueAtTime(0, ctx.currentTime);
  oscillator.connect(destination);
  oscillator.start();

  return destination.stream;
}
