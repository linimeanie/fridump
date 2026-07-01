import Link from "next/link";
import Logo from "@/components/Logo";

export default function Home() {
  return (
    <main className="relative flex flex-col items-center justify-center min-h-screen gap-10 p-6 overflow-hidden">
      {/* DTM brand glow */}
      <div
        aria-hidden="true"
        className="dtm-hero-glow pointer-events-none absolute inset-0 -z-10"
      />

      <div className="relative text-center space-y-5 max-w-md">
        <span className="inline-block rounded-full bg-primary-container border border-primary/30 px-4 py-1.5 text-sm font-bold text-on-primary-container">
          time to talk ☕
        </span>
        <h1 className="flex justify-center py-1">
          <Logo size="lg" />
        </h1>
        <p className="text-muted text-lg font-medium">
          Anonymous weekly retrospectives that actually feel good.
        </p>
      </div>

      <div className="flex w-full max-w-xs">
        <Link
          href="/submit"
          className="btn-chunky shadow-glow w-full px-8 py-4 rounded-full bg-primary text-on-primary font-bold text-lg text-center"
        >
          Submit my answers
        </Link>
      </div>

      <p className="text-muted text-sm font-medium">
        Organiser?{" "}
        <Link
          href="/admin"
          className="font-bold text-primary underline-offset-4 hover:underline"
        >
          Go to admin
        </Link>
      </p>
    </main>
  );
}
