import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css"; // <-- INI KABEL POWERNYA BRE! Wajib ada!

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
      <html lang="en">
        <body className="antialiased">{children}</body>
      </html>
    </ClerkProvider>
  );
}
