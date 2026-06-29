# Design — Fridays

## Tech stack

| Layer | Choice | Rationale |
|---|---|---|
| Framework | Next.js 15 (App Router) | SSR for session state checks; file-based routing; Vercel-native |
| Language | TypeScript (strict) | Type safety across client and server |
| Styling | Tailwind CSS v4 | Utility-first; dark theme via CSS variables |
| Animation | CSS + `requestAnimationFrame` | No extra bundle weight; full control over needle easing |
| Database | Supabase (Postgres) | Managed Postgres with RLS; real-time optional; generous free tier |
| Supabase client | `@supabase/ssr` | Cookie-aware SSR client; service-role client for API routes |
| Deployment | Vercel | Zero-config Next.js; built-in Cron for session auto-close |

---

## Architecture overview

```
Browser                     Next.js (Vercel)              Supabase
──────────────────────────────────────────────────────────────────
/submit          ──render──▶ app/submit/page.tsx
                             (reads session via service role)
                 ──POST────▶ /api/submit ────────────────▶ INSERT submissions
/present?token=  ──render──▶ app/present/page.tsx
PresenterView    ──GET─────▶ /api/results?token= ─────────▶ SELECT submissions
/admin           ──render──▶ app/admin/page.tsx
AdminPanel       ──POST────▶ /api/session ───────────────▶ INSERT/UPDATE sessions
                 ──DELETE──▶ /api/admin/reset ───────────▶ DELETE submissions
Vercel Cron      ──GET─────▶ /api/cron/close-session ────▶ UPDATE sessions
```

All database writes from API routes use the **service-role key** (bypasses RLS). The browser client only reads the `sessions` table via the anon key (RLS allows public SELECT on sessions, but no SELECT on submissions).

---

## Database schema

### `sessions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | `gen_random_uuid()` |
| `created_at` | timestamptz | auto |
| `week_label` | text | e.g. `2025-W26` |
| `is_active` | boolean | only one active at a time |
| `closes_at` | timestamptz | next Friday 03:00 UTC |
| `presenter_token` | text unique | opaque URL-safe token |
| `admin_token` | text unique | reserved for future use |
| `questions` | jsonb | array of `{id, label}` |

### `submissions`

| Column | Type | Notes |
|---|---|---|
| `id` | uuid PK | |
| `session_id` | uuid FK | → sessions.id, CASCADE DELETE |
| `created_at` | timestamptz | auto |
| `mood` | smallint 1–5 | |
| `workload` | smallint 1–5 | |
| `learning` | smallint 1–5 | |
| `vibe` | smallint 1–5 | |
| `chest_text` | text nullable | |
| `chest_public` | boolean | default false |

No user identifiers, no IP, no fingerprinting — anonymity is structural.

### Row Level Security

| Table | Policy | Effect |
|---|---|---|
| sessions | Public SELECT | Anyone can read session metadata |
| sessions | Service role ALL | Only API routes can write |
| submissions | Public INSERT | Anonymous participants can submit |
| submissions | No SELECT | Client can never read raw submissions |

---

## File structure

```
.kiro/specs/fridays/       ← this spec
app/
  page.tsx                 ← landing page
  layout.tsx               ← root layout + fonts
  globals.css              ← CSS variables, dark theme, emoji-btn styles
  submit/
    page.tsx               ← server component: checks session open/closed
  present/
    page.tsx               ← thin wrapper; unwraps searchParams
  admin/
    page.tsx               ← admin shell
  api/
    session/route.ts       ← GET (public) / POST / PATCH (admin)
    submit/route.ts        ← POST (anonymous)
    results/route.ts       ← GET (presenter token)
    admin/
      reset/route.ts       ← DELETE (admin)
      presenter/route.ts   ← POST (admin)
    cron/
      close-session/route.ts ← GET (cron secret)
components/
  SubmitForm.tsx           ← "use client" emoji scale + free text
  PresenterView.tsx        ← "use client" step-through reveal shell
  EmojiReveal.tsx          ← "use client" rAF needle animation
  AdminPanel.tsx           ← "use client" full admin dashboard
lib/
  types.ts                 ← shared interfaces + constants
  utils.ts                 ← week label, token gen, score helpers
  supabase/
    client.ts              ← browser client
    server.ts              ← SSR client + service-role client
supabase/
  schema.sql               ← run once in Supabase SQL editor
vercel.json                ← hourly cron job config
.env.local                 ← env var template
```

---

## Key component designs

### `SubmitForm`

State: `scores: Record<questionId, 1–5>`, `chestText`, `chestPublic`, `submitted`, `isPending`.

- Renders one card per question with 5 emoji buttons.
- Selected emoji gets CSS class `.selected` (scale + glow ring).
- Submit button disabled until all 4 questions answered.
- On submit: `POST /api/submit`, shows success screen on `201`.

### `EmojiReveal`

Props: `average: number` (1.0–5.0), `count: number`.

Animation flow:
1. Mount → 400 ms delay → start `requestAnimationFrame` loop.
2. `easeOut` cubic curve over 2200 ms, needle moves from 0% to `targetPct`.
3. `targetPct = ((average - 1) / 4) * 100` maps 1→0%, 5→100%.
4. On completion: `landed = true` → target emoji scales up 150%, others dim to 30% opacity.

### `PresenterView`

Steps: `0` = intro, `1..N` = question reveals, `N+1` = free text.

- Fetches `GET /api/results?token=` on mount.
- Each "Next" click increments `step`.
- Mounts a fresh `EmojiReveal` per question (re-triggers animation on each reveal).

### `AdminPanel`

Two sub-states: `auth` (password prompt) → `dashboard`.

Dashboard cards:
1. **Current session** — status, closes_at, session ID + "Start new session" button.
2. **Questions** — read-only list with "Edit" toggle → inline inputs → Save/Cancel.
3. **Presenter** — "Randomise" button → shows copyable link.
4. **Danger zone** — "Clear submissions" with confirm step.

All mutations use `x-admin-secret` request header.

---

## API contracts

### `GET /api/session`
Returns `{ session: Session | null }`. Public.

### `POST /api/session`
Header: `x-admin-secret`. Body: `{ questions?: Question[] }`.
Returns `{ session: Session }` 201.

### `PATCH /api/session`
Header: `x-admin-secret`. Body: `{ questions: Question[] }`.
Returns `{ session: Session }`.

### `POST /api/submit`
Body: `{ session_id, mood, workload, learning, vibe, chest_text?, chest_public }`.
Returns `{ ok: true }` 201 or error.

### `GET /api/results?token=`
Returns `SessionResults`: `{ session, question_results, public_texts, total_submissions }`.

### `DELETE /api/admin/reset`
Header: `x-admin-secret`. Returns `{ ok: true }`.

### `POST /api/admin/presenter`
Header: `x-admin-secret`. Returns `{ presenter_token }`.

### `GET /api/cron/close-session`
Header: `Authorization: Bearer <CRON_SECRET>`. Returns `{ closed, sessions }`.

---

## Environment variables

| Variable | Used by | Description |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | client + server | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | client + server | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | server only | Bypasses RLS for API routes |
| `ADMIN_SECRET` | server only | Protects admin endpoints |
| `CRON_SECRET` | server only | Protects the cron endpoint on Vercel |

---

## Deployment

1. Push to GitHub.
2. Import into Vercel — it auto-detects Next.js.
3. Add all 5 env vars in Vercel dashboard.
4. Vercel reads `vercel.json` and configures the hourly cron automatically.

No other infrastructure needed.
