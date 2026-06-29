# Tasks — Fridays

## Implementation tasks

- [x] 1. Scaffold project and install dependencies
  - Initialize Next.js 15 with TypeScript, Tailwind CSS v4, and App Router via `create-next-app`
  - Install `@supabase/supabase-js`, `@supabase/ssr`, `framer-motion`, `lucide-react`
  - Verify `npm run build` passes with zero errors
  - _Requirements: NFR-2, NFR-5_

- [x] 2. Define shared types and utilities
  - Create `lib/types.ts` with `Session`, `Submission`, `Question`, `EmojiScore`, `SessionResults`, `SubmitPayload`, `QuestionResult`, `EMOJI_SCALE`, `DEFAULT_QUESTIONS`
  - Create `lib/utils.ts` with `getWeekLabel`, `nextFriday3am`, `isSubmissionOpen`, `averageScore`, `generateToken`, `clamp`
  - _Requirements: 1.4, 2.3, 4_

- [x] 3. Set up Supabase schema
  - Write `supabase/schema.sql` creating `sessions` and `submissions` tables
  - Add RLS policies: public SELECT on sessions, service-role ALL on sessions, public INSERT on submissions, no SELECT on submissions
  - _Requirements: 1.3, NFR-3, NFR-6_

- [x] 4. Configure Supabase clients and environment
  - Create `lib/supabase/client.ts` — browser client via `createBrowserClient`
  - Create `lib/supabase/server.ts` — SSR client and `createServiceClient` using the service-role key
  - Create `.env.local` template with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_SECRET`, `CRON_SECRET`
  - _Requirements: NFR-2, NFR-6_

- [x] 5. Global styles and root layout
  - Update `app/globals.css` with dark theme CSS variables, `.emoji-btn` selected state (scale + glow ring), needle track animation
  - Update `app/layout.tsx` with Geist font, metadata title "Fridays — Team Retro"
  - _Requirements: 1.1, 2.3, NFR-4_

- [x] 6. Landing page
  - Create `app/page.tsx` with navigation links to `/submit`, `/present`, and `/admin`
  - _Requirements: 1.5_

- [x] 7. Session API route
  - `GET /api/session` — returns active session public fields (no admin token exposed)
  - `POST /api/session` — creates a new session, deactivates the previous; protected by `x-admin-secret` header
  - `PATCH /api/session` — updates questions on active session; protected by `x-admin-secret` header
  - _Requirements: 3.2, 3.3_

- [x] 8. Submission API route
  - `POST /api/submit` — validates session is active and `closes_at` has not passed; validates all four scores are integers 1–5; inserts anonymous row with no user identifiers
  - Returns `403` if window is closed, `400` if payload is invalid
  - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 9. Results API route
  - `GET /api/results?token=` — looks up session by `presenter_token`; aggregates scores per question using `averageScore`; filters `chest_text` to only `chest_public = true` rows
  - Returns full `SessionResults` shape
  - _Requirements: 2.1, 2.3, 2.4_

- [x] 10. Admin API routes
  - `DELETE /api/admin/reset` — deletes all submissions for the active session; protected by `x-admin-secret`
  - `POST /api/admin/presenter` — returns the presenter token for the active session; protected by `x-admin-secret`
  - _Requirements: 3.4, 3.5_

- [x] 11. Cron endpoint and Vercel config
  - `GET /api/cron/close-session` — sets `is_active = false` on all sessions where `closes_at < now()`; protected by `Authorization: Bearer <CRON_SECRET>`
  - Create `vercel.json` with hourly cron schedule `0 * * * *`
  - _Requirements: 4_

- [x] 12. Submission form component
  - Create `components/SubmitForm.tsx` as a `"use client"` component
  - Render one card per question with five emoji buttons; selected emoji gets scale + glow ring; `aria-pressed` and `aria-label` on each button
  - Free-text `<textarea>` for "What's on your chest?"
  - Custom toggle (`chest_public`) with visible on/off state and explanatory label
  - Submit button disabled until all four questions are answered
  - `POST /api/submit` on click; show success screen on `201`; show inline error on failure
  - _Requirements: 1.1, 1.2, 1.3, NFR-4_

- [x] 13. Submission page
  - Create `app/submit/page.tsx` as a server component
  - Read active session via service-role client; call `isSubmissionOpen(closes_at)`
  - Show "Submissions are closed" state with contextual message when window is closed or no session exists
  - Pass session (id + questions) to `SubmitForm`
  - _Requirements: 1.4, 1.5_

- [x] 14. Animated emoji reveal component
  - Create `components/EmojiReveal.tsx` as a `"use client"` component
  - Render five emojis in a row with labels below each
  - Start `requestAnimationFrame` loop after 400 ms mount delay
  - Cubic ease-out over 2200 ms; needle moves from `0%` to `targetPct = ((average - 1) / 4) * 100`
  - Render filled track bar and circular needle head that follow `needlePos`
  - On `landed`: target emoji scales to 150%, others dim to 30% opacity; show numeric average and response count
  - _Requirements: 2.3_

- [x] 15. Presenter view component
  - Create `components/PresenterView.tsx` as a `"use client"` component
  - Fetch `GET /api/results?token=` on mount; handle loading and error states
  - Step 0: intro screen showing week label and total response count with "Let's go" button
  - Steps 1–N: mount one `EmojiReveal` per question (re-mounts on each step to re-trigger animation) with "Next question →" button
  - Step N+1: scrollable list of public free-text quote cards; graceful empty state if none
  - _Requirements: 2.1, 2.2, 2.3, 2.4_

- [x] 16. Presenter page
  - Create `app/present/page.tsx` that unwraps the async `searchParams` Promise and passes `token` to `PresenterView`
  - _Requirements: 2.1_

- [x] 17. Admin panel component
  - Create `components/AdminPanel.tsx` as a `"use client"` component
  - Auth gate: password input stores secret in component state; passes it as `x-admin-secret` header on all API calls
  - Session card: displays week label, active status, closes_at, session ID; "Start new session" button calls `POST /api/session`
  - Questions card: read-only list with "Edit questions" link that reveals inline inputs; Save/Cancel actions call `PATCH /api/session`
  - Presenter card: "Randomise presenter link" button calls `POST /api/admin/presenter`; shows copyable URL with one-click clipboard copy
  - Danger zone: "Clear all submissions" button with a confirm step before calling `DELETE /api/admin/reset`
  - Flash success messages (auto-dismiss after 3 s); persistent error display
  - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

- [x] 18. Admin page
  - Create `app/admin/page.tsx` as a shell page mounting `AdminPanel`
  - _Requirements: 3.1_

- [x] 19. README and deployment documentation
  - Document stack, project structure, Supabase setup steps, environment variables, local dev instructions, usage guide for each role (participant, presenter, admin), Vercel deployment steps, and customisation notes
  - _Requirements: NFR-2_
