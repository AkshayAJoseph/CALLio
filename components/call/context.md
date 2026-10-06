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
| 1 | Setup: mock hook, test page that reaches CONNECTED, tests | DONE (code written, tests not yet run by me) |
| 2 | ActiveCallView shell: dark theme, header, intent badge, mode area switching on `networkMode`, End Call, always mounted audio element, empty simulator bar | DONE  |
| 3 | Telemetry core: `thresholds.js` with `evaluateNetwork`, stats parser and polling hook with null guard, TelemetryHUD pill with colours, icons, three numbers (fake values) | DONE (code written, vitest not yet run by me, owner to verify) |
| 4 | NetworkSimulator: three buttons injecting stats, edge triggered auto switching, override label and reset, collapsible floating bar, mode change toast | DONE (code written, vitest not yet run by me, owner to verify) |
| 5 | Push to Talk: button, mouse and touch, spacebar logic, remote talking indicator, disable in other modes | TODO |
| 6 | Text fallback and live typing: chat panel, ghost bubble, input logic, mock helpers | TODO |
| 7 | Integration with the real hook: swap import line, test on two laptops, fix ping pong | TODO |
| 8 | Hardening: hysteresis, mobile touch, accessibility, large text | TODO |
| 9 | Stretch: toast polish, call timer, sparkline, sound cue, change log in simulator | TODO |



## 5. Repo layout and files

Project root contains (from the editor screenshot): `app/calltest/`, `client/`, `components/`, `hooks/`, `node_modules/`, `tests/`, `.gitignore`, `package-lock.json`, `package.json`, `README.md`, `vite.config.js`.

Done in phase 1:

* `hooks/useWebRTC.mock.js`: mock hook implementing the frozen contract plus helpers (section 8).
* `hooks/useWebRTC.mock.test.jsx`: hook tests (provided by the owner).
* `app/calltest/page.jsx`: test page, default export `CallTest`. Imports the hook from `../../hooks/useWebRTC.mock`. Shows `callState: X | networkMode: Y` in one text node. Buttons: Start fake call, Simulate incoming, Answer, Decline, End call, FULL_AUDIO, PTT, TEXT, Simulate partner talking, Simulate partner typing. When CONNECTED it shows heading `CONNECTED (ActiveCallView goes here)`. In phase 2 that heading area is replaced by the real ActiveCallView, but the existing test strings must keep passing or the tests get updated deliberately.
* `app/calltest/page.test.jsx`: page tests (provided by the owner).
* `tests/setup.js`: test setup (provided by the owner).

Done in phase 2: `components/call/ActiveCallView.jsx`, `ActiveCallView.test.jsx`, `NetworkSimulator.jsx` (empty bar). Note: the real folder is the top level `components/call/`, not `client/components/call/`. All new files follow the real folder.

Done in phase 3, all in `components/call/`:

* `thresholds.js`: `THRESHOLDS`, `PRESETS` (NORMAL, EDGE_ROAMING, CRITICAL_DROP), `MODE_PRESET_VALUES`, `ZERO_TELEMETRY`, `evaluateNetwork`.
* `statsParser.js`: pure `parseStatsReport(report)` and `calcPacketLoss(prev, next)`.
* `useNetworkStats.js`: polling hook, returns `{ telemetry, source }`.
* `TelemetryHUD.jsx`: pill (colour, icon, label) plus three numbers.
* `thresholds.test.js`, `TelemetryHUD.test.jsx`, `useNetworkStats.test.jsx`: tests.

Done in phase 4, all in `components/call/`:

* Changed: `useNetworkStats.js` (override, `isOverridden`, `evaluatedLevel`, source `"simulated"`), `NetworkSimulator.jsx` (presets, label, reset, collapsible), `ActiveCallView.jsx` (edge triggered switching, simulator wiring, bottom padding raised to `pb-72`), `TelemetryHUD.jsx` (small "Simulated" tag).
* New tests: `useNetworkStats.override.test.jsx`, `NetworkSimulator.test.jsx`, `ActiveCallView.simulator.test.jsx`.

Planned for my pillar, all in `components/call/` (spec said `client/components/call/`):

1. `ActiveCallView.jsx`: composes everything.
2. `TelemetryHUD.jsx`: status pill and numbers.
3. `NetworkSimulator.jsx`: floating collapsible bar.
4. `PTTControl.jsx`: walkie talkie button and keyboard logic.
5. `TextFallbackPanel.jsx`: chat list, ghost bubble, input.
6. `thresholds.js`: config and `evaluateNetwork`.
7. `useNetworkStats.js`: polling, parsing, simulator override, hysteresis.

