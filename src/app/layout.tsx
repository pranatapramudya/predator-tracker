// src/app/layout.tsx
import "./globals.css";

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
      <body className="antialiased" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
