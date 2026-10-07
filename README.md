# CALLio

<img width="1600" height="639" alt="image" src="https://github.com/user-attachments/assets/608c6a31-2c28-4130-b1d1-6ebafd5006b6" />

## Abstract
CALLio (formally known as Cooee Echo) is a revolutionary real-time communication platform engineered by Team 4A Battery (Helldivers). Built to tackle the critical issue of dropped calls under severe network degradation, CALLio implements a proprietary **"Zero-Crash Fallback Illusion."** 

Unlike traditional VoIP apps that tear down and renegotiate connections when bandwidth drops, CALLio maintains a single, persistent WebRTC connection comprising **1 Audio Track** and **1 RTCDataChannel**. As network telemetry (Jitter, Packet Loss, RTT) worsens, the application seamlessly degrades the user experience through three distinct tiers: **Full Audio** -> **Push-to-Talk (PTT)** -> **Live Text**. The mic is dynamically enabled/disabled and communication is routed through the ultra-low-bandwidth DataChannel, ensuring that the call is never truly dropped.

In addition to its unmatched resilience, CALLio pioneers **Contextual Signaling**, allowing callers to attach urgency intents (e.g., "Urgent", "Casual") and their local timezone information before dialing, drastically reducing communication friction. The platform also champions accessibility with its **Zero-Config Dependent Portal**, featuring a trusted guardian auto-answer system designed specifically for elderly or dependent users.

All of this is powered by a lightweight, zero-database architecture utilizing an in-memory Node.js signaling server, making it lightning-fast, privacy-first, and highly scalable.

---

## Setup Instructions

### 1. Start the Signaling Server
1. Navigate to the `server/` directory:
   ```bash
   cd server
   ```
2. Install backend dependencies:
   ```bash
   npm install
   ```
3. Start the Node.js signaling server (runs on Port 4000 by default):
   ```bash
   npm start
   ```

### 2. Configure the Frontend
1. Open a new terminal and navigate to the `client/` directory:
   ```bash
   cd client
   ```
2. Install frontend dependencies:
   ```bash
   npm install
   ```
3. Create a `.env.local` file in the `client/` folder and configure your Signaling URL:
   ```env
   NEXT_PUBLIC_SIGNALING_SERVER=http://localhost:4000
   ```
   *(Note: To test between different devices over the internet, expose Port 4000 using Cloudflare Tunnels and paste the `https://...trycloudflare.com` URL here).*
4. Start the Next.js development server:
   ```bash
   npm run dev
   ```
