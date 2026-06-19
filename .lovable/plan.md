# SereneMind — Mental Wellness Companion

A pastel, mobile-first wellness app matching the reference screens, built on TanStack Start + Lovable Cloud (auth + database) + Lovable AI Gateway.

## Phase 1 — Foundations

- Enable Lovable Cloud (auth + Postgres + storage).
- Design system in `src/styles.css`: pastel tokens (`primary #C084FC`, `secondary #F9A8D4`, `bg #FFF8FB`, lavender, soft pink, success, warning), 20–30px radii, soft shadows, subtle gradients. Inter + Poppins via `<link>` in `__root.tsx`. Dark mode tokens.
- Layout shell: desktop left sidebar (matches "Left pane" reference — logo, nav groups, illustration card, Log Out) + mobile bottom nav bar (Home / Secret Space / Support Circle / AI Chat / More).
- Framer Motion for transitions; Recharts for analytics.

## Phase 2 — Auth

- Email/password + Google sign-in (via Lovable broker).
- Routes: `/auth` (login + signup tabs), `/forgot-password`, `/reset-password`.
- `profiles` table auto-created on signup (name, avatar, streak, wellness_score).
- Protected app under `_authenticated/`.

## Phase 3 — Database schema

Tables (RLS scoped to `auth.uid()`, grants to authenticated):
`profiles, mood_entries, symptoms (seed), symptom_logs, community_posts, post_likes, post_comments, post_saves, support_contacts, medical_chronic, medical_allergies, medical_illnesses, medical_medications, medical_notes, insights, chat_messages`.
Seed demo data via migration.

## Phase 4 — Core screens

1. **Dashboard** (`/`) — "Good Morning, {name}" header, 15-mood selector grid (pastel chips matching home.jpeg), Check-in Streak + Wellness Score cards, floating Add Symptom CTA, Insights row (3 cards), Progress (Mood Trend line, Symptom Frequency bars, Wellness Trend area), Mood Calendar strip.
2. **Add Symptoms** (`/symptoms/add`) — search, 5 category pills, symptom grid w/ icons, selected card, intensity slider 1–5, notes + (mock) voice button, Done CTA.
3. **AI Chat** (`/chat`) — chat UI per reference (lotus avatar, bubble suggestions list), Lovable AI Gateway (`google/gemini-3-flash-preview`) via `createServerFn`, persisted to `chat_messages`, includes disclaimer banner: "Not medical advice…".
4. **Secret Space** (`/community`) — anonymous feed, search + Popular sort, post cards with tags/like/comment/save, create-post sheet.
5. **Support Circle** (`/support-circle`) — contact list cards (avatar, relationship, phone), add/edit/delete, call/message links, "Notify Support Circle" emergency button (mock + geolocation).
6. **Mood History** (`/mood-history`) — stat cards, weekly line trend, monthly emoji calendar, insights card.
7. **Symptoms History** (`/symptoms-history`) — filter pills (All/Recent/Frequent/Severe), stat cards, timeline grouped by day.
8. **Medical History** (`/medical`) — CRUD sections: Chronic, Allergies, Illnesses, Medications, Notes.
9. **Games** (`/games`) — Breathing exercise (animated circle), Memory Match, Mood Coloring (simple SVG fill), Relaxation Timer.
10. **Profile** (`/profile`) — edit profile, avatar, sign out.

## Phase 5 — Polish

- Framer Motion page/list animations.
- Responsive: mobile bottom nav < md, sidebar ≥ md.
- Dark mode toggle in profile.
- Empty/loading/error states; toasts via sonner.

## Technical notes

- Stack: TanStack Start, React 19, Tailwind v4, shadcn, Recharts, Framer Motion, Lovable Cloud (Supabase), Lovable AI Gateway.
- Server fns in `src/lib/*.functions.ts` for mood/symptom/community/chat CRUD; chat streams via `/api/chat` server route using AI SDK.
- All colors as semantic tokens; no hardcoded color classes.
- Seed data so screens look populated on first load.

## Scope caveats

- This is a large build — I'll deliver in passes, starting with foundations + auth + dashboard + add-symptoms, then chat + community + support circle, then history/medical/games. You'll see working preview after each pass.
- Voice input is a UI-only button (no STT integration unless requested).
- Emergency notify is mocked (no SMS provider) — shows confirmation + captured location.