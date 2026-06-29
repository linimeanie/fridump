import { EmojiScore } from "./types";

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

/** Computes the average of emoji scores (1–5), rounded to 1 decimal. */
export function averageScore(scores: EmojiScore[]): number {
  if (scores.length === 0) return 3;
  const sum = scores.reduce((acc, s) => acc + s, 0);
  return Math.round((sum / scores.length) * 10) / 10;
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