Note: the screenshot shows a top level `components/` folder as well as `client/`. Confirm with the owner which folder the call components go in before phase 2. Default to what the spec says unless told otherwise.

## 6. Decisions and assumptions made so far

* "First phase" was interpreted as the setup step (4:30 to 5:15 PM): mock hook plus test page reaching CONNECTED, because the provided tests target exactly that.
* The mock always connects locally after 1500 ms with no remote peer. This doubles as the `?demo=true` behaviour. The mock does not read the URL.
* The mock's `startCall` stores `incomingCall` only when an intent object is passed. For plain outgoing calls `incomingCall` stays null.
* `sendTextFallback` ignores empty or whitespace only text and trims the text before storing. Sender is `myNumber`.
* `setFallbackMode` releases PTT when leaving PTT mode, so the mic never stays open.
* `endActiveCall` resets: callState to IDLE, incomingCall to null, networkMode to FULL_AUDIO, both PTT flags to false, chatMessages to empty, remoteTypingText to empty, and clears all timers.
* Remote PTT simulation lasts 3000 ms. Partner typing simulation reveals one character every 60 ms, then clears the ghost text and pushes the final message.

Phase 3 decisions:

* Parser lives in `statsParser.js` (pure, no React) so it can be tested without a browser. The hook file only handles polling.
* `useNetworkStats({ peerConnectionRef, networkMode })` returns `{ telemetry: { packetLoss, jitter, rtt }, source }`. `source` is `"fake"` (ref null, numbers are the preset for the current `networkMode`), `"connecting"` (connection exists but no inbound audio report, zeros) or `"live"`.
* With a null ref the HUD shows the preset numbers for the current mode, so the HUD never contradicts the mode (spec section 11, fix 3).
* Phase 3 only reads and displays. It does not call `setFallbackMode`. Edge triggered auto switching, hysteresis and the override come in phases 4 and 8.
* Pill colour, icon and label come from `networkMode`, not from the numbers.
* A failed `getStats()` poll is swallowed and retried next tick. Packet loss returns 0 when there is no previous sample, when the total delta is 0, or when counters go backwards.
* Icons are inline SVG, so no icon library is needed.
* Candidate pair is chosen when `selected` is true, or when `nominated` is true and `state` is succeeded.

Phase 4 decisions:

* `useNetworkStats` now returns `{ telemetry, source, setOverride, isOverridden, evaluatedLevel }`. An override wins over real stats and skips hysteresis. `evaluatedLevel` is null for `"fake"` and `"connecting"`, so preset numbers never trigger a switch.
* Edge trigger lives in `ActiveCallView`. Baseline is the last evaluated level, or the current `networkMode` if there is none. When `evaluatedLevel` goes null the last level is forgotten. Result: Normal while already in FULL_AUDIO does nothing, and each real change calls `setFallbackMode` once.
* The override lives in hook state, so it is cleared automatically when ActiveCallView unmounts at call end.
* Real stats also use `evaluatedLevel` now, but without hysteresis. Hysteresis is phase 8.
* The mode change toast was already built in phase 2. Phase 4 only adds tests for it.

Open questions for the team (from the spec, still unanswered):

1. Who renders `<audio id="remoteAudio" autoPlay />`? Assumed ActiveCallView.
2. Does the real `endActiveCall` reset `remoteTypingText`, PTT status and mode?
3. Is the contract frozen after the typing additions?
4. Does the real hook support `?demo=true`?
5. Should the 7:30 AM code freeze move later, since the event ends at 4 PM?
6. Is the real `peerConnectionRef.current` always set once CONNECTED?

## 7. Frozen contract: what `useWebRTC()` returns

State:

* `myNumber`: string.
* `callState`: IDLE, CALLING, RINGING or CONNECTED.
* `incomingCall`: null, or an object with `from`, `intentTag` (for example "Urgent, Please Pick Up"), `priority` (HIGH, MEDIUM, LOW), `note`, `callerTime`, `callerTz`. Stays populated during the call, reset to null when the call ends.
* `networkMode`: FULL_AUDIO, PTT or TEXT. Synced across both browsers.
* `isPTTTalking`: true while I hold the button.
* `isRemotePTTTalking`: true while the partner holds theirs.
* `chatMessages`: array of `{ sender, text, time }`.
* `remoteTypingText`: partner's live draft string, empty when not typing.
* `peerConnectionRef`: a ref. Read `peerConnectionRef.current.getStats()`. Null in the mock.

