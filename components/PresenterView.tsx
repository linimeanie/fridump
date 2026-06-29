"use client";

import { useEffect, useState } from "react";
import EmojiReveal from "@/components/EmojiReveal";
import { SessionResults } from "@/lib/types";

interface Props {
  token: string | null;
}

type Stage =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; results: SessionResults; step: number };

// step 0 = intro, steps 1..N = question reveals, step N+1 = free text
export default function PresenterView({ token }: Props) {
  const [stage, setStage] = useState<Stage>({ kind: "loading" });

  useEffect(() => {
    if (!token) {
      setStage({ kind: "error", message: "No presenter token in the URL." });
      return;
    }
    fetch(`/api/results?token=${encodeURIComponent(token)}`)
      .then((r) => r.json())
      .then((data: SessionResults & { error?: string }) => {
        if (data.error) throw new Error(data.error);
        setStage({ kind: "ready", results: data, step: 0 });
      })
      .catch((e: Error) =>
        setStage({ kind: "error", message: e.message })
      );
  }, [token]);

  if (stage.kind === "loading") {
    return (
      <FullScreen>
        <p className="text-[var(--muted)] animate-pulse text-xl">Loading results…</p>
      </FullScreen>
    );
  }

  if (stage.kind === "error") {
    return (
      <FullScreen>
        <p className="text-4xl">⚠️</p>
        <p className="text-xl font-semibold">Couldn&apos;t load results</p>
        <p className="text-[var(--muted)]">{stage.message}</p>
        {!token && (
          <p className="text-sm text-[var(--muted)] mt-2">
            Open this page with <code className="bg-[var(--card)] px-1 rounded">?token=YOUR_TOKEN</code>
          </p>
        )}
      </FullScreen>
    );
  }

  const { results, step } = stage;
  const { question_results, public_texts, total_submissions, session } = results;
  const totalSteps = question_results.length + 1; // +1 for free text screen

  function next() {
    if (stage.kind !== "ready") return;
    setStage((prev) =>
      prev.kind === "ready" ? { ...prev, step: prev.step + 1 } : prev
    );
  }

  // ── Intro screen ──
  if (step === 0) {
    return (
      <FullScreen>
        <p className="text-[var(--muted)] text-sm uppercase tracking-widest font-medium">
          {session.week_label}
        </p>
        <h1 className="text-5xl font-bold">Friday Retro 🎉</h1>
        <p className="text-[var(--muted)] text-xl">
          {total_submissions} {total_submissions === 1 ? "response" : "responses"} this week
        </p>
        <button
          onClick={next}
          className="mt-8 px-10 py-4 rounded-2xl bg-[var(--accent)] text-white font-semibold text-xl hover:opacity-90 transition"
        >
          Let&apos;s go →
        </button>
      </FullScreen>
    );
  }

  // ── Question reveal screens (steps 1 … N) ──
  if (step <= question_results.length) {
    const qr = question_results[step - 1];
    const isLast = step === totalSteps;
    return (
      <FullScreen>
        <p className="text-[var(--muted)] text-sm uppercase tracking-widest font-medium">
          Question {step} of {question_results.length}
        </p>
        <h2 className="text-3xl font-bold text-center max-w-xl">
          {qr.question.label}
        </h2>
        <EmojiReveal average={qr.average} count={qr.scores.length} />
        <button
          onClick={next}
          className="mt-10 px-10 py-4 rounded-2xl bg-[var(--accent)] text-white font-semibold text-xl hover:opacity-90 transition"
        >
          {isLast ? "See what's on their chests →" : "Next question →"}
        </button>
      </FullScreen>
    );
  }

  // ── Free text screen ──
  return (
    <FullScreen scroll>
      <p className="text-[var(--muted)] text-sm uppercase tracking-widest font-medium">
        What&apos;s on their chests
      </p>
      <h2 className="text-3xl font-bold">Shared thoughts</h2>
      {public_texts.length === 0 ? (
        <p className="text-[var(--muted)] text-xl mt-4">
          Nobody opted to share publicly this week.
        </p>
      ) : (
        <div className="w-full max-w-2xl space-y-4 mt-4">
          {public_texts.map((text, i) => (
            <div
              key={i}
              className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 text-lg leading-relaxed"
            >
              &ldquo;{text}&rdquo;
            </div>
          ))}
        </div>
      )}
      <p className="text-[var(--muted)] text-sm mt-8">
        That&apos;s a wrap for {session.week_label} 🎉
      </p>
    </FullScreen>
  );
}

function FullScreen({
  children,
  scroll,
}: {
  children: React.ReactNode;
  scroll?: boolean;
}) {
  return (
    <main
      className={`flex flex-col items-center justify-center gap-6 px-8 py-16 min-h-screen ${
        scroll ? "justify-start pt-24" : ""
      }`}
    >
      {children}
    </main>
  );
}
