"use client";
import { useWebRTC } from "../../hooks/useWebRTC.mock";

const intent = {
  intentTag: "Urgent, Please Pick Up",
  priority: "HIGH",
  note: "Test call",
  callerTime: "18:30",
  callerTz: "Asia/Kolkata",
};

export default function CallTest() {
  // Call the hook ONCE here and pass values down later, because each call of the mock has its own state.
  const rtc = useWebRTC();
  const box = { padding: 24, background: "#020617", color: "white", minHeight: "100vh", fontFamily: "sans serif" };
  const btn = { margin: 6, padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer" };

  return (
    <div style={box}>
      <h1>Call test page</h1>
      <p>callState: {rtc.callState} | networkMode: {rtc.networkMode}</p>

      <button style={btn} onClick={() => rtc.startCall("+61 480 111 222", intent)}>Start fake call</button>
      <button style={btn} onClick={() => rtc.simulateIncomingCall()}>Simulate incoming</button>
      <button style={btn} onClick={rtc.answerIncomingCall}>Answer</button>
      <button style={btn} onClick={rtc.endActiveCall}>End call</button>

      {rtc.callState === "CONNECTED" && (
        <div style={{ marginTop: 24 }}>
          <h2>CONNECTED (ActiveCallView goes here)</h2>
          <button style={btn} onClick={() => rtc.setFallbackMode("FULL_AUDIO")}>FULL_AUDIO</button>
          <button style={btn} onClick={() => rtc.setFallbackMode("PTT")}>PTT</button>
          <button style={btn} onClick={() => rtc.setFallbackMode("TEXT")}>TEXT</button>
          <button style={btn} onClick={() => rtc.__simulatePartnerTyping("Can you hear me?")}>Partner types</button>
          <button style={btn} onClick={rtc.__simulatePartnerPTT}>Partner PTT</button>
        </div>
      )}
    </div>
  );
}