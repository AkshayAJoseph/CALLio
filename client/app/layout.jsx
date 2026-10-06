import "./globals.css";

export const metadata = {
  title: "Cooee Echo",
  description: "WebRTC + WebSockets App",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        {children}
      </body>
    </html>
  );
}
