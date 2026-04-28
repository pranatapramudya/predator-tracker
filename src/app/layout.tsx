import { ClerkProvider } from "@clerk/nextjs";
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
    <ClerkProvider>
      {/* 🔥 INI JURUS KEBALNYA BRE! Wajib ada biar Phantom/Metamask ga bikin error 🔥 */}
      <html lang="en" suppressHydrationWarning>
        <body className="antialiased" suppressHydrationWarning>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
