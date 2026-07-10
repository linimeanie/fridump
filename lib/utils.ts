import { Question } from "./types";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Returns a friendly month-relative week label for a given date,
 * e.g. "July · Week 1". Week-of-month is the date divided into 7-day blocks
 * (days 1–7 → Week 1, 8–14 → Week 2, …).
 */
export function getWeekLabel(date: Date = new Date()): string {
  const month = MONTH_NAMES[date.getUTCMonth()];
  const weekOfMonth = Math.ceil(date.getUTCDate() / 7);
  return `${month} · Week ${weekOfMonth}`;
}

/**
 * Returns the next Sunday at 00:00 UTC strictly after the given reference date.
 * This is when the week renews — submissions stay open until then.
 */
export function nextSundayMidnight(from: Date = new Date()): Date {
  const d = new Date(from);
  const daysUntilSunday = (7 - d.getUTCDay()) % 7; // 0 when today is Sunday
  const target = new Date(d);
  target.setUTCDate(d.getUTCDate() + daysUntilSunday);
  target.setUTCHours(0, 0, 0, 0);
  // Strictly after `from` — if we landed on now-or-earlier, jump a full week.
  if (target <= d) target.setUTCDate(target.getUTCDate() + 7);
  return target;
}

/** Returns true if the submission window is still open. */
export function isSubmissionOpen(closesAt: string): boolean {
  return new Date() < new Date(closesAt);
}

/**
 * Computes the median of rating scores, rounded to 1 decimal.
 * The median is robust to a single outlier — pair it with the distribution
 * to actually surface when one person is unhappy. Falls back to the scale's
 * midpoint when there are no answers.
 */
export function medianScore(scores: number[], scale = 5): number {
  if (scores.length === 0) return (scale + 1) / 2;
  const sorted = [...scores].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  const median =
    sorted.length % 2 !== 0
      ? sorted[mid]
      : (sorted[mid - 1] + sorted[mid]) / 2;
  return Math.round(median * 10) / 10;
}

/**
 * Counts how many people picked each score, returning a `scale`-length array
 * where index 0 = score 1 … index (scale-1) = score `scale`.
 */
export function scoreDistribution(scores: number[], scale = 5): number[] {
  const counts = new Array(scale).fill(0);
  for (const s of scores) {
    if (s >= 1 && s <= scale) counts[s - 1] += 1;
  }
  return counts;
}

/** Generates a short URL-safe random token (~22 chars). */
export function generateToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "");
}

/** Clamps a number between min and max. */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

/**
 * Builds the row for a brand-new session: a friendly week label for the week
 * it opens, submissions open until the next Sunday-midnight renewal, plus fresh
 * tokens. Shared by the admin "Start new session" action and the weekly cron.
 */
export function buildSessionInsert(questions: Question[], now: Date = new Date()) {
  return {
    week_label: getWeekLabel(now),
    is_active: true,
    closes_at: nextSundayMidnight(now).toISOString(),
    presenter_token: generateToken(),
    admin_token: generateToken(),
    questions,
  };
}
