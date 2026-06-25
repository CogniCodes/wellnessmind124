# Plan: Logout + Notifications + Chart Tooltips + Auto-AI Symptom Chat + Vercel Deploy

## 1. Fix Logout (Profile page + sidebar)

- `useVisitor().signOut()` already clears localStorage and resets state, which triggers `WelcomeGate` to render `<Welcome />`. The Profile button works in principle but the navigation feel is awkward and the sidebar's `LogOut` button in `src/components/app-shell.tsx` is a no-op.
- Wire the sidebar's logout button to `useVisitor().signOut()` with the same confirm + toast as the profile page.
- After `signOut()`, also call `router.navigate({ to: "/" })` so the gate is re-evaluated from the home route (avoids a protected page lingering before the gate swap).
- Welcome screen already supports both "Existing User → enter ID" and "Create New Account", so no UI work needed there.

## 2. Notifications Drawer

- Replace the static Bell button in `src/routes/index.tsx` header (and the "Notifications" row in Profile) with a button that opens a right-side `Sheet` (shadcn `sheet.tsx` already installed).
- New component `src/components/notifications-drawer.tsx`:
  - Generates a dynamic list of notifications from existing Supabase data (no schema changes):
    - **Mood streak reminder** — when streak ≥ 3, "You're on a 5-day streak — keep it going!"; if no mood logged today, "Don't break your streak — log today's mood".
    - **Daily symptom logging reminder** — if no symptom logged in last 24h.
    - **AI insights available** — when ≥ 3 moods AND ≥ 2 symptoms exist this week.
    - **Weekly wellness summary** — Sunday/Monday digest, "Your wellness score this week: X/100".
    - **Upcoming medication reminder** — placeholder card sourced from `medical_history` rows in category `Medication`, else a friendly placeholder.
  - Unread tracking via localStorage key `sm.notif.readIds` (set of stable notification IDs derived from type+date). Unread count badge dot on the bell.
  - Opening the drawer marks currently-visible notifications as read (and updates the badge).
  - Drawer closes via overlay click, Esc, or close button (Sheet handles this natively).
- Sidebar Profile page "Notifications" row also opens the same drawer.

## 3. Interactive Chart Tooltips

In `src/routes/index.tsx`:
- **Mood Trend `LineChart`**: add `<XAxis dataKey="label" hide />`, `<YAxis hide domain={[0,5]} />`, and a `<Tooltip>` with a custom content component that shows `Date · Mood emoji + name · Score/5`. Use the same `MOOD_SCORE` map to label the score back. `trendData` already has `label`, `score`, and `mood`; extend it to include full ISO date for display.
- **Wellness Trend `AreaChart`**: extend `wellnessData` to include `date` and `score`. Add `<Tooltip>` showing `Date · Wellness X/100 · trend label`.
- Tooltips render through Recharts' default tooltip wrapper styled with `glass-card` classes so they work on touch (Recharts auto-triggers tooltip on touchstart for mobile).
- No new dependencies; recharts already in `package.json`.

## 4. Auto AI Conversation from Latest Symptom

- After saving a symptom in `src/routes/symptoms.add.tsx`, write a marker to localStorage:
  `sm.pendingSymptomChat = <symptom_log.id>` (use the inserted row's id; update `useAddSymptom` to return `data` so we have the id).
- In `src/routes/chat.tsx`:
  - On mount, after `messages` and `symptoms` are loaded, check localStorage marker.
  - If marker exists, marker ID is not already represented in chat history, and matches the latest symptom row, automatically call `sendChat` with a synthetic user message like `"I just logged a symptom: <name> (severity X/5). Can you help me understand it?"` — but persist it as an **assistant-initiated** flow:
    - Skip inserting the synthetic user line into chat (so the visible conversation starts with the assistant greeting).
    - Send the messages array + symptom-focused system context to `sendChat`. Add a one-shot instruction in `context` (extend `ContextSchema` with `autoSymptomFocus: { name, severity, at, notes, durationDays }`) telling the assistant to greet, analyze the symptom (name, severity, duration, possible causes, self-care, when to seek medical attention), and end with a follow-up question.
    - Insert only the assistant reply into `ai_chat_messages` so it persists for next session.
  - Clear the localStorage marker on success (or on failure, after one retry attempt) so it only fires once per logged symptom.
- Duration: computed as days since the first occurrence of that symptom name in `symptoms` (or "first time today" when only one row exists).
- No effect if the user logs a symptom but never opens Chat — the marker just sits in localStorage until the next Chat visit, then fires once.

## 5. Vercel Deployment Fix

**Cause:** the Lovable Vite config defaults Nitro to the Cloudflare preset, so `vercel build` produces a Cloudflare worker artifact that Vercel can't route → every URL hits Vercel's 404.

**Fix:** override the Nitro preset for Vercel via env-driven config in `vite.config.ts`:

```ts
export default defineConfig({
  tanstackStart: { server: { entry: "server" } },
  nitro: { preset: process.env.VERCEL ? "vercel" : undefined },
});
```

(Use the exact option name the wrapper exposes; if it doesn't accept `nitro`, fall back to setting `NITRO_PRESET=vercel` via a project-level `vercel.json` build env.)

Add `vercel.json` at repo root:

```json
{
  "buildCommand": "vite build",
  "outputDirectory": ".vercel/output",
  "framework": null,
  "build": { "env": { "NITRO_PRESET": "vercel" } }
}
```

Nitro's `vercel` preset emits the `.vercel/output` Build Output API directory that Vercel serves natively (SSR functions + static assets + routing manifest), which fixes the catch-all 404.

The Lovable preview keeps working because the override only triggers when `VERCEL=1` is set (Vercel sets this automatically during builds).

## Out of scope / not changed

- No DB schema changes (no `notifications` table — generated on the fly from existing data).
- No UI redesign of dashboard / chat / profile beyond the bell button and the new drawer.
- No changes to authentication model (User ID stays the sole credential).

## Technical notes

- Files to edit: `src/components/app-shell.tsx`, `src/routes/profile.tsx`, `src/routes/index.tsx`, `src/routes/chat.tsx`, `src/routes/symptoms.add.tsx`, `src/lib/db-hooks.ts`, `src/lib/ai.functions.ts`, `vite.config.ts`.
- Files to create: `src/components/notifications-drawer.tsx`, `vercel.json`.
- Commit at the end via the IDE's normal commit flow (the agent doesn't run `git` directly, but every edit is committed to the Lovable-managed branch which pushes to the connected GitHub repo automatically).
