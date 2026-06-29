# Fridays 🎉

Anonymous weekly team retrospectives. Participants submit before Friday 3 AM; a designated presenter walks the team through animated results live on Friday.

---

## Stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Animation | Framer Motion + CSS |
| Database | Supabase (Postgres + RLS) |
| Deployment | Vercel |

---

## Project structure

```
app/
  page.tsx                  # Landing page
  submit/page.tsx           # Submission form (participants)
  present/page.tsx          # Presenter view (live session)
  admin/page.tsx            # Admin dashboard
  api/
    session/route.ts        # GET / POST / PATCH active session
    submit/route.ts         # POST anonymous submission
    results/route.ts        # GET aggregated results (presenter token required)
    admin/reset/route.ts    # DELETE all submissions
    admin/presenter/route.ts# POST — return presenter link
    cron/close-session/     # GET — auto-close expired sessions (Vercel Cron)
components/
  SubmitForm.tsx            # Emoji scale + free text form
  PresenterView.tsx         # Step-through presenter UI
  EmojiReveal.tsx           # Animated needle reveal
  AdminPanel.tsx            # Admin dashboard UI
lib/
  types.ts                  # Shared TypeScript types
  utils.ts                  # Week label, token gen, score helpers
  supabase/
    client.ts               # Browser Supabase client
    server.ts               # Server / service-role Supabase client
supabase/
  schema.sql                # Run once in Supabase SQL editor
```

---

## Setup

### 1. Supabase

1. Create a new project at [supabase.com](https://supabase.com).
2. Open **SQL Editor** and run the contents of `supabase/schema.sql`.
3. From **Project Settings → API**, copy:
   - Project URL → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon` public key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `service_role` secret key → `SUPABASE_SERVICE_ROLE_KEY`

### 2. Environment variables

Copy `.env.local` and fill in your values:

```bash
cp .env.local .env.local   # already exists — just edit it
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ADMIN_SECRET=pick-a-long-random-string
CRON_SECRET=another-random-string   # used by Vercel Cron
```

### 3. Run locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Usage

### Organiser (admin)

1. Go to `/admin` and enter your `ADMIN_SECRET`.
2. Click **Start new session** — this sets the submission window to the next Friday 03:00 UTC.
3. Optionally edit the four questions.
4. Click **Randomise presenter link** and share it with the chosen person.

### Participants

- Visit `/submit` (or share the root URL with your team).
- Answer the four emoji-scale questions.
- Optionally type something in the free-text field and toggle public visibility.
- Hit **Submit**. Anonymous — no name, no IP stored.

### Presenter (live Friday session)

- Open the link sent by the organiser (`/present?token=…`).
- Click **Let's go** and walk through each reveal one question at a time.
- The needle sweeps across the five emojis and lands on the average.
- After all four questions, public free-text responses are shown.

---

## Deployment (Vercel)

```bash
npm i -g vercel
vercel
```

Add all four env vars in the Vercel dashboard under **Settings → Environment Variables**.

The `vercel.json` configures a cron job that runs every hour to auto-close sessions past their `closes_at` time. Add `CRON_SECRET` to your Vercel env vars — Vercel automatically passes it as `Authorization: Bearer <secret>` to the cron route.

---

## Customisation

- **Questions** — edit live from the admin panel, or change `DEFAULT_QUESTIONS` in `lib/types.ts`.
- **Submission deadline** — change the `nextFriday3am` function in `lib/utils.ts`.
- **Emoji scale** — swap the `EMOJI_SCALE` array in `lib/types.ts` (keep exactly 5 entries).
- **Theme** — all colours are CSS variables in `app/globals.css`.
