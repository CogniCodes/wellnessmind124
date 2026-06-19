import { createFileRoute } from "@tanstack/react-router";
import { Calendar, TrendingUp, Smile, Sun } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { usePersistent } from "@/lib/store";
import type { MoodEntry } from "@/lib/store";
import { SEED_MOODS } from "@/lib/seed";
import { moodEmoji } from "@/lib/moods";
import { Line, LineChart, ResponsiveContainer, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/mood-history")({
  head: () => ({ meta: [{ title: "Mood History · SereneMind" }] }),
  component: MoodHistory,
});

const MOOD_SCORE: Record<string, number> = {
  Happy: 5, Calm: 4, Energetic: 5, Frisky: 4, Confused: 3, "Mood swings": 3,
  "Low energy": 2, Apathetic: 2, Anxious: 2, Irritated: 2, Sad: 1, Depressed: 1,
};

function MoodHistory() {
  const [moods] = usePersistent<MoodEntry[]>("sm.moods", SEED_MOODS);

  const week = lastN(moods, 7);
  const month = monthGrid(moods);

  const counts: Record<string, number> = {};
  moods.forEach(m => counts[m.mood] = (counts[m.mood] ?? 0) + 1);
  const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ["Calm", 0];

  return (
    <AppShell>
      <PageHeader title="Mood History" subtitle="Understand your emotional patterns"
        icon={<Calendar className="h-5 w-5 text-primary" />} />

      <div className="grid grid-cols-3 gap-3 mb-4">
        <StatCard tint="var(--soft-mint)" emoji="😌" title="Most Common Mood" value={mostCommon[0]} sub={`${mostCommon[1]} times`} />
        <StatCard tint="var(--soft-peach)" emoji="📈" title="Mood Stability" value="78%" sub="Balanced" />
        <StatCard tint="var(--soft-yellow)" emoji="☀️" title="Best Day" value="Sunday" sub="Usually" />
      </div>

      <div className="glass-card rounded-3xl p-4 mb-4">
        <p className="font-display font-semibold mb-1">Mood Trend <span className="text-xs text-muted-foreground">(This Week)</span></p>
        <div className="h-40">
          <ResponsiveContainer>
            <LineChart data={week}>
              <XAxis dataKey="label" tick={{ fontSize: 10 }} axisLine={false} tickLine={false} />
              <YAxis hide domain={[0, 5]} />
              <Line type="monotone" dataKey="score" stroke="var(--primary)" strokeWidth={3} dot={{ r: 4, fill: "var(--primary)" }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="glass-card rounded-3xl p-4 mb-4">
        <p className="font-display font-semibold mb-3">Mood Calendar <span className="text-xs text-muted-foreground">June 2025</span></p>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map(d => <div key={d} className="text-muted-foreground py-1">{d}</div>)}
          {month.map((cell, i) => (
            <div key={i} className="aspect-square rounded-xl grid place-items-center"
              style={{ background: cell.day ? "color-mix(in oklab, var(--card) 50%, transparent)" : "transparent" }}>
              <div className="text-[10px] text-muted-foreground leading-none">{cell.day || ""}</div>
              <div className="text-base leading-tight">{cell.day ? moodEmoji(cell.mood) : ""}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-3xl p-4 flex items-center gap-3"
        style={{ background: "color-mix(in oklab, var(--soft-pink) 50%, var(--card))" }}>
        <span className="text-2xl">🌿</span>
        <div>
          <p className="font-semibold text-sm">Insights</p>
          <p className="text-xs text-muted-foreground">You feel the most calm and happy on weekends.</p>
        </div>
      </div>
    </AppShell>
  );
}

function StatCard({ tint, emoji, title, value, sub }: { tint: string; emoji: string; title: string; value: string; sub: string }) {
  return (
    <div className="rounded-3xl p-3 soft-shadow text-center" style={{ background: `color-mix(in oklab, ${tint} 60%, var(--card))` }}>
      <div className="text-2xl">{emoji}</div>
      <p className="text-[10px] text-muted-foreground mt-1">{title}</p>
      <p className="font-display font-bold text-sm mt-0.5">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function lastN(moods: MoodEntry[], n: number) {
  const labels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const day = moods.filter(m => sameDay(new Date(m.at), d));
    const score = day.length ? day.reduce((s, m) => s + (MOOD_SCORE[m.mood] ?? 3), 0) / day.length : 3 + Math.sin(i) * 0.7;
    out.push({ label: labels[d.getDay()], score: Number(score.toFixed(1)) });
  }
  return out;
}
function monthGrid(moods: MoodEntry[]) {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7; // Mon-first
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const cells: { day: number | null; mood?: string }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(today.getFullYear(), today.getMonth(), d);
    const m = moods.find(x => sameDay(new Date(x.at), date));
    cells.push({ day: d, mood: m?.mood });
  }
  return cells.slice(0, 35);
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
