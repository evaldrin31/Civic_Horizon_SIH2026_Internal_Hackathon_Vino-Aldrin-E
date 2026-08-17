import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Accessibility Intelligence Platform",
  description: "Discover evidence-backed accessibility information for venues across India",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
