import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "SIREN — Situational Intelligence & Response Enablement Network",
  description: "AI-powered 911 emergency response platform",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
