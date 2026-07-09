"use client";

import { useState, useTransition } from "react";
import { EMOJI_SCALE, Question } from "@/lib/types";

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
  const [scores, setScores] = useState<Record<string, number>>({});
  const [chestText, setChestText] = useState("");
  const [improveText, setImproveText] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Everything is optional — you can send with any single answer.
  const hasAnything =
    Object.keys(scores).length > 0 ||
    chestText.trim() !== "" ||
    improveText.trim() !== "";

  function handleScore(questionId: string, score: number) {
    setScores((prev) => ({ ...prev, [questionId]: score }));
  }

  function handleSubmit() {
    if (!hasAnything) return;
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
            chest_public: true,
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

          {q.scale === 10 ? (
            // ── Numeric 1–10 scale ──
            <div className="space-y-2">
              <div className="flex flex-wrap justify-center gap-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => {
                  const selected = scores[q.id] === n;
                  return (
                    <button
                      key={n}
                      type="button"
                      aria-label={`${n} out of 10`}
                      aria-pressed={selected}
                      onClick={() => handleScore(q.id, n)}
                      className={`btn-chunky h-11 w-11 rounded-full font-bold border-2 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary ${
                        selected
                          ? "bg-primary text-on-primary border-primary shadow-glow"
                          : "bg-surface text-ink border-outline hover:border-primary"
                      }`}
                    >
                      {n}
                    </button>
                  );
                })}
              </div>
              <div className="flex justify-between px-1 text-xs font-semibold text-muted">
                <span>1 · not really</span>
                <span>hugely · 10</span>
              </div>
            </div>
          ) : (
            // ── Emoji 1–5 scale ──
            <>
              <div className="flex justify-between items-center gap-1">
                {EMOJI_SCALE.map((emoji, i) => {
                  const score = i + 1;
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
            </>
          )}
        </div>
      ))}

      {/* Open reflection */}
      <div className="lift shadow-soft bg-surface-bright border-t-4 border-t-primary rounded-3xl p-6 sm:p-8 space-y-5">
        <div className="space-y-3">
          <p className="font-bold text-lg text-ink">
            What kept you up at night this week? 🌙
          </p>
          <textarea
            value={chestText}
            onChange={(e) => setChestText(e.target.value)}
            placeholder="The thing that's on your mind — a worry, a risk, an open question…"
            rows={4}
            className="w-full bg-surface border-2 border-outline rounded-2xl p-4 text-ink placeholder:text-muted resize-none focus:outline-none focus:border-primary focus:bg-surface-bright transition"
          />
        </div>

        <div className="space-y-3">
          <p className="font-bold text-lg text-ink">
            What are you most proud of this week? 🏆
          </p>
          <textarea
            value={improveText}
            onChange={(e) => setImproveText(e.target.value)}
            placeholder="A win, a milestone, something you shipped or figured out…"
            rows={4}
            className="w-full bg-surface border-2 border-outline rounded-2xl p-4 text-ink placeholder:text-muted resize-none focus:outline-none focus:border-primary focus:bg-surface-bright transition"
          />
        </div>

        <p className="rounded-2xl bg-primary-container/60 px-4 py-3 text-xs font-medium text-on-primary-container">
          You&apos;re anonymous by default — anything you write here is shared with
          the team (that&apos;s the point). Don&apos;t want to share it? Just leave it
          blank. Want to own your words? Sign them — e.g. end with{" "}
          <span className="font-bold">&ldquo;— Lina&rdquo;</span>.
        </p>
      </div>

      {error && (
        <p className="text-error text-sm text-center font-semibold">{error}</p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={!hasAnything || isPending}
        className="btn-chunky shadow-glow w-full py-4 rounded-full bg-primary text-on-primary font-bold text-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:shadow-none"
      >
        {isPending ? "Submitting…" : "Submit my week 🎉"}
      </button>
    </div>
  );
}
