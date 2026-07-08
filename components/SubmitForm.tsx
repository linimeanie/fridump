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

// Brand top-border accent that alternates magenta / violet per question card
const CARD_ACCENTS = [
  "border-t-primary",
  "border-t-peach-strong",
  "border-t-primary",
  "border-t-peach-strong",
];

export default function SubmitForm({ session }: Props) {
  const [scores, setScores] = useState<Record<string, EmojiScore>>({});
  const [chestText, setChestText] = useState("");
  const [improveText, setImproveText] = useState("");
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
            chest_text: chestText.trim() || undefined,
            improve_text: improveText.trim() || undefined,
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
        <p className="text-7xl animate-pulse-once">🎉</p>
        <h2 className="text-3xl font-extrabold text-ink">You&apos;re in!</h2>
        <p className="text-muted font-medium">See you on Friday for the reveal.</p>
        <span className="inline-block rounded-full bg-mint px-4 py-1.5 text-sm font-bold text-on-mint">
          Answer saved anonymously
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {session.questions.map((q, qi) => (
        <div
          key={q.id}
          className={`lift shadow-soft bg-surface-bright border-t-4 ${
            CARD_ACCENTS[qi % CARD_ACCENTS.length]
          } rounded-3xl p-6 sm:p-8 space-y-5`}
        >
          <p className="font-bold text-lg leading-snug text-ink">{q.label}</p>
          <div className="flex justify-between items-center gap-1">
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
                  className={`emoji-btn text-4xl sm:text-5xl p-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-full ${
                    selected ? "selected" : "opacity-55 hover:opacity-100"
                  }`}
                >
                  {emoji}
                </button>
              );
            })}
          </div>
          <div className="flex justify-between px-1">
            {EMOJI_LABELS.map((label) => (
              <span
                key={label}
                className="text-xs font-semibold text-muted w-10 text-center"
              >
                {label}
              </span>
            ))}
          </div>
        </div>
      ))}

      {/* Open reflection */}
      <div className="lift shadow-soft bg-surface-bright border-t-4 border-t-primary rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="space-y-3">
          <p className="font-bold text-lg text-ink">
            What keeps you up at night right now? 🌙
          </p>
          <textarea
            value={chestText}
            onChange={(e) => setChestText(e.target.value)}
            placeholder="The thing on your mind — a worry, a risk, an open question… (optional)"
            rows={4}
            className="w-full bg-surface border-2 border-outline rounded-2xl p-4 text-ink placeholder:text-muted resize-none focus:outline-none focus:border-primary focus:bg-surface-bright transition"
          />
        </div>

        <div className="space-y-3">
          <p className="font-bold text-lg text-ink">
            What are you most proud of this week at DTM? 🏆
          </p>
          <textarea
            value={improveText}
            onChange={(e) => setImproveText(e.target.value)}
            placeholder="A win, a milestone, something you shipped or figured out… (optional)"
            rows={4}
            className="w-full bg-surface border-2 border-outline rounded-2xl p-4 text-ink placeholder:text-muted resize-none focus:outline-none focus:border-primary focus:bg-surface-bright transition"
          />
        </div>

        <p className="rounded-2xl bg-primary-container/60 px-4 py-3 text-xs font-medium text-on-primary-container">
          You&apos;re anonymous by default. If you&apos;d rather own your words,
          just sign them — e.g. end with{" "}
          <span className="font-bold">&ldquo;— Lina&rdquo;</span>.
        </p>

        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5 shrink-0">
            <input
              type="checkbox"
              checked={chestPublic}
              onChange={(e) => setChestPublic(e.target.checked)}
              className="sr-only"
            />
            <div
              className={`w-12 h-7 rounded-full transition-colors ${
                chestPublic ? "bg-primary" : "bg-outline"
              }`}
            />
            <div
              className={`absolute top-1 left-1 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                chestPublic ? "translate-x-5" : "translate-x-0"
              }`}
            />
          </div>
          <div>
            <p className="font-semibold text-sm text-ink">
              Show my written answers on screen during the session
            </p>
            <p className="text-xs text-muted mt-0.5 font-medium">
              If off, your written answers stay private and are never shown publicly.
              Your emoji ratings are always anonymous.
            </p>
          </div>
        </label>
      </div>

      {error && (
        <p className="text-error text-sm text-center font-semibold">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!allAnswered || isPending}
        className="btn-chunky shadow-glow w-full py-4 rounded-full bg-primary text-on-primary font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {isPending ? "Submitting…" : "Submit my week 🎉"}
      </button>

      {!allAnswered && (
        <p className="text-center text-sm text-muted font-medium">
          Answer all three questions to submit.
        </p>
      )}
    </div>
  );
}
