"use client";

import { useEffect, useRef, useState } from "react";
import { EMOJI_SCALE } from "@/lib/types";

interface Props {
  median: number; // 1.0 – 5.0, drives the needle
  distribution: number[]; // people per score, index 0 = score 1 … index 4 = score 5
  count: number;
}

const EMOJI_LABELS = ["Rough", "Meh", "Okay", "Good", "Great"];

/**
 * Animated emoji reveal:
 * - Shows the 5 emojis in a row, each with a stack of little people who picked it
 * - A needle sweeps left→right and lands on the median score
 * - The distribution makes a lone unhappy voice visible (the median won't)
 */
export default function EmojiReveal({ median, distribution, count }: Props) {
  const [needlePos, setNeedlePos] = useState(0); // 0–100 (percentage)
  const [landed, setLanded] = useState(false);
  const [started, setStarted] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Convert median (1–5) to a percentage position across the 5 emoji slots.
  const targetPct = ((median - 1) / 4) * 100; // 0 % = leftmost, 100 % = rightmost

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), 400);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!started) return;

    const duration = 2200; // ms
    const startTime = performance.now();
    const startPos = 0;

    function easeOut(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }

    function tick(now: number) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = easeOut(t);
      setNeedlePos(startPos + eased * targetPct);
      if (t < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        setNeedlePos(targetPct);
        setLanded(true);
      }
    }

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [started, targetPct]);

  // Which emoji index the median lands on (0-based)
  const landedIndex = Math.min(4, Math.max(0, Math.round(median) - 1));

  return (
    <div
      className="w-full max-w-lg space-y-6"
      aria-label={`Median result: ${EMOJI_SCALE[landedIndex]} (${median}/5), from ${count} responses`}
    >
      {/* Emoji row */}
      <div className="relative">
        <div className="flex justify-around items-start py-6 px-4 bg-surface-bright shadow-soft rounded-3xl">
          {EMOJI_SCALE.map((emoji, i) => {
            const people = distribution[i] ?? 0;
            return (
              <div key={i} className="flex flex-col items-center gap-2 w-1/5">
                <span
                  className={`text-5xl sm:text-6xl transition-all duration-500 ${
                    landed && i === landedIndex
                      ? "scale-150 drop-shadow-lg"
                      : landed
                      ? "opacity-40 scale-90"
                      : "opacity-70"
                  }`}
                  aria-hidden="true"
                >
                  {emoji}
                </span>
                <span
                  className={`text-xs transition-colors duration-500 ${
                    landed && i === landedIndex
                      ? "text-ink font-bold"
                      : "text-muted font-semibold"
                  }`}
                >
                  {EMOJI_LABELS[i]}
                </span>

                {/* Little people who picked this score */}
                <div
                  className={`flex flex-wrap justify-center gap-0.5 min-h-[1.25rem] transition-opacity duration-700 ${
                    landed ? "opacity-100" : "opacity-0"
                  }`}
                  aria-label={`${people} ${people === 1 ? "person" : "people"}`}
                >
                  {Array.from({ length: people }).map((_, p) => (
                    <span key={p} className="text-sm leading-none" aria-hidden="true">
                      🧌
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>

        {/* Needle track */}
        <div className="relative h-3 mx-4 mt-3 mb-1">
          <div className="absolute inset-0 rounded-full bg-outline" />
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-primary transition-none"
            style={{ width: `${needlePos}%` }}
          />
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg transition-none bg-primary ${
              landed ? "scale-125" : ""
            }`}
            style={{ left: `${needlePos}%` }}
          />
        </div>
      </div>

      {/* Score summary */}
      <div className="text-center space-y-2">
        <p className="text-muted text-sm font-semibold">
          {count} {count === 1 ? "response" : "responses"}
        </p>
        {landed && (
          <p className="inline-block rounded-full bg-sunny px-5 py-2 text-2xl font-extrabold text-on-sunny animate-pulse-once">
            Median {median.toFixed(1)} / 5 — {EMOJI_SCALE[landedIndex]}
          </p>
        )}
      </div>
    </div>
  );
}
