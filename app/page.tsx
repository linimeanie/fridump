import Link from "next/link";

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen gap-8 p-8">
      <div className="text-center space-y-3">
        <h1 className="text-5xl font-bold tracking-tight">Fridays 🎉</h1>
        <p className="text-[var(--muted)] text-lg max-w-md">
          Anonymous weekly retrospectives for your team.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-4">
        <Link
          href="/submit"
          className="px-8 py-4 rounded-2xl bg-[var(--accent)] text-white font-semibold text-lg hover:opacity-90 transition text-center"
        >
          Submit my answers
        </Link>
        <Link
          href="/present"
          className="px-8 py-4 rounded-2xl bg-[var(--card)] border border-[var(--card-border)] text-[var(--foreground)] font-semibold text-lg hover:border-[var(--accent)] transition text-center"
        >
          Presenter view
        </Link>
      </div>

      <p className="text-[var(--muted)] text-sm">
        Organiser?{" "}
        <Link href="/admin" className="underline hover:text-[var(--accent)] transition">
          Go to admin
        </Link>
      </p>
    </main>
  );
}
