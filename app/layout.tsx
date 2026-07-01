import type { Metadata } from "next";
import Link from "next/link";
import { Onest, Space_Mono } from "next/font/google";
import "./globals.css";

const onest = Onest({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-onest",
});

const spaceMono = Space_Mono({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-space-mono",
});

export const metadata: Metadata = {
  title: "Fridump — Team Retro",
  description: "Anonymous weekly retrospective for your team",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${onest.variable} ${spaceMono.variable} h-full`}>
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)] antialiased">
        <Link
          href="/"
          aria-label="Fridump home"
          className="lift fixed top-4 left-4 z-50 flex items-center gap-2 rounded-full bg-surface-bright border border-outline shadow-soft pl-2 pr-4 py-2"
        >
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-base">
            ☕
          </span>
          <span className="font-mono font-bold text-ink tracking-tight">Fridump</span>
        </Link>
        {children}
      </body>
    </html>
  );
}
