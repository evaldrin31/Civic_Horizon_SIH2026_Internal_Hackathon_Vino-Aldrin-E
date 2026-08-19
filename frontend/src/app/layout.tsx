import type { Metadata } from "next";
import "./globals.css";
import { AppLayout } from "@/components/layout";
import { LenisProvider } from "@/components/lenis-provider";
import { CursorGlow } from "@/components/cursor-glow";

import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Civic Horizon",
  description: "Accessibility Intelligence Platform. Built for SIH 2026.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <LenisProvider>
            <CursorGlow />
            <AppLayout>
              {children}
            </AppLayout>
          </LenisProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
