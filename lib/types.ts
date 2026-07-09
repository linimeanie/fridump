// ─────────────────────────────────────────────
// Domain types for the Fridays retro app
// ─────────────────────────────────────────────

export const EMOJI_SCALE = ["😩", "😕", "😐", "🙂", "😄"] as const;
export type EmojiScore = 1 | 2 | 3 | 4 | 5;

export interface Question {
  id: string;
  label: string;
  // Rating scale: 5 = emoji picker (default), 10 = numeric 1–10 scale.
  scale?: 5 | 10;
}

export const DEFAULT_QUESTIONS: Question[] = [
  {
    id: "learning",
    label:
      "To what degree did today's 'Better Every Week' session improve a skill that makes you a better founder?",
    scale: 10,
  },
  { id: "mood", label: "How was your mood this week?" },
  {
    id: "workload",
    label: "How manageable was your workload this week?",
  },
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
  mood: number | null;
  workload: number | null;
  learning: number | null;
  vibe: number | null;
  chest_text: string | null;
  improve_text: string | null;
  chest_public: boolean;
}

// ─── API payload shapes ────────────────────────

// All rating answers are optional — a person can submit with any subset.
export interface SubmitPayload {
  session_id: string;
  mood?: number;
  workload?: number;
  learning?: number;
  vibe?: number;
  chest_text?: string;
  improve_text?: string;
  chest_public: boolean;
}

export interface QuestionResult {
  question: Question;
  scale: 5 | 10; // 5 = emoji, 10 = numeric
  scores: number[]; // non-null answers only
  median: number; // drives the needle (1–scale)
  distribution: number[]; // count per score, index 0 = score 1 … length = scale
}

export interface SessionResults {
  session: Session;
  question_results: QuestionResult[];
  public_texts: string[];
  public_improvements: string[];
  total_submissions: number;
}
