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
  const { question_results, public_texts, public_improvements, total_submissions, session } = results;
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
        <p className="font-mono text-muted text-xs uppercase tracking-widest">
          {session.week_label}
        </p>
        <h1 className="text-6xl font-extrabold text-ink">Fridump Retro 🎉</h1>
        <p className="text-[var(--muted)] text-xl">
          {total_submissions} {total_submissions === 1 ? "response" : "responses"} this week
        </p>
        <button
          onClick={next}
          className="mt-8 btn-chunky shadow-glow px-10 py-4 rounded-full bg-primary text-on-primary font-bold text-xl"
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
        <p className="font-mono text-muted text-xs uppercase tracking-widest">
          Question {step} of {question_results.length}
        </p>
        <h2 className="text-3xl sm:text-4xl font-extrabold text-center max-w-xl text-ink">
          {qr.question.label}
        </h2>
        <EmojiReveal
          median={qr.median}
          distribution={qr.distribution}
          count={qr.scores.length}
          scale={qr.scale}
        />
        <button
          onClick={next}
          className="mt-10 btn-chunky shadow-glow px-10 py-4 rounded-full bg-primary text-on-primary font-bold text-xl"
        >
          {isLast ? "See what they wrote →" : "Next question →"}
        </button>
      </FullScreen>
    );
  }

  // ── Free text screen ──
  const nothingShared =
    public_texts.length === 0 && public_improvements.length === 0;
  return (
    <FullScreen scroll>
      <p className="font-mono text-muted text-xs uppercase tracking-widest">
        In their own words
      </p>
      <h2 className="text-4xl font-extrabold text-ink">Shared thoughts</h2>

      {nothingShared ? (
        <p className="text-muted text-xl mt-4 font-medium">
          Nobody opted to share publicly this week.
        </p>
      ) : (
        <div className="w-full max-w-2xl space-y-8 mt-4">
          {public_texts.length > 0 && (
            <div className="space-y-4">
              <p className="text-lg font-bold text-ink text-left">
                What keeps them up at night 🌙
              </p>
              {public_texts.map((text, i) => (
                <div
                  key={i}
                  className="lift shadow-soft bg-surface-bright border-l-4 border-l-primary rounded-3xl p-6 text-lg leading-relaxed text-ink text-left"
                >
                  &ldquo;{text}&rdquo;
                </div>
              ))}
            </div>
          )}

          {public_improvements.length > 0 && (
            <div className="space-y-4">
              <p className="text-lg font-bold text-ink text-left">
                Most proud of this week 🏆
              </p>
              {public_improvements.map((text, i) => (
                <div
                  key={i}
                  className="lift shadow-soft bg-surface-bright border-l-4 border-l-peach-strong rounded-3xl p-6 text-lg leading-relaxed text-ink text-left"
                >
                  &ldquo;{text}&rdquo;
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <p className="text-muted text-sm mt-8 font-medium">
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
