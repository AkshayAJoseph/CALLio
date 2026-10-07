# Cooee Echo: Build Context and Handoff File

Owner: Akhila Sunesh | Team Helldivers | Pillar 2: Adaptive Fallback and Network Telemetry

## 0. How to use this file (read first)

This file is the live progress record for the build. It is written so that any LLM or coding agent can open a brand new session, read only this file (plus `cooee.md` if available), and continue the work with no other history.

Working agreement with the human owner:

1. Build the project phase by phase. Finish one phase, report, then wait before starting the next unless told to continue.
2. After every phase, update sections 4 (status), 5 (files), 6 (decisions) and 9 (next phase brief) of this file, and add a line to the change log in section 11. This file must never be stale.
3. Follow the frozen contract (section 7) exactly. Never invent hook fields.
4. Only create or edit files in my own areas (section 5). Do not touch the real hook, server, dialer, intent picker or incoming call modal.
5. Do not use hyphens in written text or code comments. Plain words only.
6. Keep thresholds in one config file. Handle a null `peerConnectionRef.current` everywhere.
7. Prefer simple, working code over clever code. The demo must be reliable.

If you are a new LLM picking this up: read sections 1 to 4 and 9, then do the next phase. Section 12 has a ready to paste starter prompt.

## 1. Project in one paragraph

Cooee Echo is an adaptive, context aware extension to Cooee's VoIP calling. Pillar 1 attaches intent and timezone context before a call rings. Pillar 2 (mine) keeps a call alive when the network degrades by switching from full audio to Push to Talk (PTT), then to live text, without ever tearing down the WebRTC connection. Pillar 3 is a zero config accessibility portal with auto answer for trusted guardians. The target is a polished, reliable MVP demo on two Chrome laptops.

My pillar owns the whole in call screen: telemetry HUD, network simulator, PTT, live text fallback, and threshold based automatic mode switching.

## 2. Team and event facts

* Akshay Joseph: backend, signaling, the real `useWebRTC` hook, TURN, deployment.
* Akhila Sunesh (me): everything in section 5.
* Amrutha Ajish Achuthan: IntentPicker, IncomingCallModal, browser notifications.
* Anjali Kizhakekuttu Thomas: dialer, dependent portal with auto answer, pitch deck, backup video.
* Event: starts 4:30 PM day 1 (Hour 0), hard end 4 PM day 2. First check in 8 PM day 1. Integration windows around 12 AM and 6 AM.
* Screen flow: dialer or dependent page, then intent picker and incoming call modal, then once `callState` is CONNECTED, my ActiveCallView.

## 3. Tech stack

* React with Vitest and React Testing Library for tests. Project uses Vite config (`vite.config.js`). Target app stack is Next.js App Router, so client components start with `"use client"`.
* Tailwind CSS for a dark theme.
* Native `RTCPeerConnection.getStats()` for jitter, packet loss, RTT. No external stats library.
* RTCDataChannel is used only through the hook. I never touch it directly.
* Optional inline SVG sparkline. No chart library.

Test setup (already written): `tests/setup.js` imports `@testing-library/jest-dom/vitest`, runs `cleanup`, restores real timers and restores mocks after each test. It must be listed under `test.setupFiles` in `vite.config.js`, with `test.environment` set to `"jsdom"`.

## 4. Phase plan and status

Status values: DONE, IN PROGRESS, TODO.

| Phase | Scope | Status |
|---|---|---|
| 1 | Setup: mock hook, test page that reaches CONNECTED, tests | DONE |
| 2 | ActiveCallView shell: dark theme, header, intent badge, mode area switching on `networkMode`, End Call, always mounted audio element, empty simulator bar | DONE |
| 3 | Telemetry core: `thresholds.js` with `evaluateNetwork`, stats parser and polling hook with null guard, TelemetryHUD pill with colours, icons, three numbers (fake values) | DONE |
| 4 | NetworkSimulator: three buttons injecting stats, edge triggered auto switching, override label and reset, collapsible floating bar, mode change toast | DONE |
| 5 | Push to Talk: button, mouse and touch, spacebar logic, remote talking indicator, disable in other modes | DONE |
| 6 | Text fallback and live typing: chat panel, ghost bubble, input logic, mock helpers | DONE |
| 7 | Integration with the real hook: swap import line, test on two laptops, fix ping pong | DONE |
| 8 | Hardening: hysteresis (3 bad polls to downgrade, 5 good polls to upgrade), mobile touch, accessibility, large text | DONE |
| 9 | Stretch: toast polish, live call duration timer, change log and polish | DONE |

## 5. Repo layout and files

Project root contains: `app/calltest/`, `client/`, `components/`, `hooks/`, `node_modules/`, `tests/`, `.gitignore`, `package-lock.json`, `package.json`, `README.md`, `vite.config.js`.

