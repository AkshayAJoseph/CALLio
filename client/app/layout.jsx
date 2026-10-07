import "./globals.css";
import { WebRTCProvider } from "../context/WebRTCContext";
import RemoteAudioPlayer from "../components/audio/RemoteAudioPlayer";

export const metadata = {
  title: "CALLio",
  description: "WebRTC + WebSockets App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <WebRTCProvider>
          <RemoteAudioPlayer />
          {children}
        </WebRTCProvider>
      </body>
    </html>
  );
}
