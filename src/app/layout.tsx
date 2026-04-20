import "./globals.css";
import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { ThemeProvider } from "@/components/theme-provider";
import { AppShell } from "@/components/app-shell";
import { AppToaster } from "@/components/app-toaster";

const plusJakarta = Plus_Jakarta_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Spotlight Studios — Dance Management",
  description: "Run your dance studio with clarity.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${plusJakarta.variable} font-sans antialiased`}>
        <ThemeProvider>
          <AppShell>{children}</AppShell>
          <AppToaster />
        </ThemeProvider>
      </body>
    </html>
  );
}
