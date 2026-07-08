"use client";

import { useEffect, useRef, useState } from "react";
import { EMOJI_SCALE } from "@/lib/types";

interface Props {
  median: number; // 1..scale, drives the needle
  distribution: number[]; // people per score, length = scale
  count: number;
  scale?: 5 | 10; // 5 = emoji, 10 = numeric
}

const EMOJI_LABELS = ["Rough", "Meh", "Okay", "Good", "Great"];

/**
 * Animated reveal:
 * - Emoji scale (5): the five faces + word labels.
 * - Numeric scale (10): the numbers 1–10.
 * Each column shows a stack of the people (🧌) who picked it, and a needle
 * sweeps to the median. The distribution surfaces a lone voice the median hides.
 */
export default function EmojiReveal({
  median,
  distribution,
  count,
  scale = 5,
}: Props) {
  const [needlePos, setNeedlePos] = useState(0); // 0–100 (percentage)
  const [landed, setLanded] = useState(false);
  const [started, setStarted] = useState(false);
  const rafRef = useRef<number | null>(null);

  const isEmoji = scale === 5;
  const targetPct = ((median - 1) / (scale - 1)) * 100;

  useEffect(() => {
    const timeout = setTimeout(() => setStarted(true), 400);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!started) return;
    const duration = 2200;
    const startTime = performance.now();

    function easeOut(t: number): number {
      return 1 - Math.pow(1 - t, 3);
    }
    function tick(now: number) {
      const t = Math.min((now - startTime) / duration, 1);
      setNeedlePos(easeOut(t) * targetPct);
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

  const landedIndex = Math.min(scale - 1, Math.max(0, Math.round(median) - 1));

  return (
    <div
      className="w-full max-w-2xl space-y-6"
      aria-label={`Median result: ${median} out of ${scale}, from ${count} responses`}
    >
      <div className="relative">
        <div
          className={`flex justify-around items-start bg-surface-bright shadow-soft rounded-3xl py-6 ${
            isEmoji ? "px-4" : "px-3"
          }`}
        >
          {distribution.map((people, i) => {
            const active = landed && i === landedIndex;
            return (
              <div
                key={i}
                className="flex flex-col items-center gap-2"
                style={{ width: `${100 / scale}%` }}
              >
                {isEmoji ? (
                  <span
                    className={`text-5xl sm:text-6xl transition-all duration-500 ${
                      active
                        ? "scale-150 drop-shadow-lg"
                        : landed
                        ? "opacity-40 scale-90"
                        : "opacity-70"
                    }`}
                    aria-hidden="true"
                  >
                    {EMOJI_SCALE[i]}
                  </span>
                ) : (
                  <span
                    className={`flex h-9 w-9 items-center justify-center rounded-full text-lg font-bold border-2 transition-all duration-500 ${
                      active
                        ? "bg-primary text-on-primary border-primary scale-125 shadow-glow"
                        : landed
                        ? "opacity-40 border-outline text-ink"
                        : "opacity-80 border-outline text-ink"
                    }`}
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                )}

                {isEmoji && (
                  <span
                    className={`text-xs transition-colors duration-500 ${
                      active ? "text-ink font-bold" : "text-muted font-semibold"
                    }`}
                  >
                    {EMOJI_LABELS[i]}
                  </span>
                )}

                {/* Little people who picked this score */}
                <div
                  className={`flex flex-wrap justify-center gap-0.5 min-h-[1.25rem] transition-opacity duration-700 ${
                    landed ? "opacity-100" : "opacity-0"
                  }`}
                  aria-label={`${people} ${people === 1 ? "person" : "people"}`}
                >
                  {Array.from({ length: people }).map((_, p) => (
                    <span
                      key={p}
                      className={isEmoji ? "text-sm leading-none" : "text-xs leading-none"}
                      aria-hidden="true"
                    >
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
            Median {median.toFixed(1)} / {scale}
            {isEmoji ? ` — ${EMOJI_SCALE[landedIndex]}` : ""}
          </p>
        )}
      </div>
    </div>
  );
}
