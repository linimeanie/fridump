// ─────────────────────────────────────────────
// Notion mirror — copies each submission into the
// "Fridump submissions" database. No-ops silently
// unless NOTION_TOKEN + NOTION_DATABASE_ID are set.
// ─────────────────────────────────────────────

const NOTION_API = "https://api.notion.com/v1/pages";
const NOTION_VERSION = "2022-06-28";

export interface NotionMirrorInput {
  week_label: string;
  mood: number;
  workload: number;
  learning: number;
  vibe: number;
  chest_text: string | null;
  improve_text: string | null;
  chest_public: boolean;
  created_at: string; // ISO timestamp
}

// Notion rich_text / title cells cap at 2000 chars.
function text(value: string | null) {
  return [{ text: { content: (value ?? "").slice(0, 2000) } }];
}

/**
 * Best-effort mirror of one submission to Notion. Never throws — a Notion
 * outage must not break the submission (already saved to Supabase).
 */
export async function mirrorSubmissionToNotion(
  input: NotionMirrorInput
): Promise<void> {
  const token = process.env.NOTION_TOKEN;
  const databaseId = process.env.NOTION_DATABASE_ID;
  if (!token || !databaseId) return; // integration not configured — skip

  const dateOnly = input.created_at.slice(0, 10);
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4000);

  try {
    const res = await fetch(NOTION_API, {
      method: "POST",
      signal: controller.signal,
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        "Notion-Version": NOTION_VERSION,
      },
      body: JSON.stringify({
        parent: { database_id: databaseId },
        properties: {
          Entry: { title: text(`${input.week_label} · ${dateOnly}`) },
          Date: { date: { start: input.created_at } },
          Week: { rich_text: text(input.week_label) },
          Mood: { number: input.mood },
          Workload: { number: input.workload },
          Learning: { number: input.learning },
          Vibe: { number: input.vibe },
          "On your chest": { rich_text: text(input.chest_text) },
          "Do differently": { rich_text: text(input.improve_text) },
          "Shared publicly": { checkbox: input.chest_public },
        },
      }),
    });
    if (!res.ok) {
      console.error(
        "Notion mirror failed:",
        res.status,
        (await res.text()).slice(0, 300)
      );
    }
  } catch (err) {
    console.error("Notion mirror error:", err);
  } finally {
    clearTimeout(timeout);
  }
}
