# Cooee Echo

A robust WebRTC + Socket.IO Monorepo for the Cooee Echo Hackathon project.

## Structure
- `/server`: Node.js + Express + Socket.IO signaling server.
- `/client`: Next.js App Router + Tailwind frontend.

## Responsibilities
- **Akshay (Core):** `server.js`, `useWebRTC.js`, STUN/TURN, Fallback Streams, Demo Mode.
- **Akhila:** Adaptive Fallback, TelemetryHUD, NetworkSimulator.
- **Amrutha:** Contextual Signaling, Intent Picker, IncomingCallModal.
- **Anjali:** Dialer Shell, Elderly Dependent Portal (`/dependent`).