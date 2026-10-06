# Cooee Echo: Pillar 1 Functional Documentation (Amrutha's Part)

This document provides a complete functional breakdown of every component, utility, hook, and button implemented in **Pillar 1 (Contextual Calling & Receiver Empathy)**.

---

## 1. Architecture Overview

Pillar 1 solves two core UX problems in modern calling:
1. **For Callers:** Providing context (why you are calling, urgency level, short note) and displaying local time awareness before placing a call.
2. **For Receivers:** Giving actionable context before answering (visual urgency badges, caller local time, late-night sleep warnings, synthesized ringtone, and background tab notifications).

---

## 2. Component & Button Breakdown

### A. `components/EnableAlertsButton.jsx`

Provides an accessible, one-click button for notification permissions and audio unlocking.

* **What it renders:**
  * If permission is already `granted` or browser doesn't support notifications: **Renders nothing** (invisible, no UI clutter).
  * If permission is `default` (unprompted): Renders `"Turn on call alerts"`.
  * If permission is `denied`: Renders `"Alerts blocked - allow notifications in browser settings"`.
* **Button Click Action:**
  * Calls `enableAlerts()`:
    1. Unlocks the Web Audio `AudioContext` via a user click gesture (required by Safari and mobile iOS to allow sound later).
    2. Requests browser notification permission (`Notification.requestPermission()`).
    3. Updates internal state to hide the button once granted.

---

### B. `components/IntentPicker.jsx`

The dialer's urgency and context configuration panel.

* **Urgency Radio Cards (3 Options):**
  1. **🚨 Urgent - Please Pick Up**
     * Priority: `HIGH`
     * Border: Red outline with soft red tint when active.
     * What clicking does: Sets selected intent to `Urgent`.
  2. **💼 Work / Flight Update**
     * Priority: `MEDIUM`
     * Border: Amber outline with soft amber tint when active.
     * What clicking does: Sets selected intent to `Work`.
  3. **☕ Casual - Catching Up**
     * Priority: `LOW`
     * Border: Sky blue outline with soft sky tint when active.
     * What clicking does: Sets selected intent to `Casual` (default).
  * *Accessibility feature:* Full keyboard navigable via arrow keys and Tab; includes visible focus rings.

* **Short Note Input Field:**
  * **Input box:** Lets the caller type an optional explanation (e.g., *"Flight delayed"*).
  * **Hard Limit:** `maxLength={40}` prevents typing past 40 characters.
  * **Live Character Counter:** Displays `{count}/40` in real-time, announcing character count politely to screen readers via `aria-live="polite"`.

* **Local Time Ticker:**
  * Automatically reads the user's local timezone (via `Intl.DateTimeFormat`) and displays their current time (e.g., `We will send your local time: 6:30 PM (Australia/Sydney)`), refreshed every 30 seconds.

* **"Call [number]" Button:**
  * **Disabled when:** The dialer is not in `IDLE` state, or when no target number is entered.
  * **What clicking does:**
    1. Builds the locked payload object:
       ```javascript
       {
         intentTag: "Urgent - Please Pick Up", // Full label string
         priority: "HIGH",
         note: "Flight delayed",
         callerTime: "18:30",
         callerTz: "Australia/Sydney"
       }
       ```
    2. Dispatches `onCall(payload)` to `startCall(targetNumber, payload)`.
    3. Changes application call state to `CALLING`.

---

### C. `components/IncomingCallModal.jsx`

The high-priority incoming call dialog that appears on the receiver's screen.

* **Gating Conditions:** Opens whenever `incomingCall !== null`, `callState !== "CONNECTED"`, and `suppress !== true`.
* **Visual Elements:**
  * **Caller Phone Number:** Large typography (e.g. `+61 480 111 222`).
  * **Intent Badge:** Color-coded chip with icon and full label (Red for Urgent, Amber for Work, Blue for Casual).
  * **Detached Pulsing Border:** If the call is `Urgent`, an absolute-positioned outer border pulses (`animate-pulse`). The inner text and buttons stay completely still for accessibility.
  * **Caller Note:** Displays the optional note in quotation marks.
  * **Timezone & Empathy Banner:** Shows the caller's local city and time (e.g., `🌏 Caller local time: 2:30 AM (Sydney)`).
  * **Late Night Chip:** If caller's time is before 07:00 or after 22:00, displays:
    `🌙 It is late at night for the caller`
* **Lifecycle Effects on Open:**
  * Plays synthetic Web Audio ringtone automatically.
  * Fires a desktop notification if the user has the browser tab minimized or hidden.
  * Automatically focuses the **Accept** button for immediate keyboard/Enter response.
* **Buttons:**
  1. **"Accept" Button:**
     * Triggers `onAccept()` (calls `answerIncomingCall()`).
     * Transitions `callState` to `CONNECTED`.
     * Immediately silences ringtone and closes the modal.
  2. **"Decline" Button:**
     * Triggers `onDecline()` (calls `endActiveCall()`).
     * Resets `callState` to `IDLE` and clears `incomingCall`.
     * Immediately silences ringtone and closes the modal.

