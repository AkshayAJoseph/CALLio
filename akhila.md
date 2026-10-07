# Cooee Echo — Pillar 2: Adaptive Fallback & Network Telemetry
**Owner:** Akhila Sunesh | **Team:** 4A-Battery

---

## 1. Executive Summary & Core Objective

Standard VoIP calls frequently drop abruptly when users enter low-connectivity environments (cell tower handoffs, elevators, fringe roaming coverage, or congested Wi-Fi).

**Pillar 2 (My Area of Ownership)** keeps WebRTC voice sessions continuously alive through dynamic, graceful degradation without ever tearing down the active peer connection or data channel.

```
       [ Optimal Network ]  ───►  Full Duplex Audio (Opus 12kbps)
               │ (loss ≥ 10% / jitter ≥ 120ms / rtt ≥ 250ms)
               ▼
       [ Degraded Network ] ───►  Push-to-Talk (PTT) Half-Duplex Control
               │ (loss ≥ 25% / jitter ≥ 300ms / rtt ≥ 500ms)
               ▼
       [ Critical Network ] ───►  Live Text Fallback + Real-time Ghost Typing
```

---

## 2. In-Depth Telemetric Analysis & Mathematical Modeling

The network telemetry engine evaluates connection quality using three fundamental metrics parsed directly from native browser `RTCStatsReport` objects:

### 1. Packet Loss Rate ($\%$)
Packet loss directly deteriorates Opus audio quality, producing voice stuttering and clipping.
- **Delta-Based Formulation:** Rather than using cumulative counters which distort metrics over long calls, loss is calculated as a windowed differential between consecutive 1-second ticks:
  $$\Delta \text{Packets Lost} = \text{Lost}_{t} - \text{Lost}_{t-1}$$
  $$\Delta \text{Packets Received} = \text{Received}_{t} - \text{Received}_{t-1}$$
  $$\text{Loss Rate (\%)} = \begin{cases} 
  0, & \text{if } (\Delta \text{Lost} + \Delta \text{Received}) \le 0 \text{ or counters reset} \\
  \left( \frac{\Delta \text{Lost}}{\Delta \text{Lost} + \Delta \text{Received}} \right) \times 100, & \text{otherwise}
  \end{cases}$$

### 2. Packet Jitter ($\text{ms}$)
Jitter measures statistical variance in packet arrival time across the RTP stream. High jitter causes buffer under-runs and robotic audio artifacts.
- Parsed from `inbound-rtp` (media kind `audio`):
  $$\text{Jitter (ms)} = \text{stat.jitter} \times 1000$$

### 3. Round-Trip Time / RTT ($\text{ms}$)
RTT measures bidirectional latency between peers over ICE transport candidates. High RTT causes conversational overlap.
- Parsed from the active selected or nominated `candidate-pair`:
  $$\text{RTT (ms)} = \text{stat.currentRoundTripTime} \times 1000$$

---

## 3. How Telemetry Was Implemented in Current MVP

### 1. Threshold Evaluation Engine (`thresholds.js`)
Locked evaluation logic with critical-first prioritization:
```javascript
export function evaluateNetwork({ packetLoss, jitter, rtt }) {
  const t = THRESHOLDS.TEXT; // { packetLoss: 25, jitter: 300, rtt: 500 }
  const p = THRESHOLDS.PTT;  // { packetLoss: 10, jitter: 120, rtt: 250 }
  
  if (packetLoss >= t.packetLoss || jitter >= t.jitter || rtt >= t.rtt) return "TEXT";
  if (packetLoss >= p.packetLoss || jitter >= p.jitter || rtt >= p.rtt) return "PTT";
  return "FULL_AUDIO";
}
```

### 2. Pure Stats Parser (`statsParser.js`)
- Completely decoupled from React for zero-dependency testability.
- Robust against missing audio tracks, pending ICE gathering states, and counter resets.

### 3. Hysteresis & Edge-Triggered Polling (`useNetworkStats.js`)
- **1,000ms Polling Loop:** Queries `peerConnectionRef.current.getStats()`.
- **Hysteresis Smoothing:** Eliminates ping-pong mode switching due to transient network spikes:
  - **Downgrade:** Requires **3 consecutive degraded polls** before stepping down (`FULL_AUDIO` $\rightarrow$ `PTT` $\rightarrow$ `TEXT`).
  - **Upgrade:** Requires **5 consecutive optimal polls** before stepping back up.
