import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "TokenGuard — Token Theft Detection & Prevention System",
  description: "Detect suspicious authentication activity, identify potentially compromised sessions, and automatically protect user accounts with real-time risk scoring and token rotation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-[#060913] text-slate-100 selection:bg-cyan-500/30 selection:text-cyan-200">
        {children}
      </body>
    </html>
  );
}