Actions:

* `startCall(targetNumber, intentObject)`, `answerIncomingCall()`, `endActiveCall()`, `registerNumber(number)`.
* `setFallbackMode(mode)`: sets local mode, mutes or unmutes the mic, sends MODE_SWITCH to the partner.
* `setPTTActive(boolean)`: toggles the mic track, sends PTT_STATUS.
* `sendTextFallback(text)`: appends locally with a timestamp and sends as CHAT.
* `sendLiveTyping(draftString)`: sends LIVE_TYPING with the full draft. Partner side sets `remoteTypingText`, cleared when the final CHAT arrives.

`telemetry` is NOT returned by the hook. I compute it myself from `getStats()`.

Mock only helpers (not in the real hook): `simulateIncomingCall`, `__simulatePartnerPTT`, `__simulatePartnerTyping(fullText)`.

## 8. Mock hook behaviour summary (for tests)

* Constants: my number `+61 480 000 111`, partner number `+61 480 000 222`.
* `startCall`: only from IDLE. Sets CALLING, then CONNECTED after 1500 ms.
* `simulateIncomingCall`: only from IDLE. Sets RINGING with a populated `incomingCall` (from partner, tag "Urgent, Please Pick Up", priority HIGH).
* `answerIncomingCall`: RINGING to CONNECTED immediately.
* `__simulatePartnerPTT`: `isRemotePTTTalking` true, then false after 3000 ms.
* `__simulatePartnerTyping`: described in section 6.
* `sendLiveTyping`: no op in the mock.

## 9. Next phase brief: Phase 5, Push to Talk

Goal: a working walkie talkie control in PTT mode.

Do:

1. New `components/call/PTTControl.jsx`: large circular "Hold to talk" button. Mouse down and up, touch start and end with preventDefault. Mouse leave and window blur release PTT. Calls `setPTTActive(boolean)`.
2. Spacebar: window level keydown and keyup on `e.code === "Space"`, only when `networkMode === "PTT"`, ignored if an input or textarea is focused, ignore `e.repeat`, prevent scroll.
3. States: idle, talking (pulsing ring, "You are talking"), "Partner is talking" when `isRemotePTTTalking`. Release PTT when leaving PTT mode.
4. Replace the "walkie talkie button goes here" placeholder in `ActiveCallView.jsx`.
5. Tests for mouse, touch, spacebar, input focus ignore, blur release, mode change release.

Definition of done: tests pass, section 4 marked DONE, sections 5, 6, 9 and 11 updated. Tell the owner how to test it and wait.

## 10. Reference specs for later phases

Design system:

* Page background slate 950, cards slate 900 with slate 800 border, text white, secondary text slate 400.
* Brand accent indigo 500 and violet 600.
* Status colours: optimal emerald 500, degraded (PTT) amber 500, critical (TEXT) rose 500.
* Large readable text, never colour alone (icon plus text label too), works at phone width, tap targets at least 56 px, visible focus states, polite screen reader announcements for status changes.

Thresholds (locked by the lead), evaluate critical first:

```js
export function evaluateNetwork({ packetLoss, jitter, rtt }) {
  if (packetLoss >= 25 || jitter >= 300 || rtt >= 500) return "TEXT";
  if (packetLoss >= 10 || jitter >= 120 || rtt >= 250) return "PTT";
  return "FULL_AUDIO";
}
```

Stats polling and parsing:

* One second interval calling `peerConnectionRef.current.getStats()`. If the ref or its current value is null, skip real polling and show idle or simulated values. Clear the interval on unmount and call end.
* Jitter: from the inbound RTP report with kind audio, seconds times 1000 for ms.
* Packet loss percent: delta between polls, lost delta divided by (lost delta plus received delta) times 100, guard against division by zero. Keep the previous sample in a ref.
* RTT: from the selected (nominated, succeeded) candidate pair, `currentRoundTripTime` seconds times 1000.
* No inbound audio report yet: show zeros or a "Connecting" label, never crash.

Hysteresis for real stats only: downgrade after 3 bad polls in a row, upgrade only after 5 good polls in a row. Simulated values skip hysteresis.

Automatic switching is edge triggered: call `setFallbackMode` only when the evaluated level changes from the last evaluated level, not every tick where it differs from `networkMode`. HUD pill colour is driven by `networkMode`.

Network simulator presets:

