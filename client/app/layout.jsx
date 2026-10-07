import "./globals.css";
import { WebRTCProvider } from "../context/WebRTCContext";
import RemoteAudioPlayer from "../components/audio/RemoteAudioPlayer";

export const metadata = {
  title: "CALLiO | Adaptive Telecom & Emergency Network",
  description: "WebRTC Adaptive Push-to-Talk & Live Fallback System",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
    apple: "/favicon.svg",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
      </head>
      <body>
        <WebRTCProvider>
          <RemoteAudioPlayer />
          {children}
        </WebRTCProvider>
      </body>
    </html>
  );
}
