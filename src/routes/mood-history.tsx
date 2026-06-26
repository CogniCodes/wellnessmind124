import { createFileRoute } from "@tanstack/react-router";
import { Calendar, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { useMoods, type MoodRow } from "@/lib/db-hooks";
import { moodEmoji } from "@/lib/moods";
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export const Route = createFileRoute("/mood-history")({
  head: () => ({ meta: [{ title: "Mood History · SereneMind" }] }),
  component: MoodHistory,
});

const MOOD_SCORE: Record<string, number> = {
  Happy: 5, Calm: 4, Energetic: 5, Frisky: 4, Confused: 3, "Mood swings": 3,
  "Low energy": 2, Apathetic: 2, Anxious: 2, Irritated: 2, Sad: 1, Depressed: 1,
};

function MoodHistory() {
  const { data: moods = [], isLoading } = useMoods();

  const week = lastN(moods, 7);
  const month = monthGrid(moods);
  const counts: Record<string, number> = {};
  moods.forEach((m) => (counts[m.mood] = (counts[m.mood] ?? 0) + 1));
  const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0] ?? ["—", 0];
  const stability = computeStability(moods);
  const bestDayName = bestWeekday(moods);

  return (
    <AppShell>
      <PageHeader title="Mood History" subtitle="Understand your emotional patterns"
        icon={<Calendar className="h-5 w-5 text-primary" />} />

      {isLoading ? (
        <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : moods.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center">
          <p className="text-3xl">📊</p>
          <p className="font-display font-bold mt-1">No mood data yet</p>
          <p className="text-sm text-muted-foreground">Log a mood on your dashboard to start tracking patterns.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-3 mb-4">
            <StatCard tint="var(--soft-mint)" emoji="😌" title="Most Common" value={String(mostCommon[0])} sub={`${mostCommon[1]} times`} />
            <StatCard tint="var(--soft-peach)" emoji="📈" title="Stability" value={`${stability}%`} sub={stability >= 70 ? "Balanced" : "Variable"} />
            <StatCard tint="var(--soft-yellow)" emoji="☀️" title="Best Day" value={bestDayName ?? "—"} sub="Usually" />
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
            <p className="font-display font-semibold mb-3">Mood Calendar
              <span className="text-xs text-muted-foreground"> {new Date().toLocaleDateString(undefined, { month: "long", year: "numeric" })}</span>
            </p>
            <div className="grid grid-cols-7 gap-1 text-center text-xs">
              {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((d) => <div key={d} className="text-muted-foreground py-1">{d}</div>)}
              {month.map((cell, i) => (
                <div key={i} className="aspect-square rounded-xl grid place-items-center"
                  style={{ background: cell.day ? "color-mix(in oklab, var(--card) 50%, transparent)" : "transparent" }}>
                  <div className="text-[10px] text-muted-foreground leading-none">{cell.day || ""}</div>
                  <div className="text-base leading-tight">{cell.day ? moodEmoji(cell.mood ?? "") : ""}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-3xl p-4 flex items-center gap-3"
            style={{ background: "color-mix(in oklab, var(--soft-pink) 50%, var(--card))" }}>
            <span className="text-2xl">🌿</span>
            <div>
              <p className="font-semibold text-sm">Insight</p>
              <p className="text-xs text-muted-foreground">
                {bestDayName ? `You tend to feel best on ${bestDayName}s.` : "Keep logging to see your patterns."}
              </p>
            </div>
          </div>
        </>
      )}
    </AppShell>
  );
}

function StatCard({ tint, emoji, title, value, sub }: { tint: string; emoji: string; title: string; value: string; sub: string }) {
  return (
    <div className="rounded-3xl p-3 soft-shadow text-center" style={{ background: `color-mix(in oklab, ${tint} 60%, var(--card))` }}>
      <div className="text-2xl">{emoji}</div>
      <p className="text-[10px] text-muted-foreground mt-1">{title}</p>
      <p className="font-display font-bold text-sm mt-0.5 truncate">{value}</p>
      <p className="text-[10px] text-muted-foreground">{sub}</p>
    </div>
  );
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function lastN(moods: MoodRow[], n: number) {
  const labels = ["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
  const today = new Date();
  const out = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(today); d.setDate(today.getDate() - i);
    const day = moods.filter((m) => sameDay(new Date(m.created_at), d));
    const score = day.length ? day.reduce((s, m) => s + (MOOD_SCORE[m.mood] ?? 3), 0) / day.length : 0;
    out.push({ label: labels[d.getDay()], score: Number(score.toFixed(1)) });
  }
  return out;
}
function monthGrid(moods: MoodRow[]) {
  const today = new Date();
  const first = new Date(today.getFullYear(), today.getMonth(), 1);
  const startOffset = (first.getDay() + 6) % 7;
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const cells: { day: number | null; mood?: string }[] = [];
  for (let i = 0; i < startOffset; i++) cells.push({ day: null });
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(today.getFullYear(), today.getMonth(), d);
    const m = moods.find((x) => sameDay(new Date(x.created_at), date));
    cells.push({ day: d, mood: m?.mood });
  }
  return cells;
}
function computeStability(moods: MoodRow[]): number {
  const scored = moods.map((m) => MOOD_SCORE[m.mood] ?? 3);
  if (scored.length < 2) return 50;
  const mean = scored.reduce((a, b) => a + b, 0) / scored.length;
  const variance = scored.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / scored.length;
  return Math.max(0, Math.min(100, Math.round(100 - variance * 25)));
}
function bestWeekday(moods: MoodRow[]): string | null {
  const byDay: Record<number, { sum: number; count: number }> = {};
  moods.forEach((m) => {
    const d = new Date(m.created_at).getDay();
    byDay[d] = byDay[d] || { sum: 0, count: 0 };
    byDay[d].sum += MOOD_SCORE[m.mood] ?? 3; byDay[d].count += 1;
  });
  const top = Object.entries(byDay)
    .map(([d, v]) => ({ d: Number(d), avg: v.sum / v.count }))
    .sort((a, b) => b.avg - a.avg)[0];
  return top ? ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][top.d] : null;
}
