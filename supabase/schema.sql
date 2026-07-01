-- Fridays Retrospective App — Supabase Schema
-- Run this in the Supabase SQL editor to set up your database.

-- ─────────────────────────────────────────────
-- Sessions table
-- One row per weekly retro session.
-- ─────────────────────────────────────────────
create table if not exists sessions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  week_label    text not null,          -- e.g. "2025-W26"
  is_active     boolean not null default true,
  closes_at     timestamptz not null,   -- set to next Friday 03:00 local UTC
  presenter_token text unique,          -- opaque token for presenter view
  admin_token   text unique not null,   -- opaque token for admin view
  questions     jsonb not null default '[
    {"id":"mood",     "label":"How was your mood this week?"},
    {"id":"workload", "label":"How was your workload?"},
    {"id":"learning", "label":"How much did you learn this week?"},
    {"id":"vibe",     "label":"How well did we vibe as a team?"}
  ]'::jsonb
);

-- ─────────────────────────────────────────────
-- Submissions table
-- One row per participant submission.
-- Fully anonymous — no user id, no IP stored.
-- ─────────────────────────────────────────────
create table if not exists submissions (
  id            uuid primary key default gen_random_uuid(),
  session_id    uuid not null references sessions(id) on delete cascade,
  created_at    timestamptz not null default now(),
  -- Emoji scale answers: 1 (😩) … 5 (😄)
  mood          smallint not null check (mood between 1 and 5),
  workload      smallint not null check (workload between 1 and 5),
  learning      smallint not null check (learning between 1 and 5),
  vibe          smallint not null check (vibe between 1 and 5),
  -- Free-text
  chest_text    text,                  -- "what's on your chest", nullable if blank
  improve_text  text,                  -- "what could we do differently", nullable if blank
  chest_public  boolean not null default false
);

-- Indexes
create index if not exists submissions_session_id_idx on submissions(session_id);

-- ─────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────
alter table sessions    enable row level security;
alter table submissions enable row level security;

-- Anyone can insert a submission (anonymous participants)
create policy "Public insert submissions"
  on submissions for insert
  with check (true);

-- Nobody can read raw submissions directly from the client —
-- all reads go through API routes that use the service role key.
create policy "No direct read submissions"
  on submissions for select
  using (false);

-- Sessions are read-only from the client (needed to check is_active / closes_at)
create policy "Public read sessions"
  on sessions for select
  using (true);

-- Only service role can insert/update sessions
create policy "Service role manages sessions"
  on sessions for all
  using (auth.role() = 'service_role');