- **Simulator Override Layer:** Injects simulated metrics (`NORMAL`, `EDGE_ROAMING`, `CRITICAL_DROP`) that intentionally bypass hysteresis for instant feedback during presentations.

### 4. Telemetry HUD (`TelemetryHUD.jsx`)
- Displays live Jitter (ms), Packet Loss (%), and RTT (ms).
- Renders accessible status pills with triple visual encoding:
  - **Optimal (Green):** Checkmark icon + `Network: Optimal`
  - **Degraded (Amber):** Warning triangle + `Network: Degraded`
  - **Critical (Rose):** Cross icon + `Network: Critical`

---

## 4. Production Scope & Scalability Roadmap

For deployment across enterprise telecommunications and production mobile apps, the telemetry architecture expands into the following capabilities:

```
[ Client WebRTC Engine ] ──► [ Edge Telemetry Aggregator ] ──► [ AI Codec Adaptation ]
           │                                                               │
           ▼                                                               ▼
 [ Bandwidth Estimator (BWE) ]                                  [ Automated QoS Logging ]
```

### 1. WebRTC In-Band Bandwidth Estimation (Google Congestion Control / GCC)
- In production, telemetry will incorporate transport-wide sequence numbers (`transport-cc`) and Receiver Estimated Maximum Bitrate (REMB) alongside packet loss and jitter to predict imminent bandwidth drops *before* packet loss occurs.

### 2. Dynamic Adaptive Bitrate & Codec Negotiation
- Rather than only switching UI modes, telemetry feedback will dynamically reconfigure the active SDP audio bitrate:
  - **Optimal (4G/5G/Fiber):** Opus Fullband (48kHz @ 32–64kbps).
  - **Degraded (3G/EDGE):** Opus Narrowband (8kHz @ 6–12kbps with in-band FEC enabled).
  - **Critical (2G/Satellite):** Redundant DataChannel transport with compression.

### 3. Server-Side Call Quality Intelligence (CQI)
- Push client-side telemetry samples over WebSocket to an observability backend (ClickHouse / Prometheus).
- Real-time Mean Opinion Score (MOS) computation ($R$-factor calculation):
  $$R = R_0 - I_s - I_d - I_{e\text{-eff}} + A$$
  $$\text{MOS} = 1 + 0.035R + R(R - 60)(100 - R) \times 7 \times 10^{-6}$$

### 4. Background Web Worker Polling
- Offload stats parsing to a dedicated Web Worker to maintain microsecond accuracy on resource-constrained mobile hardware during heavy UI animations.

---

## 5. System Implementation Overview

1. **PTT Half-Duplex Control (`PTTControl.jsx`)**
   - Multi-input support: Mouse clicks, native touch events (`passive: false` preventing scroll), and physical keyboard `Spacebar`.
   - Text input shielding: Ignores Spacebar when inputs/textareas are focused.
   - Live partner talking indicator (`isRemotePTTTalking`).

2. **Live Ghost Typing Fallback (`TextFallbackPanel.jsx`)**
   - Streams character-by-character live keystrokes over `RTCDataChannel` before the user presses Enter.
   - Retains active user draft state across fallback mode switches.

3. **In-Call View Orchestration (`ActiveCallView.jsx`)**
   - Houses the connected call interface, active duration timer (`MM:SS`), mode-transition toast notifications (`aria-live="polite"`), and intent badges.

4. **Developer Network Simulator (`NetworkSimulator.jsx`)**
   - Collapsible bottom dock with instant presets for stage-safe live presentations.

---

## 6. Test Suite & Verification Matrix

The implementation is verified with **14 automated test suites and 79 unit tests** passing with $100\%$ success rate:

