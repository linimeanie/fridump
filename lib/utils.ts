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
 * Returns the next Friday at 03:00 UTC from the given reference date.
 * If today is already Friday before 03:00, returns today at 03:00 UTC.
 */
export function nextFriday3am(from: Date = new Date()): Date {
  const d = new Date(from);
  const day = d.getUTCDay(); // 0=Sun … 5=Fri … 6=Sat
  const daysUntilFriday = day <= 5 ? 5 - day : 7 - (day - 5);

  const isFridayPast3 =
    day === 5 &&
    (d.getUTCHours() > 3 || (d.getUTCHours() === 3 && d.getUTCMinutes() > 0));

  const target = new Date(d);
  target.setUTCDate(
    d.getUTCDate() + (daysUntilFriday === 0 && isFridayPast3 ? 7 : daysUntilFriday)
  );
  target.setUTCHours(3, 0, 0, 0);
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
 * Builds the row for a brand-new session: a friendly week label derived from
 * the closing Friday, fresh presenter/admin tokens, and the given questions.
 * Shared by the admin "Start new session" action and the weekly cron.
 */
export function buildSessionInsert(questions: Question[], now: Date = new Date()) {
  const closesAt = nextFriday3am(now);
  return {
    week_label: getWeekLabel(closesAt),
    is_active: true,
    closes_at: closesAt.toISOString(),
    presenter_token: generateToken(),
    admin_token: generateToken(),
    questions,
  };
}
