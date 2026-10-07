# Cooee Echo (4A-Battery)

A robust WebRTC + Socket.IO Monorepo for the Cooee Echo Hackathon project.

## Structure
- `/server`: Node.js + Express + Socket.IO signaling server.
- `/client`: Next.js App Router + Tailwind frontend.
- `/components/call`: Adaptive PTT & Text fallback components, telemetry HUD, and network simulator.
- `/app/calltest`: Local call test page and test harness.

## Responsibilities
- **Akshay (Core):** `server.js`, `useWebRTC.js`, STUN/TURN, Fallback Streams, Demo Mode.
- **Akhila:** Adaptive Fallback, TelemetryHUD, NetworkSimulator, PTTControl, TextFallbackPanel.
- **Amrutha:** Contextual Signaling, Intent Picker, IncomingCallModal.
- **Anjali:** Dialer Shell, Elderly Dependent Portal (`/dependent`).

## Call test page tests

From the `code/4A-Battery` directory, install dependencies and run the call test page tests without building the app:

```sh
npm install
npm test
```

If running commands from the parent `cooee` directory, install dependencies in the app and run the root test script:

```sh
npm --prefix ./code/4A-Battery install
npm test
```

Use `npm run test:watch` from either directory to keep the tests running while editing. The tests use Vitest, jsdom, and React Testing Library; they exercise the mock call flow and do not run `npm build`.