| Test Suite | Purpose / Coverage | Result |
|---|---|---|
| `thresholds.test.js` | Boundary conditions and threshold evaluations | Passed |
| `useNetworkStats.test.jsx` | Polling lifecycle, null ref guards, unmount cleanup | Passed |
| `useNetworkStats.override.test.jsx` | Simulator override and reset mechanisms | Passed |
| `useNetworkStats.hysteresis.test.jsx` | 3-poll downgrade & 5-poll upgrade verification | Passed |
| `TelemetryHUD.test.jsx` | Label, icon, and stat rendering across all 3 modes | Passed |
| `PTTControl.test.jsx` | Mouse, touch, Spacebar handling and focus shielding | Passed |
| `TextFallbackPanel.test.jsx` | Chat rendering, draft preservation, typing events | Passed |
| `ActiveCallView.test.jsx` | In-call layouts, intent badges, audio element persistence | Passed |
| `ActiveCallView.simulator.test.jsx` | Edge-triggered switching and simulation label | Passed |
| `ActiveCallView.ptt.test.jsx` | PTT branch rendering and state synchronization | Passed |
| `ActiveCallView.text.test.jsx` | TEXT branch rendering and message history | Passed |
| `NetworkSimulator.test.jsx` | Preset injection and floating panel toggle | Passed |
| `useWebRTC.mock.test.jsx` | Mock contract adherence and timer cleanup | Passed |
| `app/calltest/page.test.jsx` | Complete call flow harness and mode transitions | Passed |

---

## 7. Live Demo Walkthrough Script (Presentation Guide)

**Target Duration:** ~45–60 seconds

### Setup
1. Have the WebRTC signaling server running: `node server.js` (port 4000).
2. Have the Next.js app running: `npm run dev` (port 3000).
3. Open two browser tabs side-by-side at `http://localhost:3000/dialer`.
4. Connect a call between the Sydney Core eSIM (`+61 480 000 111`) and London Gateway eSIM (`+44 770 000 222`).

---

### Step-by-Step Demonstration

#### Step 1: Normal Audio State (Optimal)
- **Action:** Show the connected call screen with green status pill: `Network: Optimal` (Jitter ~15ms, Loss ~0%).
- **Script:** *"Under normal conditions, Cooee Echo operates in Full Duplex Audio using low-bitrate Opus compression."*

#### Step 2: Simulate Moderate Network Degradation (PTT Mode)
- **Action:** Click **Edge Roaming** on the Dev Network Simulator dock.
- **Visual Feedback:**
  - Status pill turns amber: `Network: Degraded`.
  - Screen transitions smoothly to the **Push to Talk** walkie-talkie interface.
  - Toast appears: *"Network degraded. Switched to Push to Talk. Call kept alive."*
- **Action:** Press and hold the **Spacebar** or click the circular button $\rightarrow$ button pulses with *"You are talking"*, and the remote tab reflects *"Partner is talking"*.
- **Script:** *"When jitter spikes or packets drop on poor cellular networks, Echo automatically falls back to Push-to-Talk half-duplex mode to save bandwidth while keeping the call connection open."*

#### Step 3: Simulate Severe Network Drop (Live Text Fallback)
- **Action:** Click **Critical Drop** on the Dev Network Simulator.
- **Visual Feedback:**
  - Status pill turns red: `Network: Critical`.
  - Mode switches to the **Live Text** panel.
  - Toast appears: *"Network critical. Switched to live text. Call kept alive."*
- **Action:** Begin typing in the message box on Tab 1 without pressing Enter.
- **Remote Feedback:** Tab 2 immediately displays the live ghost bubble showing character-by-character live streaming: *"Partner is typing..."*.
- **Action:** Press Enter to send the completed message.
- **Script:** *"If the connection drops to critical levels where voice packets can no longer pass, Echo immediately transitions into Live Text Fallback with real-time keystroke streaming over the active WebRTC data channel."*

#### Step 4: Network Recovery & Clean Teardown
- **Action:** Click **Return to live stats** or **Normal**.
- **Visual Feedback:** Status pill turns green (`Network: Optimal`) and the interface returns seamlessly to live audio.
- **Action:** Click **End Call** $\rightarrow$ verifies clean teardown of data channels, timers, streams, and state resets.
- **Script:** *"The call never disconnected, no redialing was required, and the session remained uninterrupted."*

---

## 8. File & Code Ownership

- `components/call/` & `client/components/call/`
  - `thresholds.js`
  - `statsParser.js`
  - `useNetworkStats.js`
  - `TelemetryHUD.jsx`
  - `NetworkSimulator.jsx`
  - `PTTControl.jsx`
  - `TextFallbackPanel.jsx`
  - `ActiveCallView.jsx`
- All 14 associated test suites in `components/call/` and `app/calltest/`
- Full integration into `client/app/dialer/page.tsx` and `client/app/dependent/page.tsx`
