# Requirements — Fridays

## Overview

Fridays is an anonymous weekly team retrospective web application. Participants submit responses before Friday 3 AM; a designated presenter walks the team through the aggregated results live during the Friday session.

---

## Requirements

### 1. Submission form

#### 1.1 Emoji-scale questions
- **MUST** present four quantitative questions, each answered via a five-point emoji scale: 😩 😕 😐 🙂 😄 (scored 1–5 internally).
- Default questions:
  1. How was your mood this week?
  2. How was your workload?
  3. How much did you learn this week?
  4. How well did we vibe as a team?
- **MUST** require all four questions to be answered before submission is allowed.
- **MUST** provide clear visual feedback on the selected emoji (scale, glow).

#### 1.2 Free-text field
- **MUST** include an optional free-text field: *"What's on your chest?"*
- **MUST** include a toggle: **"Show my answer on screen during the session"**
  - When toggled **off** (default): the response is stored but never displayed publicly.
  - When toggled **on**: the response may appear in the presenter view.
- The free-text field **MUST** be optional (empty submission is valid).

#### 1.3 Anonymity
- **MUST NOT** store any user identifiers, names, session cookies, or IP addresses linked to a submission.
- All submissions are indistinguishable from one another beyond their content.

#### 1.4 Submission window
- **MUST** accept submissions only while the active session's `closes_at` timestamp has not passed.
- **MUST** show a clear "Submissions are closed" state when the window is closed or no active session exists.
- The window closes automatically at **Friday 03:00 UTC**.

#### 1.5 Access
- **MUST** be accessible via a shared URL with no login required.

---

### 2. Presenter view

#### 2.1 Access
- **MUST** be accessed via a URL containing a unique, opaque **presenter token** (`/present?token=…`).
- Only the holder of that token can view aggregated results.

#### 2.2 Step-by-step reveal
- **MUST** present results one question at a time, revealed by clicking a "Next" button.
- **MUST** show an intro screen (week label + total response count) before the first question.

#### 2.3 Animated emoji reveal
- **MUST** display all five emojis in a row for each question.
- **MUST** animate a needle/arrow that sweeps left-to-right across the emojis, decelerating and landing on the average score.
- The animation **MUST** be smooth (ease-out curve, ~2 seconds).
- After landing, the target emoji **MUST** be visually emphasised (scale up, others dim).
- **MUST** display the numeric average and response count after landing.

#### 2.4 Free-text screen
- **MUST** display only responses where the participant toggled "Show my answer on screen".
- Shown as a scrollable list of quote cards after the four question reveals.
- If no public responses exist, **MUST** display a graceful empty state.

---

### 3. Admin panel

#### 3.1 Authentication
- **MUST** be protected by an `ADMIN_SECRET` environment variable.
- Admin enters the secret in a password field in the browser; it is sent as a request header on each API call.

#### 3.2 Session management
- **MUST** allow the admin to start a new session, which:
  - Deactivates the previous active session.
  - Sets `closes_at` to the next Friday 03:00 UTC.
  - Generates a unique presenter token and admin token.
- **MUST** display the current session's week label, status, and closing time.

#### 3.3 Question configuration
- **MUST** allow the admin to edit the label of each of the four questions on the active session.
- Changes **MUST** be saved to the database.

#### 3.4 Presenter randomiser
- **MUST** provide a button that returns the presenter link for the active session.
- The link **MUST** be copyable to the clipboard.

#### 3.5 Reset
- **MUST** allow the admin to delete all submissions for the active session.
- **MUST** require a confirmation step before deletion.

---

### 4. Submission window auto-close

- **MUST** automatically set sessions to inactive once `closes_at` has passed.
- Implemented via an hourly server-side cron job (`/api/cron/close-session`).
- The cron endpoint **MUST** be protected by `CRON_SECRET` (or `ADMIN_SECRET` in development).

---

### 5. Non-functional requirements

| # | Requirement |
|---|---|
| NFR-1 | No login or account required for participants |
| NFR-2 | Deployable to Vercel with a single `vercel` command |
| NFR-3 | All participant data is anonymous at the database level |
| NFR-4 | The app must work on mobile (responsive layout) |
| NFR-5 | TypeScript strict mode throughout |
| NFR-6 | Row Level Security enabled on all Supabase tables |