1. Normal: loss 0.5, jitter 15, RTT 50, result FULL_AUDIO.
2. Edge Roaming: loss 18, jitter 160, RTT 200, result PTT.
3. Critical Drop: loss 42, jitter 450, RTT 650, result TEXT.

Clicking sets an override in the stats hook so the real evaluator runs. While active, real stats are ignored on this laptop, a visible "Simulation active" label shows, and a "Return to live stats" control clears it. Bar is collapsible, floats at the bottom, shown on both laptops.

Ping pong bug fix (all three): edge triggered evaluation; ignore real stats while an override is active and treat a remote mode as authoritative until local stats change; if the mode was set remotely, show that mode's preset numbers so the HUD never contradicts the mode.

Push to Talk:

* Large circular button with "Hold to talk". Mouse down and up, touch start and end with preventDefault. Mouse leave and window blur release PTT.
* Spacebar: window level keydown and keyup on `e.code === "Space"`, only when `networkMode === "PTT"`, ignored if an input or textarea is focused, ignore `e.repeat`, prevent page scroll.
* States: idle, talking (pulsing ring, "You are talking"), "Partner is talking" when `isRemotePTTTalking`. Disabled and hidden in other modes. Release PTT when leaving PTT.

Live text:

* Message list from `chatMessages`, mine right aligned indigo, partner left aligned slate, each with time.
* Ghost bubble when `remoteTypingText` is not empty: faded, pulsing caret, "Partner is typing" plus the draft.
* Controlled input, send button, Enter to send. On every change call `sendLiveTyping(fullDraft)`, always the whole draft. On send, ignore empty trimmed drafts, else `sendTextFallback(draft)` and clear the draft. Stop key events in the input from reaching the window spacebar handler. Auto scroll on `chatMessages` or `remoteTypingText` change. Keep the draft across mode switches.

Edge cases to cover: no inbound audio report, division by zero, mouse released outside the button, window blur while holding Space, mode change while PTT held or typing, both users typing, whitespace messages, long pasted text, mobile autocorrect, call end clears intervals, overrides, drafts and PTT, `remoteTypingText` after call end.

Test checklist before code freeze: HUD colour, icon, label and numbers for all three levels; simulator changes mode on both laptops; no ping pong; real stats sensible on Wi Fi and hotspot; PTT with mouse, touch and spacebar; spacebar ignored while typing; TEXT mode ghost bubble and empty draft; end call resets everything and a second call works; works over HTTPS; no console errors; phone width usable; `?demo=true` works with no network.

Demo script (about 30 seconds): after accept, "Calls fail when the network gets worse. Echo keeps the call alive." Show green HUD. Click Edge Roaming: amber, switches to PTT on both laptops, hold and speak, partner sees "Partner is talking". Click Critical Drop: red, switches to live text, type and show characters streaming, press Enter. Say "The call never dropped. Same connection, same data channel, only the mode changed."

## 11. Change log

* Phase 1 complete: created `hooks/useWebRTC.mock.js` and `app/calltest/page.jsx` to satisfy the provided tests. Created this `context.md`. Tests not yet executed by the assistant. Validation to do on the owner's machine: run `npx vitest run`.

* Phase 2 complete (recorded by owner): ActiveCallView shell, tests, empty NetworkSimulator.
* Phase 3 complete: added `thresholds.js`, `statsParser.js`, `useNetworkStats.js`, `TelemetryHUD.jsx` and three test files in `components/call/`. ActiveCallView needs a small edit to show the HUD (replace the telemetry placeholder). Validated: the pure logic (thresholds and parser) was run in plain node and passed. Vitest and React tests were NOT run by me. Owner to run `npx vitest run`.

* Phase 4 complete: changed `useNetworkStats.js`, `NetworkSimulator.jsx`, `ActiveCallView.jsx`, `TelemetryHUD.jsx`; added three test files in `components/call/`. Vitest NOT run by me. Owner to run `npx vitest run`.

(Add one line per phase: what changed, files touched, how it was validated.)

## 12. Starter prompt for a new LLM session

Paste this file, then paste:

"You are continuing the Cooee Echo build for Akhila. Read context.md fully. Do the next phase listed in section 9 and nothing more. Follow the working agreement in section 0. When finished, update sections 4, 5, 6, 9 and 11 of context.md and show me the full updated file plus every new or changed code file. If you need a decision, ask one short question."

Also attach `cooee.md` (the full spec) when available, and the current contents of any files listed in section 5 if the new session cannot see the repo.
