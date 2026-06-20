import { createFileRoute } from "@tanstack/react-router";
import { Search, ClipboardList, Loader2 } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { useSymptoms, type SymptomRow } from "@/lib/db-hooks";

export const Route = createFileRoute("/symptoms-history")({
  head: () => ({ meta: [{ title: "Symptoms History · SereneMind" }] }),
  component: SymptomsHistory,
});

const FILTERS = ["All", "Recent", "Frequent", "Severe"] as const;

function SymptomsHistory() {
  const { data: logs = [], isLoading } = useSymptoms();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");

  const filtered = (() => {
    if (filter === "Recent") return [...logs].slice(0, 10);
    if (filter === "Severe") return logs.filter((l) => l.severity >= 4);
    if (filter === "Frequent") {
      const counts = new Map<string, number>();
      logs.forEach((l) => counts.set(l.symptom_name, (counts.get(l.symptom_name) ?? 0) + 1));
      return [...logs].sort((a, b) => (counts.get(b.symptom_name)! - counts.get(a.symptom_name)!));
    }
    return logs;
  })();

  const avg = logs.length ? logs.reduce((s, l) => s + l.severity, 0) / logs.length : 0;
  const counts = new Map<string, number>();
  logs.forEach((l) => counts.set(l.symptom_name, (counts.get(l.symptom_name) ?? 0) + 1));
  const most = [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? ["—", 0];

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
        {FILTERS.map((f) => (
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
        <StatCard tint="var(--soft-pink)" emoji="📋" title="Total Logged" value={String(logs.length)} sub="All time" />
        <StatCard tint="var(--lavender)" emoji="🧠" title="Most Common" value={String(most[0])} sub={`${most[1]} times`} />
        <StatCard tint="var(--soft-yellow)" emoji="📊" title="Avg Severity" value={`${avg.toFixed(1)} / 5`} sub={avg >= 3.5 ? "Moderate" : "Mild"} />
      </div>

      {isLoading ? (
        <div className="grid place-items-center py-10"><Loader2 className="h-5 w-5 animate-spin text-primary" /></div>
      ) : logs.length === 0 ? (
        <div className="glass-card rounded-3xl p-8 text-center">
          <p className="text-3xl">🌿</p>
          <p className="font-display font-bold mt-1">No symptoms yet</p>
          <p className="text-sm text-muted-foreground">Log your first symptom from the dashboard.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {groups.map(([dayLabel, items], gi) => (
            <div key={`${dayLabel}-${gi}`}>
              <div className="flex items-center justify-between mb-2 px-1">
                <p className="font-display font-semibold text-sm">{dayLabel}</p>
                <p className="text-xs text-muted-foreground" suppressHydrationWarning>
                  {items[0] && new Date(items[0].created_at).toLocaleDateString(undefined, { day: "numeric", month: "long", year: "numeric" })}
                </p>
              </div>
              <div className="space-y-2">
                {items.map((l) => <SymptomRowView key={l.id} log={l} />)}
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}

function SymptomRowView({ log }: { log: SymptomRow }) {
  return (
    <div className="glass-card rounded-3xl p-3 flex items-center gap-3">
      <div className="grid h-12 w-12 place-items-center rounded-2xl text-xl shrink-0"
        style={{ background: "color-mix(in oklab, var(--soft-pink) 55%, transparent)" }}>
        💊
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-sm">{log.symptom_name}</p>
        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
          <span>Severity</span>
          <span className="flex gap-0.5">
            {[1,2,3,4,5].map((n) => (
              <span key={n} className="h-1.5 w-1.5 rounded-full"
                style={{ background: n <= log.severity ? "var(--secondary)" : "var(--muted)" }} />
            ))}
          </span>
          <span>{log.severity}/5</span>
        </div>
        {log.notes && <p className="text-xs text-muted-foreground mt-0.5 truncate">{log.notes}</p>}
        <p className="text-xs text-muted-foreground mt-0.5" suppressHydrationWarning>
          {new Date(log.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </p>
      </div>
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

function groupByDay(logs: SymptomRow[]): [string, SymptomRow[]][] {
  const today = new Date();
  const ystr = new Date(today); ystr.setDate(today.getDate() - 1);
  const map = new Map<string, SymptomRow[]>();
  for (const l of logs) {
    const d = new Date(l.created_at);
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
