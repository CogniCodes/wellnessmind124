import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { Bell, Plus, Flame, HeartPulse, ChevronRight, Smile, BarChart3, Star } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { MOODS, moodEmoji } from "@/lib/moods";
import { usePersistent } from "@/lib/store";
import type { Mood, MoodEntry, SymptomLog } from "@/lib/store";
import { DEFAULT_PROFILE, SEED_MOODS, SEED_SYMPTOMS } from "@/lib/seed";
import {
  Area, AreaChart, Bar, BarChart, CartesianGrid, Line, LineChart,
  ResponsiveContainer, XAxis, YAxis,
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
  const [profile] = usePersistent("sm.profile", DEFAULT_PROFILE);
  const [moods, setMoods] = usePersistent<MoodEntry[]>("sm.moods", SEED_MOODS);
  const [symptoms] = usePersistent<SymptomLog[]>("sm.symptoms", SEED_SYMPTOMS);

  const greeting = (() => {
    const h = new Date().getHours();
    if (h < 12) return "Good Morning";
    if (h < 18) return "Good Afternoon";
    return "Good Evening";
  })();

  const todayMoods = new Set(moods.filter(m => isToday(m.at)).map(m => m.mood));

  const toggleMood = (mood: Mood) => {
    setMoods((prev) => {
      const todays = prev.filter(m => isToday(m.at) && m.mood === mood);
      if (todays.length) return prev.filter(m => !(isToday(m.at) && m.mood === mood));
      return [{ id: crypto.randomUUID(), mood, at: new Date().toISOString() }, ...prev];
    });
  };

  const trendData = lastNDaysMoodScore(moods, 7);
  const wellnessData = lastNDaysMoodScore(moods, 14).map((d, i) => ({ ...d, w: 40 + Math.sin(i / 2) * 20 + d.score * 8 }));
  const symptomFreq = topSymptoms(symptoms);

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
            {greeting}, {profile.name} <span className="inline-block">🌸</span>
          </h1>
          <p className="text-sm text-muted-foreground">Let's take care of you today 🌿</p>
        </div>
        <button className="grid h-11 w-11 place-items-center rounded-full glass-card relative">
          <Bell className="h-5 w-5" />
          <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-secondary" />
        </button>
      </motion.div>

      {/* Mood selector */}
      <motion.section
        initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="glass-card rounded-3xl p-5 mb-5"
      >
        <h2 className="text-center font-display font-bold text-lg mb-4">How are you feeling today?</h2>
        <div className="grid grid-cols-3 md:grid-cols-5 gap-2.5">
          {MOODS.map((m) => {
            const active = todayMoods.has(m.name);
            return (
              <button
                key={m.name}
                onClick={() => toggleMood(m.name)}
                className="rounded-2xl p-3 flex items-center gap-2 text-left transition-all hover:scale-[1.02]"
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
      </motion.section>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <StatCard
          icon={<Flame className="h-5 w-5" style={{ color: "oklch(0.65 0.2 30)" }} />}
          tint="var(--soft-pink)"
          title="Check-in Streak"
          value={`${profile.streak} Days`}
          sub="Keep it up! You're doing great."
        />
        <StatCard
          icon={<HeartPulse className="h-5 w-5 text-primary" />}
          tint="var(--lavender)"
          title="Wellness Score"
          value={`${profile.wellnessScore} / 100`}
          sub="You're doing well 💜"
        />
      </div>

      {/* FAB Add symptom */}
      <div className="relative h-0 mb-8">
        <Link
          to="/symptoms/add"
          className="absolute left-1/2 -translate-x-1/2 -top-2 z-10 grid place-items-center"
        >
          <div className="grid h-14 w-14 place-items-center rounded-full bg-card border-4 border-background soft-shadow">
            <Plus className="h-6 w-6 text-primary" />
          </div>
          <span className="mt-1 text-xs font-medium text-muted-foreground whitespace-nowrap">Add Symptoms</span>
        </Link>
      </div>
      <div className="h-12" />


      {/* Insights */}
      <Section title="Your Insights" action="See all">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <InsightCard tint="var(--soft-peach)" emoji="😊" title="Mood Insight" body="You felt happiest on Sundays this week." />
          <InsightCard tint="var(--soft-sky)" emoji="📊" title="Symptom Insight" body="Headaches were more frequent this week." />
          <InsightCard tint="var(--lavender)" emoji="⭐" title="AI Suggestion" body="Try meditation before bedtime tonight." />
        </div>
      </Section>

      {/* Progress */}
      <Section title="Your Progress" action="See all">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="glass-card rounded-3xl p-4">
            <p className="font-display font-semibold text-sm mb-2">Mood Trend</p>
            <div className="h-32">
              <ResponsiveContainer>
                <LineChart data={trendData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
                  <YAxis hide domain={[0, 5]} />
                  <Line type="monotone" dataKey="score" stroke="var(--secondary)" strokeWidth={3} dot={{ r: 3, fill: "var(--secondary)" }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-around mt-1 text-xs">
              {trendData.map((d, i) => <span key={i}>{moodEmoji(d.mood)}</span>)}
            </div>
          </div>

          <div className="glass-card rounded-3xl p-4">
            <p className="font-display font-semibold text-sm mb-3">Symptom Frequency</p>
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
                <Area type="monotone" dataKey="w" stroke="var(--success)" strokeWidth={2} fill="url(#wg)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </Section>

      {/* Mood Calendar */}
      <Section title="Mood Calendar" action="This Month">
        <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2">
          {lastNDaysMoodScore(moods, 8).map((d, i, arr) => {
            const today = i === arr.length - 1;
            return (
              <div key={i} className="flex flex-col items-center min-w-[56px]">
                {today && <span className="text-[10px] font-semibold text-secondary">Today</span>}
                <div className="rounded-2xl glass-card grid place-items-center w-14 h-16 mt-0.5">
                  <span className="text-xs text-muted-foreground">{d.label}</span>
                  <span className="text-xl">{moodEmoji(d.mood)}</span>
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
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        {icon}<span>{title}</span>
      </div>
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
        {action && <button className="text-xs font-medium text-primary">{action}</button>}
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

function lastNDaysMoodScore(moods: MoodEntry[], n: number) {
  const out: { label: string; score: number; mood?: string }[] = [];
  const today = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dayMoods = moods.filter(m => sameDay(new Date(m.at), d));
    const score = dayMoods.length
      ? dayMoods.reduce((s, m) => s + (MOOD_SCORE[m.mood] ?? 3), 0) / dayMoods.length
      : 3 + Math.sin(i) * 0.8;
    out.push({ label: DAY_LABELS[d.getDay()], score: Number(score.toFixed(1)), mood: dayMoods[0]?.mood });
  }
  return out;
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function topSymptoms(logs: SymptomLog[]) {
  const counts = new Map<string, number>();
  logs.forEach((l) => counts.set(l.name, (counts.get(l.name) ?? 0) + 1));
  const arr = [...counts.entries()].map(([name, c]) => ({ name, count: c }));
  const max = Math.max(1, ...arr.map(a => a.count));
  const colors = ["var(--secondary)", "var(--primary)", "var(--soft-peach)"];
  return arr.slice(0, 3).map((s, i) => ({ ...s, pct: (s.count / max) * 100, color: colors[i] }));
}