---

### D. `utils/intents.js`

Centralized intent configuration and internationalization utilities.

| Function / Constant | Purpose |
|---------------------|---------|
| `INTENTS` | Configuration dictionary mapping `Urgent`, `Work`, and `Casual` with colors, badges, labels, and priorities. |
| `INTENT_LIST` | Ordered array `[Urgent, Work, Casual]` for predictable UI rendering. |
| `getIntent(tag, priority)` | Safe lookup fallback: checks full label -> short tag -> priority -> defaults to `Casual` (never crashes). |
| `formatTimeIn(tz)` | Formats current time in target IANA timezone (e.g., `"2:30 AM"`). |
| `hourIn(tz)` | Returns the 24-hour hour integer (0–23) in the target timezone. |
| `cityFromTz(tz)` | Extracts city name from IANA string (e.g., `"Australia/Sydney"` ➔ `"Sydney"`). |
| `isLateNight(tz)` | Returns `true` if current time in caller's timezone is `< 7` (before 7 AM) or `>= 22` (10 PM or later). |

---

### E. `utils/notifications.js`

Zero-dependency audio synthesis and browser notification service.

| Function | Purpose |
|----------|---------|
| `requestNotificationPermission()` | Asks browser for notification access safely without throwing exceptions. |
| `notifyIncomingCall(call)` | Emits desktop notification **only when tab is in background** (`document.hidden`). Clicking notification refocuses the tab (`window.focus()`). |
| `closeCallNotification()` | Closes any active desktop call notifications. |
| `startRingtone()` | Generates a 880Hz audio beep sequence every 1.5s using `AudioContext` oscillators (no MP3/WAV assets needed). |
| `stopRingtone()` | Stops audio intervals and oscillator output immediately. |
| `unlockAudio()` | Warms up `AudioContext` on user click to satisfy browser autoplay restrictions. |
| `enableAlerts()` | Composite function: simultaneously unlocks audio and requests notification permission. |

---

### F. `hooks/useWebRTC.mock.js`

Mock implementation of Akshay's WebRTC hook adhering strictly to the locked contract.

* **State Managed:**
  * `callState`: `"IDLE"` | `"CALLING"` | `"CONNECTED"`.
  * `incomingCall`: `null` or `{ from, intentTag, priority, note, callerTime, callerTz }`.
* **Actions Exported:**
  * `startCall(to, intent)`: Logs payload and sets `callState = "CALLING"`.
  * `answerIncomingCall()`: Clears `incomingCall` and sets `callState = "CONNECTED"`.
  * `endActiveCall()`: Resets `incomingCall = null` and `callState = "IDLE"`.
  * `__simulateIncoming(tag, tz)`: Dev-only helper to trigger incoming call scenarios.

---

### G. `app/amrutha-test/page.jsx`

Private test harness for validating Pillar 1 flows.

* **Top Controls:**
  * Call state indicator (`Call state: IDLE / CALLING / CONNECTED`).
  * `<EnableAlertsButton />`: To test permission flows.
  * Target number text input (defaults to `+61 480 111 222`).
* **Interactive Simulation Buttons:**
  1. **"Urgent in 3s":** Simulates incoming Urgent call after a 3-second delay (allowing you to switch tabs to test background notifications).
  2. **"Work in 3s":** Simulates incoming Work call after 3 seconds.
  3. **"Casual in 3s":** Simulates incoming Casual call after 3 seconds.
  4. **"Now (late-night test)":** Immediately fires an Urgent call configured with timezone `"Asia/Kolkata"` to verify the late-night moon chip (`🌙`).

---

## 3. Button Action Quick Reference

| Button Label | Location | Exact Action When Clicked |
|--------------|----------|---------------------------|
| **Turn on call alerts** | Header / Alert Button | Requests notification permission & unlocks browser audio context. |
| **Urgent Card** | IntentPicker | Selects Urgent priority (`HIGH`), turns card red with checkmark. |
| **Work Card** | IntentPicker | Selects Work priority (`MEDIUM`), turns card amber with checkmark. |
| **Casual Card** | IntentPicker | Selects Casual priority (`LOW`), turns card blue with checkmark. |
| **Call [number]** | IntentPicker | Builds locked intent payload, logs it, switches state to `CALLING`. |
| **Accept** | IncomingCallModal | Answers call, stops ringtone, sets state to `CONNECTED`, closes modal. |
| **Decline** | IncomingCallModal | Rejects call, stops ringtone, sets state to `IDLE`, closes modal. |
| **Urgent / Work / Casual in 3s** | Test Harness | Schedules mock incoming call in 3 seconds to test background notification. |
| **Now (late-night test)** | Test Harness | Immediately displays incoming call modal with late-night banner. |
