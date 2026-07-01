import type { Metadata } from "next";
import Link from "next/link";
import { Onest, Space_Mono, Chakra_Petch } from "next/font/google";
import Logo from "@/components/Logo";
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

// Cyberpunk display face for the Fridump logo wordmark
const chakra = Chakra_Petch({
  subsets: ["latin"],
  weight: ["600", "700"],
  style: ["normal", "italic"],
  variable: "--font-logo",
});

export const metadata: Metadata = {
  title: "Fridump — Team Retro",
  description: "Anonymous weekly retrospective for your team",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${onest.variable} ${spaceMono.variable} ${chakra.variable} h-full`}
    >
      <body className="min-h-full bg-[var(--background)] text-[var(--foreground)] antialiased">
        <Link
          href="/"
          aria-label="Fridump home"
          className="lift fixed top-4 left-4 z-50 rounded-2xl bg-surface-bright/80 backdrop-blur border border-outline shadow-soft px-3 py-2"
        >
          <Logo size="sm" />
        </Link>
        {children}
      </body>
    </html>
  );
}
