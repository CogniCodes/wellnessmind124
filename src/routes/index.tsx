import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { useState } from "react";
import { Bell, Plus, Flame, HeartPulse, ChevronRight, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MOODS, moodEmoji } from "@/lib/moods";
import { useVisitor, greetingFor } from "@/lib/visitor";
import { useMoods, useSetTodayMood, useSymptoms, type MoodRow, type SymptomRow } from "@/lib/db-hooks";
import { NotificationsDrawer, useUnreadNotifCount } from "@/components/notifications-drawer";
import {
  Area, AreaChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Dashboard · SereneMind" },
      { name: "description", content: "Check in with your mood, log symptoms, and see your wellness progress." },
    ],
  }),
  component: Dashboard,
});

function Dashboard() {
  const { visitor } = useVisitor();
  const { data: moods = [], isLoading: moodsLoading } = useMoods();
  const { data: symptoms = [] } = useSymptoms();
  const setMood = useSetTodayMood();
  const [notifOpen, setNotifOpen] = useState(false);
  const unread = useUnreadNotifCount();

  const name = visitor?.name ?? "friend";
  const greeting = greetingFor();
  const todayMood = moods.find((m) => isToday(m.created_at))?.mood;

  const streak = computeStreak(moods);
  const wellnessScore = computeWellness(moods, symptoms);

  const trendData = lastNDaysMoodScore(moods, 7);
  const wellnessData = lastNDaysMoodScore(moods, 14).map((d, i) => ({
    ...d, w: Math.max(20, Math.min(100, 40 + d.score * 10 + (i % 3))),
  }));
  const symptomFreq = topSymptoms(symptoms);
  const insight = buildInsight(moods, symptoms);

  return (
    <AppShell>
      {/* Greeting */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 py-6">
        <div className="grid h-12 w-12 place-items-center rounded-2xl text-2xl shrink-0"
          style={{ background: "color-mix(in oklab, var(--lavender) 80%, transparent)" }}>
          🐻
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-2xl md:text-3xl font-bold truncate">
            {greeting}, {name} <span className="inline-block">🌸</span>
          </h1>
          <p className="text-sm text-muted-foreground">Let's take care of you today 🌿</p>
        </div>
        <button
          onClick={() => setNotifOpen(true)}
          className="grid h-11 w-11 place-items-center rounded-full glass-card relative"
          aria-label="Notifications"
        >
          <Bell className="h-5 w-5" />
          {unread > 0 && (
            <span className="absolute top-1.5 right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-secondary text-[10px] font-bold text-white grid place-items-center">
              {unread}
            </span>
          )}
        </button>
      </motion.div>

      <NotificationsDrawer open={notifOpen} onOpenChange={setNotifOpen} />

      {/* Mood selector */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-5 mb-5"
      >
        <h2 className="text-center font-display font-bold text-lg mb-4">How are you feeling today?</h2>
        {moodsLoading ? (
          <div className="grid place-items-center py-8"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5">
            {MOODS.map((m) => {
              const active = todayMood === m.name;
              return (
                <button
                  key={m.name}
                  role="radio"
                  aria-checked={active}
                  disabled={setMood.isPending}
                  onClick={() => setMood.mutate(m.name)}
                  className="rounded-2xl p-3 flex items-center gap-2 text-left transition-all hover:scale-[1.02] disabled:opacity-60"
                  style={{
                    background: active ? "color-mix(in oklab, var(--primary) 18%, transparent)" : `color-mix(in oklab, ${m.tone} 55%, transparent)`,
                    border: active ? "2px solid var(--primary)" : "2px solid transparent",
                  }}
                >
                  <span className="text-xl">{m.emoji}</span>
                  <span className="text-xs font-medium leading-tight">{m.name}</span>
                </button>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard
          icon={<Flame className="h-5 w-5" style={{ color: "oklch(0.65 0.2 30)" }} />}
          tint="var(--soft-pink)"
          title="Check-in Streak"
          value={`${streak} Day${streak === 1 ? "" : "s"}`}
          sub={streak === 0 ? "Log your first mood to start." : "Keep it up! You're doing great."}
        />
        <StatCard
          icon={<HeartPulse className="h-5 w-5 text-primary" />}
          tint="var(--lavender)"
          title="Wellness Score"
          value={`${wellnessScore} / 100`}
          sub={wellnessScore >= 70 ? "You're doing well 💜" : "Small steps add up 🌱"}
        />
      </div>

      {/* FAB Add symptom */}
      <div className="relative h-0 mb-8">
        <Link to="/symptoms/add" className="absolute left-1/2 -translate-x-1/2 -top-2 z-10 grid place-items-center">
          <div className="grid h-14 w-14 place-items-center rounded-full bg-card border-4 border-background soft-shadow">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <span className="mt-1 text-xs font-medium text-muted-foreground whitespace-nowrap">Add Symptoms</span>
        </Link>
      </div>
      <div className="h-12" />

      {/* Insights */}
      <Section title="Your Insights">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InsightCard tint="var(--soft-peach)" emoji="😊" title="Mood Insight" body={insight.mood} />
          <InsightCard tint="var(--soft-sky)" emoji="📊" title="Symptom Insight" body={insight.symptom} />
          <InsightCard tint="var(--lavender)" emoji="⭐" title="AI Suggestion" body={insight.suggestion} />
        </div>
      </Section>

      {/* Progress */}
      <Section title="Your Progress">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="glass-card rounded-3xl p-4">
            <p className="font-display font-semibold text-sm mb-2">Mood Trend</p>
            <div className="h-32">
              <ResponsiveContainer>
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <XAxis dataKey="label" hide />
                  <YAxis domain={[0, 5]} hide />
                  <Tooltip
                    cursor={{ stroke: "var(--secondary)", strokeOpacity: 0.3 }}
                    content={<MoodTooltip />}
                  />
                  <Line type="monotone" dataKey="score" stroke="var(--secondary)" strokeWidth={3} dot={{ r: 3, fill: "var(--secondary)" }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-1 text-xs">
              {trendData.map((d, i) => <span key={i}>{moodEmoji(d.mood ?? "")}</span>)}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-4">
            <p className="font-display font-semibold text-sm mb-3">Symptom Frequency</p>
            {symptomFreq.length === 0 ? (
              <p className="text-xs text-muted-foreground">No symptoms logged yet.</p>
            ) : (
              <div className="space-y-2">
                {symptomFreq.map((s) => (
                  <div key={s.name} className="flex items-center gap-2">
                    <span className="text-xs w-20 truncate">{s.name}</span>
                    <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: `${s.pct}%`, background: s.color }} />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        <div className="glass-card rounded-3xl p-4 mt-3">
          <p className="font-display font-semibold text-sm mb-2">Wellness Trend</p>
          <div className="h-28">
            <ResponsiveContainer>
              <AreaChart data={wellnessData}>
                <defs>
                  <linearGradient id="wg" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--success)" stopOpacity={0.6} />
                    <stop offset="100%" stopColor="var(--success)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="label" hide />
                <YAxis domain={[0, 100]} hide />
                <Tooltip
                  cursor={{ stroke: "var(--success)", strokeOpacity: 0.3 }}
                  content={<WellnessTooltip />}
                />
                <Area type="monotone" dataKey="w" stroke="var(--success)" strokeWidth={2} fill="url(#wg)" activeDot={{ r: 5 }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* Mood Calendar */}
      <Section title="Mood Calendar" action="This Week">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
          {lastNDaysMoodScore(moods, 8).map((d, i, arr) => {
            const today = i === arr.length - 1;
            return (
              <div key={i} className="flex flex-col items-center min-w-[56px]">
                {today && <span className="text-[10px] font-semibold text-secondary">Today</span>}
                <div className="rounded-2xl glass-card grid place-items-center w-14 h-16 mt-0.5">
                  <span className="text-xs text-muted-foreground">{d.label}</span>
                  <span className="text-xl">{moodEmoji(d.mood ?? "")}</span>
                </div>
              </div>
            );
          })}
        </div>
      </Section>
    </AppShell>
  );
}

function StatCard({ icon, tint, title, value, sub }: { icon: React.ReactNode; tint: string; title: string; value: string; sub: string }) {
  return (
    <div className="rounded-3xl p-4 soft-shadow" style={{ background: `color-mix(in oklab, ${tint} 70%, var(--card))` }}>
      <div className="flex items-center gap-2 text-xs text-muted-foreground">{icon}<span>{title}</span></div>
      <p className="font-display text-2xl font-bold mt-1">{value}</p>
      <p className="text-xs text-muted-foreground mt-1">{sub}</p>
    </div>
  );
}

function InsightCard({ tint, emoji, title, body }: { tint: string; emoji: string; title: string; body: string }) {
  return (
    <div className="rounded-3xl p-4 soft-shadow" style={{ background: `color-mix(in oklab, ${tint} 65%, var(--card))` }}>
      <div className="flex items-center gap-2 mb-1.5">
        <span className="text-lg">{emoji}</span>
        <span className="text-sm font-display font-semibold">{title}</span>
      </div>
      <p className="text-sm leading-snug">{body}</p>
      <div className="mt-3 grid h-7 w-7 place-items-center rounded-full bg-card">
        <ChevronRight className="h-4 w-4 text-primary" />
      </div>
    </div>
  );
}

function Section({ title, action, children }: { title: string; action?: string; children: React.ReactNode }) {
  return (
    <section className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold">{title}</h3>
        {action && <span className="text-xs font-medium text-muted-foreground">{action}</span>}
      </div>
      {children}
    </section>
  );
}

// ---------- helpers ----------
function isToday(iso: string) {
  const d = new Date(iso);
  const n = new Date();
  return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
}

const MOOD_SCORE: Record<string, number> = {
  Happy: 5, Calm: 4, Energetic: 5, Frisky: 4, Confused: 3, "Mood swings": 3,
  "Low energy": 2, Apathetic: 2, Anxious: 2, Irritated: 2, Sad: 1, Depressed: 1,
  "Feeling guilty": 1, "Obsessive thoughts": 2, "Very self-critical": 1,
};
const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function lastNDaysMoodScore(moods: MoodRow[], n: number) {
  const out: { label: string; date: string; score: number; mood?: string }[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayMoods = moods.filter((m) => sameDay(new Date(m.created_at), d));
    const score = dayMoods.length
      ? dayMoods.reduce((s, m) => s + (MOOD_SCORE[m.mood] ?? 3), 0) / dayMoods.length
      : 0;
    out.push({
      label: DAY_LABELS[d.getDay()],
      date: d.toLocaleDateString(undefined, { month: "short", day: "numeric" }),
      score: Number(score.toFixed(1)),
      mood: dayMoods[0]?.mood,
    });
  }
  return out;
}

function MoodTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string; score: number; mood?: string } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="glass-card rounded-2xl px-3 py-2 text-xs soft-shadow">
      <p className="font-semibold">{d.date}</p>
      <p className="text-muted-foreground">
        {d.mood ? <>{moodEmoji(d.mood)} {d.mood} · {d.score}/5</> : "No mood logged"}
      </p>
    </div>
  );
}

function WellnessTooltip({ active, payload }: { active?: boolean; payload?: Array<{ payload: { date: string; w: number } }> }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  const label = d.w >= 75 ? "Thriving" : d.w >= 55 ? "Steady" : d.w >= 35 ? "Building" : "Tender";
  return (
    <div className="glass-card rounded-2xl px-3 py-2 text-xs soft-shadow">
      <p className="font-semibold">{d.date}</p>
      <p className="text-muted-foreground">Wellness {d.w}/100 · {label}</p>
    </div>
  );
}

function topSymptoms(logs: SymptomRow[]) {
  const counts = new Map<string, number>();
  logs.forEach((l) => counts.set(l.symptom_name, (counts.get(l.symptom_name) ?? 0) + 1));
  const arr = [...counts.entries()].map(([name, c]) => ({ name, count: c }));
  arr.sort((a, b) => b.count - a.count);
  const max = Math.max(1, ...arr.map((a) => a.count));
  const colors = ["var(--secondary)", "var(--primary)", "var(--soft-peach)"];
  return arr.slice(0, 3).map((s, i) => ({ ...s, pct: (s.count / max) * 100, color: colors[i] }));
}

function computeStreak(moods: MoodRow[]): number {
  if (!moods.length) return 0;
  const days = new Set(moods.map((m) => new Date(m.created_at).toDateString()));
  let streak = 0;
  const cur = new Date();
  while (days.has(cur.toDateString())) {
    streak++;
    cur.setDate(cur.getDate() - 1);
  }
  return streak;
}

function computeWellness(moods: MoodRow[], symptoms: SymptomRow[]): number {
  const recent = lastNDaysMoodScore(moods, 7).filter((d) => d.score > 0);
  const avgMood = recent.length ? recent.reduce((s, d) => s + d.score, 0) / recent.length : 3;
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentSyms = symptoms.filter((s) => new Date(s.created_at).getTime() > since);
  const sevPenalty = recentSyms.reduce((s, x) => s + x.severity, 0);
  const base = Math.round((avgMood / 5) * 100);
  return Math.max(10, Math.min(100, base - Math.min(30, sevPenalty * 2)));
}

function buildInsight(moods: MoodRow[], symptoms: SymptomRow[]) {
  // Mood: best weekday
  const byDay: Record<number, { sum: number; count: number }> = {};
  moods.forEach((m) => {
    const d = new Date(m.created_at).getDay();
    const sc = MOOD_SCORE[m.mood] ?? 3;
    byDay[d] = byDay[d] || { sum: 0, count: 0 };
    byDay[d].sum += sc; byDay[d].count += 1;
  });
  const bestDay = Object.entries(byDay)
    .map(([d, v]) => ({ d: Number(d), avg: v.sum / v.count }))
    .sort((a, b) => b.avg - a.avg)[0];
  const moodText = bestDay
    ? `You tend to feel best on ${["Sundays","Mondays","Tuesdays","Wednesdays","Thursdays","Fridays","Saturdays"][bestDay.d]}.`
    : "Log a few moods this week to see patterns emerge.";

  // Symptom: most frequent in last 7 days
  const since = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = symptoms.filter((s) => new Date(s.created_at).getTime() > since);
  const counts = new Map<string, number>();
  recent.forEach((s) => counts.set(s.symptom_name, (counts.get(s.symptom_name) ?? 0) + 1));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1])[0];
  const symText = top
    ? `${top[0]} appeared ${top[1]} time${top[1] === 1 ? "" : "s"} this week.`
    : "No symptoms logged this week — nice.";

  // Suggestion
  const last7Trend = lastNDaysMoodScore(moods, 7).map((d) => d.score).filter((s) => s > 0);
  const trendUp = last7Trend.length >= 2 && last7Trend[last7Trend.length - 1] > last7Trend[0];
  const suggestion = trendUp
    ? "Your mood is trending up — keep your current routine going. 🌱"
    : "Try 5 minutes of slow breathing before bed tonight. 🌬️";

  return { mood: moodText, symptom: symText, suggestion };
}
