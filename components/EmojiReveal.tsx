"use client";

import { useEffect, useRef, useState } from "react";
import { EMOJI_SCALE } from "@/lib/types";

interface Props {
  average: number; // 1.0 – 5.0
  count: number;
}

const EMOJI_LABELS = ["Rough", "Meh", "Okay", "Good", "Great"];

/**
 * Animated emoji reveal:
 * - Shows the 5 emojis in a row
 * - A needle sweeps left→right like a roulette wheel
 * - It slows and lands on the average score position
 */
export default function EmojiReveal({ average, count }: Props) {
  const [needlePos, setNeedlePos] = useState(0); // 0–100 (percentage)
  const [landed, setLanded] = useState(false);
  const [started, setStarted] = useState(false);
  const rafRef = useRef<number | null>(null);

  // Convert average (1–5) to a percentage position across the 5 emoji slots.
  // Each slot is 20% wide; we land in the centre of the target slot.
  const targetPct = ((average - 1) / 4) * 100; // 0 % = leftmost, 100 % = rightmost

  useEffect(() => {
    // Small delay so the component is visible before animation starts
    const timeout = setTimeout(() => setStarted(true), 400);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    if (!started) return;

    const duration = 2200; // ms
    const startTime = performance.now();
    const startPos = 0;

    function easeOut(t: number): number {
      // Cubic ease-out
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

  // Which emoji index is highlighted (0-based)
  const landedIndex = Math.round(average) - 1;

  return (
    <div className="w-full max-w-lg space-y-6" aria-label={`Result: ${EMOJI_SCALE[landedIndex]} (${average}/5)`}>
      {/* Emoji row */}
      <div className="relative">
        <div className="flex justify-around items-center py-6 px-4 bg-surface-bright shadow-soft rounded-3xl">
          {EMOJI_SCALE.map((emoji, i) => (
            <div key={i} className="flex flex-col items-center gap-2">
              <span
                className={`text-5xl sm:text-6xl transition-all duration-500 ${
                  landed && i === landedIndex
                    ? "scale-150 drop-shadow-lg"
                    : landed
                    ? "opacity-30 scale-90"
                    : "opacity-70"
                }`}
                aria-hidden="true"
              >
                {emoji}
              </span>
              <span
                className={`text-xs transition-colors duration-500 ${
                  landed && i === landedIndex
                    ? "text-[var(--foreground)] font-semibold"
                    : "text-[var(--muted)]"
                }`}
              >
                {EMOJI_LABELS[i]}
              </span>
            </div>
          ))}
        </div>

        {/* Needle track */}
        <div className="relative h-3 mx-4 mt-3 mb-1">
          <div className="absolute inset-0 rounded-full bg-[var(--card-border)]" />
          {/* Filled track */}
          <div
            className="absolute inset-y-0 left-0 rounded-full bg-[var(--accent)] transition-none"
            style={{ width: `${needlePos}%` }}
          />
          {/* Needle head */}
          <div
            className={`absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-5 h-5 rounded-full border-2 border-white shadow-lg transition-none ${
              landed ? "bg-[var(--accent)] scale-125" : "bg-[var(--accent)]"
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
            {average.toFixed(1)} / 5 — {EMOJI_SCALE[landedIndex]}
          </p>
        )}
      </div>
    </div>
  );
}