5. Open your browser to [http://localhost:3000](http://localhost:3000).

---

## List of Dependencies

### Frontend (`/client`)
- **Framework:** Next.js 14.x (App Router), React 18.x
- **Styling:** Tailwind CSS, PostCSS, Autoprefixer
- **Real-Time Communication:** `socket.io-client`
- **UI Icons:** `lucide-react`
- **Linting & Code Quality:** ESLint

### Backend (`/server`)
- **Runtime Environment:** Node.js
- **Server Framework:** Express.js
- **WebSocket Engine:** `socket.io`
- **CORS Management:** `cors`

---

## Detailed System Architecture & Technical Specifications

### 1. Zero-Database & Resilient WebRTC Core (The "Zero-Crash Fallback Illusion")
The core philosophy of CALLio is that a call should **never** drop. To achieve this, the architecture deliberately avoids complex mid-call ICE restarts or stream renegotiations.

* **Signaling Server (`/server/server.js`):** 
  * Built on Node.js, Express, and Socket.IO.
  * **Zero Database Overhead:** Uses an in-memory `Map` (`phonebook = new Map()`) to instantly route WebRTC offers, answers, and ICE candidates by mapping Virtual Numbers (e.g., `+61 480 111 222`) directly to active `socket.id`s.
  * Handles custom events: `register`, `call-user`, `answer-call`, `ice-candidate`, and `end-call`.
* **WebRTC Connection Strategy (`useWebRTC.js`):** 
  * Establishes `RTCPeerConnection` utilizing Google STUN servers and **Metered.ca TURN servers** (with explicit TCP Fallback) to guarantee cross-network and strict NAT traversal.
  * Upon connection, it opens exactly **1 Audio Track** (`navigator.mediaDevices.getUserMedia`) and **1 RTCDataChannel** (`cooee-channel`).
* **The 3-Tier Seamless Degradation Model:**
  * **Tier 1: Normal Mode (Full Audio):** Operates on standard 4G/Wi-Fi. Continuous bidirectional audio stream (~48kbps Opus).
  * **Tier 2: Edge Roaming Mode (Push-to-Talk):** Triggered at ~20% packet loss or high jitter. The local microphone is instantly muted (`audioTrack.enabled = false`). Users must hold a "Walkie-Talkie" button or Spacebar to transmit (`setPTTActive(true)`), drastically saving bandwidth while maintaining the live connection.
  * **Tier 3: Critical Drop Mode (Live Text):** Triggered at <1kbps available bandwidth. Audio is completely suppressed. The UI shifts to a real-time chat interface, transmitting strings instantly over the open `RTCDataChannel`, ensuring the conversation survives even in absolute worst-case network conditions.

### 2. Adaptive Telemetry & Network Simulation
To power the automatic fallback tiers, CALLio constantly monitors its own connection health.

* **Live Network Telemetry HUD:**
  * A `setInterval` loop polls `peerConnection.getStats()` every 1000ms.
  * It parses the `inbound-rtp` dictionaries to extract live **Jitter (ms)**, **Packet Loss (%)**, and **Round Trip Time (RTT)**.
  * A technical status pill (Green/Yellow/Red) provides real-time visibility to the user.
* **Network Simulator Control Panel:**
  * A developer/judge-facing panel that artificially forces the WebRTC engine into specific tiers (Normal, Edge Roaming, Critical Drop) to dynamically demonstrate the "Zero-Crash" illusion without needing a Faraday cage.

### 3. Contextual Signaling & Smart Notifications
CALLio enriches the standard phone call with critical metadata *before* the receiver picks up.

* **Pre-Call Intent Picker:**
  * Callers tag their outgoing WebRTC offer with priority states: `Urgent (HIGH)`, `Casual (LOW)`, or `Work/Flight (MEDIUM)`.
  * Callers can attach a custom 40-character context note.
* **Automated Timezone Mapping:**
  * The frontend calculates the caller's exact timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) and attaches it to the payload, preventing accidental late-night wakeups.
* **Context-Aware Incoming Call UI:**
  * The receiver sees a full-screen modal displaying the Caller's Virtual Number, a color-coded Intent Badge (e.g., pulsing red for Urgent), and a timezone banner (e.g., *"Caller Local Time: 2:30 AM (Sydney)"*).
* **Native Browser Push Notifications:**
  * Uses the browser's native `Notification` API to alert users of incoming calls and their Intent Tags even when the CALLio tab is in the background.

### 4. Product Shell & Accessibility Portal
CALLio provides tailored interfaces depending on the technical proficiency of the user.

* **Cooee WebDialer Dashboard:**
  * The primary interface for standard users. Includes a Virtual SIM Switcher to seamlessly toggle between multiple numbers (e.g., `+61...` vs `+44...`), a sleek dial-pad, and quick-contact cards.
* **Zero-Config Dependent/Elderly Portal (`/dependent`):**
  * An ultra-simplified, high-contrast UI designed for tablets. Features giant fonts, zero complex settings, and massive photo-tiles for immediate family.
* **Trusted Auto-Answer Logic:**
  * A breakthrough accessibility feature for dependents. The app maintains a `trustedGuardians` array. If an incoming call originates from a trusted guardian, the UI displays a visual countdown banner (*"Auto-Answering Call from Guardian in 3... 2... 1..."*), and programmatically triggers `answerIncomingCall()` after 3000ms, ensuring critical check-ins never go unanswered.

---

## Integration Architecture (The Shared Contract)
To ensure zero-blocking parallel development during the hackathon, the frontend is strictly coupled to a shared hook interface (`useWebRTC`). 

Components interact via the following exposed state and actions:
* **State Variables:** `myNumber`, `callState` (IDLE, CALLING, RINGING, CONNECTED), `incomingCall` (contains intent, priority, timezone), `networkMode` (FULL_AUDIO, PTT, TEXT), `isPTTTalking`, `telemetry` (jitter, loss, rtt), and `chatMessages`.
* **Action Functions:** `registerNumber`, `startCall`, `answerIncomingCall`, `endActiveCall`, `setFallbackMode`, `setPTTActive`, and `sendTextFallback`.

---

## Team Execution & Work Split
* **Akshay Joseph (Backend & Core WebRTC Engine):** Lead on Node.js signaling, WebRTC track/DataChannel handshake, Metered.ca TURN configuration, and Render/Vercel cloud deployment.
* **Akhila Sunesh (Adaptive Fallback & Network Telemetry):** Lead on WebRTC stats parsing, Telemetry HUD, Network Simulator panel, PTT Walkie-Talkie controller, and Live Text UI.
* **Amrutha Ajish Achuthan (Contextual Signaling & Notifications):** Lead on Pre-call Intent tagging, timezone detection logic, incoming call context modal, and background Web Push Notifications.
* **Anjali Kizhakekuttu Thomas (Product Shell & Accessibility):** Lead on Cooee eSIM WebDialer UI, Zero-Config Elderly portal, auto-answer logic, and the final hackathon pitch deck & demo video.
