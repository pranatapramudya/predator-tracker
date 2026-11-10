// src/app/layout.tsx
import type { Viewport } from "next";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata = {
  title: "Predator Tracker",
  description: "Whale Watching System",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className="font-sans antialiased selection:bg-emerald-500 selection:text-black"
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
