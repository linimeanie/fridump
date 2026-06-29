// ─────────────────────────────────────────────
// Domain types for the Fridays retro app
// ─────────────────────────────────────────────

export const EMOJI_SCALE = ["😩", "😕", "😐", "🙂", "😄"] as const;
export type EmojiScore = 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  label: string;
}

export const DEFAULT_QUESTIONS: Question[] = [
  { id: "mood",     label: "How was your mood this week?" },
  { id: "workload", label: "How was your workload?" },
  { id: "learning", label: "How much did you learn this week?" },
  { id: "vibe",     label: "How well did we vibe as a team?" },
];

// ─── Database row shapes ───────────────────────

export interface Session {
  id: string;
  created_at: string;
  week_label: string;
  is_active: boolean;
  closes_at: string;
  presenter_token: string | null;
  admin_token: string;
  questions: Question[];
}

export interface Submission {
  id: string;
  session_id: string;
  created_at: string;
  mood: EmojiScore;
  workload: EmojiScore;
  learning: EmojiScore;
  vibe: EmojiScore;
  chest_text: string | null;
  chest_public: boolean;
}

// ─── API payload shapes ────────────────────────

export interface SubmitPayload {
  session_id: string;
  mood: EmojiScore;
  workload: EmojiScore;
  learning: EmojiScore;
  vibe: EmojiScore;
  chest_text?: string;
  chest_public: boolean;
}

export interface QuestionResult {
  question: Question;
  scores: EmojiScore[];
  average: number; // 1–5, drives the needle
}

export interface SessionResults {
  session: Session;
  question_results: QuestionResult[];
  public_texts: string[];
  total_submissions: number;
}
