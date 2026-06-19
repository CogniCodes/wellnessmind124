import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ArrowLeft, Search, Mic } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/app-shell";
import { usePersistent } from "@/lib/store";
import type { SymptomCategory, SymptomLog, Mood } from "@/lib/store";
import { SEED_SYMPTOMS } from "@/lib/seed";
import { toast } from "sonner";

export const Route = createFileRoute("/symptoms/add")({
  head: () => ({ meta: [{ title: "Add Symptoms · SereneMind" }] }),
  component: AddSymptoms,
});

const CATEGORIES: { key: SymptomCategory; emoji: string; tint: string }[] = [
  { key: "Physical", emoji: "🧍", tint: "var(--soft-pink)" },
  { key: "Emotional", emoji: "💜", tint: "var(--lavender)" },
  { key: "Sleep", emoji: "🌙", tint: "var(--soft-sky)" },
  { key: "Pain", emoji: "⚡", tint: "var(--soft-peach)" },
  { key: "Digestion", emoji: "🌿", tint: "var(--soft-mint)" },
];

const SYMPTOMS: Record<SymptomCategory, { name: string; emoji: string; tint: string }[]> = {
  Physical: [
    { name: "Headache", emoji: "🧠", tint: "var(--soft-pink)" },
    { name: "Fever", emoji: "🌡️", tint: "var(--soft-sky)" },
    { name: "Cough", emoji: "🫁", tint: "var(--soft-pink)" },
    { name: "Sore Throat", emoji: "🗣️", tint: "var(--lavender)" },
    { name: "Fatigue", emoji: "🔋", tint: "var(--soft-sky)" },
    { name: "Body Ache", emoji: "💪", tint: "var(--soft-peach)" },
    { name: "Dizziness", emoji: "💫", tint: "var(--lavender)" },
    { name: "Nausea", emoji: "🤢", tint: "var(--soft-mint)" },
    { name: "Cold / Flu", emoji: "❄️", tint: "var(--soft-sky)" },
    { name: "Shortness of Breath", emoji: "🫁", tint: "var(--lavender)" },
    { name: "Chest Pain", emoji: "💖", tint: "var(--soft-pink)" },
    { name: "Other", emoji: "•••", tint: "var(--muted)" },
  ],
  Emotional: [
    { name: "Anxiety", emoji: "😟", tint: "var(--lavender)" },
    { name: "Sadness", emoji: "😢", tint: "var(--soft-sky)" },
    { name: "Anger", emoji: "😠", tint: "var(--soft-pink)" },
    { name: "Loneliness", emoji: "🕊️", tint: "var(--soft-sky)" },
  ],
  Sleep: [
    { name: "Insomnia", emoji: "🌙", tint: "var(--soft-sky)" },
    { name: "Nightmares", emoji: "👻", tint: "var(--lavender)" },
    { name: "Oversleeping", emoji: "💤", tint: "var(--soft-pink)" },
  ],
  Pain: [
    { name: "Back Pain", emoji: "🪑", tint: "var(--soft-peach)" },
    { name: "Joint Pain", emoji: "🦴", tint: "var(--soft-pink)" },
    { name: "Cramps", emoji: "🌀", tint: "var(--lavender)" },
  ],
  Digestion: [
    { name: "Bloating", emoji: "🫃", tint: "var(--soft-mint)" },
    { name: "Acidity", emoji: "🍋", tint: "var(--soft-yellow)" },
    { name: "Indigestion", emoji: "🥴", tint: "var(--soft-peach)" },
  ],
};

