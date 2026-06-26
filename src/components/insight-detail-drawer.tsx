import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import type { MoodRow, SymptomRow } from "@/lib/db-hooks";

type Kind = "mood" | "symptom" | "ai" | null;

const MOOD_SCORE: Record<string, number> = {
  Happy: 5, Calm: 4, Energetic: 5, Frisky: 4, Confused: 3, "Mood swings": 3,
  "Low energy": 2, Apathetic: 2, Anxious: 2, Irritated: 2, Sad: 1, Depressed: 1,
};
const DAYS = ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];

export function InsightDetailDrawer({
  kind, onOpenChange, moods, symptoms,
}: {
  kind: Kind;
  onOpenChange: (open: boolean) => void;
  moods: MoodRow[];
  symptoms: SymptomRow[];
}) {
  const open = kind !== null;
  const insufficient =
    (kind === "mood" && moods.length < 3) ||
    (kind === "symptom" && symptoms.length < 1) ||
    (kind === "ai" && moods.length < 3 && symptoms.length < 1);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">
            {kind === "mood" && "Mood Insights"}
            {kind === "symptom" && "Symptom Insights"}
            {kind === "ai" && "AI Suggestions"}
          </SheetTitle>
          <SheetDescription>
            {kind === "mood" && "Patterns from your recent mood check-ins."}
            {kind === "symptom" && "What your body has been telling you."}
            {kind === "ai" && "Personalized next steps based on your data."}
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-3">
          {insufficient ? (
            <EmptyState />
          ) : (
            <>
              {kind === "mood" && <MoodInsights moods={moods} />}
              {kind === "symptom" && <SymptomInsights symptoms={symptoms} />}
              {kind === "ai" && <AiInsights moods={moods} symptoms={symptoms} />}
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

function EmptyState() {
  return (
    <div className="rounded-2xl bg-muted/40 p-6 text-center">
      <p className="text-3xl">🌱</p>
      <p className="font-display font-semibold mt-2">Not quite enough data yet</p>
      <p className="text-sm text-muted-foreground mt-1">
        Log a few more moods and symptoms and personalized insights will appear here.
      </p>
    </div>
  );
}

function Card({ title, children, tint }: { title: string; children: React.ReactNode; tint?: string }) {
  return (
    <div className="rounded-2xl p-4"
      style={{ background: tint ? `color-mix(in oklab, ${tint} 55%, var(--card))` : "var(--card)" }}>
      <p className="font-semibold text-sm mb-1">{title}</p>
      <div className="text-sm text-muted-foreground leading-snug">{children}</div>
    </div>
  );
}

function MoodInsights({ moods }: { moods: MoodRow[] }) {
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const month = Date.now() - 30 * 24 * 60 * 60 * 1000;
  const weekly = moods.filter((m) => new Date(m.created_at).getTime() > week);
  const monthly = moods.filter((m) => new Date(m.created_at).getTime() > month);

  const counts = new Map<string, number>();
  monthly.forEach((m) => counts.set(m.mood, (counts.get(m.mood) ?? 0) + 1));
  const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);

  const avgWeek = weekly.length ? weekly.reduce((s, m) => s + (MOOD_SCORE[m.mood] ?? 3), 0) / weekly.length : 0;
  const prevWeekStart = week - 7 * 24 * 60 * 60 * 1000;
  const prevWeek = moods.filter((m) => {
    const t = new Date(m.created_at).getTime();
    return t > prevWeekStart && t <= week;
  });
  const avgPrev = prevWeek.length ? prevWeek.reduce((s, m) => s + (MOOD_SCORE[m.mood] ?? 3), 0) / prevWeek.length : 0;
  const trend = avgPrev === 0 ? "stable" : avgWeek > avgPrev + 0.3 ? "improving" : avgWeek < avgPrev - 0.3 ? "dipping" : "stable";

  const byDay: Record<number, { sum: number; count: number }> = {};
  monthly.forEach((m) => {
    const d = new Date(m.created_at).getDay();
    byDay[d] = byDay[d] || { sum: 0, count: 0 };
    byDay[d].sum += MOOD_SCORE[m.mood] ?? 3; byDay[d].count += 1;
  });
  const best = Object.entries(byDay).map(([d, v]) => ({ d: Number(d), avg: v.sum / v.count }))
    .sort((a, b) => b.avg - a.avg)[0];

  return (
    <>
      <Card title="This week" tint="var(--soft-peach)">
        {weekly.length} check-in{weekly.length === 1 ? "" : "s"} ·
        average mood score {avgWeek.toFixed(1)}/5 ·
        trend is <strong className="text-foreground">{trend}</strong>.
      </Card>
      <Card title="Most frequent moods (30 days)" tint="var(--lavender)">
        {top.length === 0 ? "No moods this month yet." : (
          <ul className="list-disc pl-5 space-y-0.5">
            {top.map(([m, c]) => <li key={m}>{m} — {c} time{c === 1 ? "" : "s"}</li>)}
          </ul>
        )}
      </Card>
      {best && (
        <Card title="Best weekday" tint="var(--soft-yellow)">
          You tend to feel best on {DAYS[best.d]}s (avg {best.avg.toFixed(1)}/5).
        </Card>
      )}
    </>
  );
}

function SymptomInsights({ symptoms }: { symptoms: SymptomRow[] }) {
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recent = symptoms.filter((s) => new Date(s.created_at).getTime() > week);

  const counts = new Map<string, { count: number; sevSum: number }>();
  symptoms.forEach((s) => {
    const e = counts.get(s.symptom_name) ?? { count: 0, sevSum: 0 };
    e.count++; e.sevSum += s.severity;
    counts.set(s.symptom_name, e);
  });
  const top = [...counts.entries()].sort((a, b) => b[1].count - a[1].count).slice(0, 5);

  const avgSev = symptoms.length ? symptoms.reduce((s, x) => s + x.severity, 0) / symptoms.length : 0;
  const recentAvg = recent.length ? recent.reduce((s, x) => s + x.severity, 0) / recent.length : 0;
  const sevTrend = avgSev === 0 ? "" : recentAvg > avgSev + 0.5 ? "rising" : recentAvg < avgSev - 0.5 ? "easing" : "steady";

  return (
    <>
      <Card title="This week" tint="var(--soft-sky)">
        {recent.length} symptom log{recent.length === 1 ? "" : "s"} ·
        average severity {recentAvg.toFixed(1)}/5
        {sevTrend && <> · trend is <strong className="text-foreground">{sevTrend}</strong></>}.
      </Card>
      <Card title="Most frequent symptoms" tint="var(--lavender)">
        <ul className="list-disc pl-5 space-y-0.5">
          {top.map(([name, e]) => (
            <li key={name}>{name} — {e.count}× (avg severity {(e.sevSum / e.count).toFixed(1)})</li>
          ))}
        </ul>
      </Card>
    </>
  );
}

function AiInsights({ moods, symptoms }: { moods: MoodRow[]; symptoms: SymptomRow[] }) {
  const week = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const moodsThisWeek = moods.filter((m) => new Date(m.created_at).getTime() > week);
  const symsThisWeek = symptoms.filter((s) => new Date(s.created_at).getTime() > week);
  const avgMood = moodsThisWeek.length
    ? moodsThisWeek.reduce((s, m) => s + (MOOD_SCORE[m.mood] ?? 3), 0) / moodsThisWeek.length
    : 0;

  const tips: string[] = [];
  if (avgMood && avgMood < 3) {
    tips.push("Try a 5-minute slow-breathing exercise before bed tonight — exhale longer than you inhale.");
    tips.push("Reach out to one person in your support circle today, even just a quick hello.");
  } else if (avgMood >= 4) {
    tips.push("Your mood has been steady. Keep the routine that's working — sleep, sunlight, movement.");
  } else if (avgMood) {
    tips.push("A short outdoor walk (10–15 minutes) can give your mood a gentle lift.");
  }
  // Symptom-specific tips
  const namesThisWeek = new Set(symsThisWeek.map((s) => s.symptom_name.toLowerCase()));
  if ([...namesThisWeek].some((n) => /headache|migraine/.test(n))) {
    tips.push("Headaches this week — track water intake, screen time, and sleep duration; small shifts often help.");
  }
  if ([...namesThisWeek].some((n) => /anx/.test(n))) {
    tips.push("Anxiety logged — try the 5-4-3-2-1 grounding exercise next time it spikes.");
  }
  if ([...namesThisWeek].some((n) => /sleep|insomnia|tired|fatigue/.test(n))) {
    tips.push("Aim for a consistent wind-down: dim screens 30 minutes before bed, same sleep time daily.");
  }
  if (tips.length === 0) {
    tips.push("Keep logging daily — patterns emerge after a week or two and unlock sharper suggestions.");
  }

  return (
    <>
      <Card title="This week at a glance" tint="var(--lavender)">
        {moodsThisWeek.length} mood{moodsThisWeek.length === 1 ? "" : "s"} ·
        {" "}{symsThisWeek.length} symptom log{symsThisWeek.length === 1 ? "" : "s"} ·
        average mood {avgMood ? avgMood.toFixed(1) : "—"}/5.
      </Card>
      <Card title="Healthy habits to try" tint="var(--soft-mint)">
        <ul className="list-disc pl-5 space-y-1">
          {tips.map((t, i) => <li key={i}>{t}</li>)}
        </ul>
      </Card>
      <Card title="A gentle reminder" tint="var(--soft-peach)">
        Small, consistent actions outperform big bursts. You're doing this for yourself — that already matters. 💜
      </Card>
      <p className="text-[11px] text-muted-foreground italic px-1">
        This is not medical advice. Seek professional care if symptoms are severe or persistent.
      </p>
    </>
  );
}

export type { Kind as InsightKind };