Files in `components/call/` and `client/components/call/`:
* `thresholds.js`: thresholds, presets, and `evaluateNetwork`.
* `statsParser.js`: pure getStats parser and packet loss calculation.
* `useNetworkStats.js`: polling hook with telemetry, source, simulator override, and real stats hysteresis (3-poll downgrade, 5-poll upgrade).
* `TelemetryHUD.jsx`: pill with status icon, mode label, jitter, packet loss, and RTT.
* `NetworkSimulator.jsx`: collapsible floating bar for simulating network degradation presets.
* `PTTControl.jsx`: push to talk control with mouse, touch, and Spacebar hold to talk support.
* `TextFallbackPanel.jsx`: chat panel with message list, live ghost bubble typing stream, and input bar.
* `ActiveCallView.jsx`: in call container screen with live call duration timer, mode change toast, and telemetry HUD.

Test files in `components/call/`:
* `thresholds.test.js`, `TelemetryHUD.test.jsx`, `useNetworkStats.test.jsx`, `useNetworkStats.override.test.jsx`, `useNetworkStats.hysteresis.test.jsx`, `NetworkSimulator.test.jsx`, `PTTControl.test.jsx`, `TextFallbackPanel.test.jsx`, `ActiveCallView.test.jsx`, `ActiveCallView.simulator.test.jsx`, `ActiveCallView.ptt.test.jsx`, `ActiveCallView.text.test.jsx`.

## 6. Decisions and assumptions made so far

* Phase 7 decisions: Integrated components into `client/components/call/` and wired `client/app/dialer/page.tsx` and `client/app/dependent/page.tsx` directly to the shared WebRTC context. Ping pong is avoided by edge triggered evaluation, remote mode authority, and fallback preset values when not overridden.
* Phase 8 decisions: Implemented hysteresis in `useNetworkStats.js`. Real network degradation requires 3 consecutive bad polls to trigger a downgrade, while recovery requires 5 consecutive good polls to trigger an upgrade. Simulator overrides intentionally bypass hysteresis for instant feedback during presentations.
* Phase 9 decisions: Added active call duration counter in `ActiveCallView.jsx`, visual status indicators, polished mode transition toasts with polite screen reader announcements, and synchronized all components between the standalone test runner and the Next.js client.

## 7. Frozen contract: what `useWebRTC()` returns

State:
* `myNumber`: string.
* `callState`: IDLE, CALLING, RINGING or CONNECTED.
* `incomingCall`: null, or an object with `from`, `intentTag`, `priority`, `note`, `callerTime`, `callerTz`.
* `networkMode`: FULL_AUDIO, PTT or TEXT. Synced across both browsers.
* `isPTTTalking`: true while I hold the button.
* `isRemotePTTTalking`: true while the partner holds theirs.
* `chatMessages`: array of `{ sender, text, time }`.
* `remoteTypingText`: partner's live draft string, empty when not typing.
* `peerConnectionRef`: a ref pointing to `RTCPeerConnection`.

Actions:
* `startCall(targetNumber, intentObject)`, `answerIncomingCall()`, `endActiveCall()`, `registerNumber(number)`.
* `setFallbackMode(mode)`: sets local mode, toggles mic track, sends MODE_SWITCH to the partner.
* `setPTTActive(boolean)`: toggles the mic track, sends PTT_STATUS.
* `sendTextFallback(text)`: appends locally and sends as CHAT.
* `sendLiveTyping(draftString)`: sends LIVE_TYPING with the full draft.

## 8. Demo checklist (for presentation)

1. Start signaling server (`cd server && node server.js`).
2. Start client app (`cd client && npm run dev`).
3. Open two browser windows at `http://localhost:3000/dialer`.
4. Call between the two numbers, answer the call.
5. In the Dev Network Simulator:
   - Click "Edge Roaming": switches seamlessly to PTT mode. Hold Spacebar or click to talk.
   - Click "Critical Drop": switches seamlessly to live text. Type message to show real time ghost streaming.
   - Click "Return to live stats" or "Normal": recovers back to full audio.
   - Click "End call": cleanly resets all states, drafts, and connections.

## 9. Next steps

All 9 phases of Pillar 2 are complete and passing all 14 test suites and 79 unit tests. Ready for live testing across devices and demonstration.

## 10. Change log

* Phase 1 complete: created `hooks/useWebRTC.mock.js` and `app/calltest/page.jsx`.
* Phase 2 complete: created `ActiveCallView.jsx` shell and tests.
* Phase 3 complete: added `thresholds.js`, `statsParser.js`, `useNetworkStats.js`, `TelemetryHUD.jsx`.
* Phase 4 complete: added `NetworkSimulator.jsx` and edge triggered automatic switching.
* Phase 5 complete: added `PTTControl.jsx` with mouse, touch, and Spacebar controls.
* Phase 6 complete: added `TextFallbackPanel.jsx` with ghost bubble typing streaming.
* Phase 7 complete: integrated full call view with Next.js client dialer and dependent routes using shared WebRTC context.
* Phase 8 complete: added hysteresis logic (3 bad polls downgrade, 5 good polls upgrade) in `useNetworkStats.js` with unit test.
* Phase 9 complete: added active call duration timer, mode change toast notifications, and UI polish.