function AddSymptoms() {
  const router = useRouter();
  const [, setLogs] = usePersistent<SymptomLog[]>("sm.symptoms", SEED_SYMPTOMS);
  const [category, setCategory] = useState<SymptomCategory>("Physical");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<string | null>("Headache");
  const [severity, setSeverity] = useState(4);
  const [notes, setNotes] = useState("");

  const list = SYMPTOMS[category].filter((s) => s.name.toLowerCase().includes(search.toLowerCase()));
  const selectedDef = Object.values(SYMPTOMS).flat().find((s) => s.name === selected);

  const save = () => {
    if (!selected) return;
    setLogs((prev) => [{
      id: crypto.randomUUID(),
      name: selected,
      category,
      severity,
      notes,
      at: new Date().toISOString(),
      status: "Ongoing",
    }, ...prev]);
    toast.success("Symptom logged ✨");
    router.navigate({ to: "/" });
  };

  return (
    <AppShell>
      <header className="flex items-center gap-3 py-6">
        <Link to="/" className="grid h-11 w-11 place-items-center rounded-full glass-card">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="font-display text-2xl font-bold">Add Symptoms</h1>
          <p className="text-sm text-muted-foreground">Tell us how you're feeling 💜</p>
        </div>
      </header>

      <div className="glass-card rounded-full px-4 py-3 flex items-center gap-3 mb-4">
        <Search className="h-4 w-4 text-muted-foreground" />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search symptoms..."
          className="bg-transparent outline-none flex-1 text-sm"
        />
      </div>

      <div className="flex gap-2 overflow-x-auto scrollbar-thin pb-2 mb-4">
        {CATEGORIES.map((c) => {
          const active = c.key === category;
          return (
            <button
              key={c.key}
              onClick={() => setCategory(c.key)}
              className="rounded-full px-4 py-2 text-sm font-medium flex items-center gap-1.5 shrink-0"
              style={{
                background: active ? `color-mix(in oklab, ${c.tint} 90%, transparent)` : "var(--card)",
                border: active ? "1px solid var(--primary)" : "1px solid var(--border)",
              }}
            >
              <span>{c.emoji}</span> {c.key}
            </button>
          );
        })}
      </div>

      <h2 className="font-display font-bold mb-3">Common {category} Symptoms</h2>
      <div className="grid grid-cols-3 md:grid-cols-4 gap-3 mb-5">
        {list.map((s) => {
          const active = selected === s.name;
          return (
            <button
              key={s.name}
              onClick={() => setSelected(s.name)}
              className="rounded-3xl p-4 flex flex-col items-center gap-1.5 transition-all hover:scale-[1.02] relative"
              style={{
                background: `color-mix(in oklab, ${s.tint} 55%, var(--card))`,
                border: active ? "2px solid var(--secondary)" : "2px solid transparent",
              }}
            >
              {active && <span className="absolute top-1.5 right-1.5 h-5 w-5 grid place-items-center rounded-full bg-secondary text-[10px] text-white">✓</span>}
              <span className="text-2xl">{s.emoji}</span>
              <span className="text-xs font-medium text-center leading-tight">{s.name}</span>
            </button>
          );
        })}
      </div>

      {selected && (
        <div className="glass-card rounded-3xl p-4 mb-4">
          <p className="text-sm font-semibold mb-2">Selected Symptom</p>
          <div className="flex items-center justify-between rounded-2xl p-3"
            style={{ background: `color-mix(in oklab, ${selectedDef?.tint ?? "var(--muted)"} 50%, transparent)` }}>
            <div className="flex items-center gap-2">
              <span className="text-xl">{selectedDef?.emoji}</span>
              <span className="font-medium text-sm">{selected}</span>
            </div>
            <button onClick={() => setSelected(null)} className="text-xs text-destructive font-medium">Remove</button>
          </div>
        </div>
      )}

      {selected && (
        <div className="glass-card rounded-3xl p-4 mb-4">
          <p className="font-semibold text-sm mb-3">How intense is your {selected.toLowerCase()}?</p>
          <div className="flex justify-between text-xs text-muted-foreground mb-1"><span>Mild</span><span>Severe</span></div>
          <input
            type="range" min={1} max={5} value={severity}
            onChange={(e) => setSeverity(Number(e.target.value))}
            className="w-full accent-secondary"
            style={{ accentColor: "var(--secondary)" }}
          />
          <div className="flex justify-between mt-2 text-xs font-semibold">
            {[1, 2, 3, 4, 5].map((n) => (
              <span key={n} style={{ color: n === severity ? "var(--secondary)" : "var(--muted-foreground)" }}>{n}</span>
            ))}
          </div>
        </div>
      )}

      <div className="glass-card rounded-3xl p-4 mb-4">
        <p className="font-semibold text-sm mb-2">Anything else you'd like to add? <span className="text-muted-foreground font-normal">(Optional)</span></p>
        <div className="flex gap-2 items-center rounded-2xl bg-muted/50 px-3 py-2">
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add notes about your symptom..."
            className="bg-transparent outline-none flex-1 text-sm resize-none"
            rows={2}
          />
          <button className="grid h-9 w-9 place-items-center rounded-full bg-card">
            <Mic className="h-4 w-4 text-primary" />
          </button>
        </div>
      </div>

      <button
        onClick={save}
        disabled={!selected}
        className="w-full rounded-full py-4 font-display font-semibold text-white soft-shadow disabled:opacity-50"
        style={{ background: "linear-gradient(90deg, var(--secondary), oklch(0.75 0.16 350))" }}
      >
        Done
      </button>
    </AppShell>
  );
}
