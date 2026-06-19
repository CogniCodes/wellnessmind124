import { createFileRoute } from "@tanstack/react-router";
import { Search, ClipboardList } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { usePersistent } from "@/lib/store";
import type { SymptomLog } from "@/lib/store";
import { SEED_SYMPTOMS } from "@/lib/seed";
import { moodEmoji } from "@/lib/moods";

export const Route = createFileRoute("/symptoms-history")({
  head: () => ({ meta: [{ title: "Symptoms History · SereneMind" }] }),
  component: SymptomsHistory,
});

const FILTERS = ["All", "Recent", "Frequent", "Severe"] as const;

function SymptomsHistory() {
  const [logs] = usePersistent<SymptomLog[]>("sm.symptoms", SEED_SYMPTOMS);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const filtered = (() => {
    if (filter === "Recent") return [...logs].sort((a, b) => +new Date(b.at) - +new Date(a.at)).slice(0, 10);
    if (filter === "Severe") return logs.filter(l => l.severity >= 4);
    if (filter === "Frequent") {
      const counts = new Map<string, number>();
      logs.forEach(l => counts.set(l.name, (counts.get(l.name) ?? 0) + 1));
      return [...logs].sort((a, b) => (counts.get(b.name)! - counts.get(a.name)!));
    }
    return logs;
  })();

  const avg = logs.reduce((s, l) => s + l.severity, 0) / Math.max(1, logs.length);
  const counts = new Map<string, number>();
  logs.forEach(l => counts.set(l.name, (counts.get(l.name) ?? 0) + 1));
  const most = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["Headache", 0];

  const groups = groupByDay(filtered);

  return (
    <AppShell>
      <PageHeader title="Symptoms History" subtitle="Track your symptoms over time"
        icon={<ClipboardList className="h-5 w-5 text-primary" />}
        right={
          <button className="grid h-11 w-11 place-items-center rounded-full glass-card">
            <Search className="h-4 w-4" />
          </button>
        }
      />

      <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className="rounded-full px-4 py-1.5 text-sm font-medium shrink-0"
            style={{
              background: filter === f ? "var(--primary)" : "var(--card)",
              color: filter === f ? "var(--primary-foreground)" : "var(--foreground)",
              border: filter === f ? "none" : "1px solid var(--border)",
            }}>
            {f}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <StatCard tint="var(--soft-pink)" emoji="📋" title="Total Logged" value={String(logs.length)} sub="This month" />
        <StatCard tint="var(--lavender)" emoji="🧠" title="Most Common" value={String(most[0])} sub={`${most[1]} times`} />
        <StatCard tint="var(--soft-yellow)" emoji="📊" title="Avg Severity" value={`${avg.toFixed(1)} / 5`} sub={avg >= 3.5 ? "Moderate" : "Mild"} />
      </div>

      <div className="space-y-4">
        {groups.map(([dayLabel, items], gi) => (
          <div key={`${dayLabel}-${gi}`}>
            <div className="flex items-center justify-between mb-2 px-1">
              <p className="font-display font-semibold text-sm">{dayLabel}</p>
              <p className="text-xs text-muted-foreground">{items[0] && new Date(items[0].at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}</p>
            </div>
            <div className="space-y-2">
              {items.map(l => <SymptomRow key={l.id} log={l} />)}
            </div>
          </div>
        ))}
      </div>
    </AppShell>
  );
}

function SymptomRow({ log }: { log: SymptomLog }) {
  return (
    <div className="glass-card rounded-3xl p-3 flex items-center gap-3">
      <div className="grid h-12 w-12 place-items-center rounded-2xl text-xl shrink-0"
        style={{ background: "color-mix(in oklab, var(--soft-pink) 55%, transparent)" }}>
        💊
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{log.name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>Severity</span>
          <span className="flex gap-0.5">
            {[1,2,3,4,5].map(n => (
              <span key={n} className="h-1.5 w-1.5 rounded-full"
                style={{ background: n <= log.severity ? "var(--secondary)" : "var(--muted)" }} />
            ))}
          </span>
          <span>{log.severity}/5</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          {log.mood && <span>Mood {moodEmoji(log.mood)} {log.mood}</span>}
          <span>· {new Date(log.at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
        </div>
      </div>
      <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0"
        style={{
          background: log.status === "Ongoing" ? "color-mix(in oklab, var(--warning) 80%, transparent)" : "color-mix(in oklab, var(--success) 50%, transparent)",
        }}>
        {log.status ?? "Logged"}
      </span>
    </div>
  );
}

function StatCard({ tint, emoji, title, value, sub }: { tint: string; emoji: string; title: string; value: string; sub: string }) {
  return (
    <div className="rounded-3xl p-3 soft-shadow text-center" style={{ background: `color-mix(in oklab, ${tint} 60%, var(--card))` }}>
      <div className="text-xl">{emoji}</div>
      <p className="text-[10px] text-muted-foreground mt-1">{title}</p>
      <p className="font-display font-bold text-sm mt-0.5 truncate">{value}</p>
      <p className="text-[10px] text-muted-foreground truncate">{sub}</p>
    </div>
  );
}

function groupByDay(logs: SymptomLog[]): [string, SymptomLog[]][] {
  const today = new Date();
  const ystr = new Date(today); ystr.setDate(today.getDate() - 1);
  const map = new Map<string, SymptomLog[]>();
  for (const l of logs) {
    const d = new Date(l.at);
    let key = d.toLocaleDateString(undefined, { weekday: "long" });
    if (sameDay(d, today)) key = "Today";
    else if (sameDay(d, ystr)) key = "Yesterday";
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(l);
  }
  return [...map.entries()];
}
function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
