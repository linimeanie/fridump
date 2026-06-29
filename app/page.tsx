import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-10 p-6">
      <div className="text-center space-y-5 max-w-md">
        <span className="inline-block rounded-full bg-sunny px-4 py-1.5 text-sm font-bold text-on-sunny shadow-soft">
          ✨ It&apos;s almost Friday, so it is time to talk ☕
        </span>
        <h1 className="text-5xl sm:text-6xl font-extrabold text-ink">
          Fridump <span className="inline-block">🎉</span>
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
