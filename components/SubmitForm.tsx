"use client";

import { useState, useTransition } from "react";
import { EMOJI_SCALE, EmojiScore, Question } from "@/lib/types";

interface Props {
  session: {
    id: string;
    questions: Question[];
  };
}

const EMOJI_LABELS = ["Rough", "Meh", "Okay", "Good", "Great"];

export default function SubmitForm({ session }: Props) {
  const [scores, setScores] = useState<Record<string, EmojiScore>>({});
  const [chestText, setChestText] = useState("");
  const [chestPublic, setChestPublic] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const allAnswered = session.questions.every((q) => scores[q.id] !== undefined);

  function handleScore(questionId: string, score: EmojiScore) {
    setScores((prev) => ({ ...prev, [questionId]: score }));
  }

  function handleSubmit() {
    if (!allAnswered) return;
    setError(null);

    startTransition(async () => {
      try {
        const res = await fetch("/api/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            session_id: session.id,
            mood: scores["mood"],
            workload: scores["workload"],
            learning: scores["learning"],
            vibe: scores["vibe"],
            chest_text: chestText.trim() || undefined,
            chest_public: chestPublic,
          }),
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Something went wrong");
        setSubmitted(true);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : "Something went wrong");
      }
    });
  }

  if (submitted) {
    return (
      <div className="text-center space-y-4 py-16">
        <p className="text-6xl">🎉</p>
        <h2 className="text-2xl font-bold">You&apos;re in!</h2>
        <p className="text-[var(--muted)]">
          See you on Friday for the reveal.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {session.questions.map((q) => (
        <div
          key={q.id}
          className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 space-y-5"
        >
          <p className="font-semibold text-lg leading-snug">{q.label}</p>
          <div className="flex justify-between items-center gap-2">
            {EMOJI_SCALE.map((emoji, i) => {
              const score = (i + 1) as EmojiScore;
              const selected = scores[q.id] === score;
              return (
                <button
                  key={score}
                  type="button"
                  aria-label={`${EMOJI_LABELS[i]} (${score}/5)`}
                  aria-pressed={selected}
                  onClick={() => handleScore(q.id, score)}
                  className={`emoji-btn text-4xl sm:text-5xl p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] rounded-full ${
                    selected ? "selected" : "opacity-60 hover:opacity-100"
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between px-2">
            {EMOJI_LABELS.map((label) => (
              <span key={label} className="text-xs text-[var(--muted)] w-10 text-center">
                {label}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Free text */}
      <div className="bg-[var(--card)] border border-[var(--card-border)] rounded-2xl p-6 space-y-4">
        <p className="font-semibold text-lg">What&apos;s on your chest?</p>
        <textarea
          value={chestText}
          onChange={(e) => setChestText(e.target.value)}
          placeholder="Share anything — frustrations, wins, ideas… (optional)"
          rows={4}
          className="w-full bg-[var(--background)] border border-[var(--card-border)] rounded-xl p-4 text-[var(--foreground)] placeholder:text-[var(--muted)] resize-none focus:outline-none focus:ring-2 focus:ring-[var(--accent)] transition"
        />
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={chestPublic}
              onChange={(e) => setChestPublic(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-11 h-6 rounded-full transition-colors ${
                chestPublic ? "bg-[var(--accent)]" : "bg-[var(--card-border)]"
              }`}
            />
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                chestPublic ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
          <div>
            <p className="font-medium text-sm">Show my answer on screen during the session</p>
            <p className="text-xs text-[var(--muted)] mt-0.5">
              If off, your answer is stored privately and never shown publicly.
            </p>
          </div>
        </label>
      </div>

      {error && (
        <p className="text-red-400 text-sm text-center">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allAnswered || isPending}
        className="w-full py-4 rounded-2xl bg-[var(--accent)] text-white font-semibold text-lg disabled:opacity-40 disabled:cursor-not-allowed hover:opacity-90 transition"
      >
        {isPending ? "Submitting…" : "Submit"}
      </button>

      {!allAnswered && (
        <p className="text-center text-sm text-[var(--muted)]">
          Answer all four questions to submit.
        </p>
      )}
    </div>
  );
}
