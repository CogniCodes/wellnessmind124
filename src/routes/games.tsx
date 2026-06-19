import { createFileRoute } from "@tanstack/react-router";
import { Gamepad2, Wind, Brain, Palette, Timer } from "lucide-react";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/games")({
  head: () => ({ meta: [{ title: "Wellness Games · SereneMind" }] }),
  component: Games,
});

function Games() {
  const [game, setGame] = useState<null | "breath" | "memory" | "color" | "timer">(null);

  return (
    <AppShell>
      <PageHeader title="Wellness Games" subtitle="Calming mini-games to reset your mind"
        icon={<Gamepad2 className="h-5 w-5 text-primary" />} />

      {!game && (
        <div className="grid grid-cols-2 gap-3">
          <GameCard tint="var(--lavender)" icon={<Wind className="h-6 w-6 text-primary" />} title="Breathing" sub="Slow box breathing"
            onClick={() => setGame("breath")} />
          <GameCard tint="var(--soft-pink)" icon={<Brain className="h-6 w-6 text-secondary" />} title="Memory Match" sub="Calm your focus"
            onClick={() => setGame("memory")} />
          <GameCard tint="var(--soft-mint)" icon={<Palette className="h-6 w-6" />} title="Mood Coloring" sub="Pick a color, fill the petals"
            onClick={() => setGame("color")} />
          <GameCard tint="var(--soft-peach)" icon={<Timer className="h-6 w-6" />} title="Relaxation Timer" sub="A guided 2-min reset"
            onClick={() => setGame("timer")} />
        </div>
      )}

      {game && (
        <div className="glass-card rounded-3xl p-5 mt-4">
          <button onClick={() => setGame(null)} className="text-xs text-primary font-medium mb-3">← All games</button>
          {game === "breath" && <Breath />}
          {game === "memory" && <Memory />}
          {game === "color" && <Coloring />}
          {game === "timer" && <RelaxTimer />}
        </div>
      )}
    </AppShell>
  );
}

function GameCard({ tint, icon, title, sub, onClick }: { tint: string; icon: React.ReactNode; title: string; sub: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="rounded-3xl p-5 text-left soft-shadow"
      style={{ background: `color-mix(in oklab, ${tint} 65%, var(--card))` }}>
      <div className="grid h-12 w-12 place-items-center rounded-2xl bg-card mb-3">{icon}</div>
      <p className="font-display font-bold">{title}</p>
      <p className="text-xs text-muted-foreground">{sub}</p>
    </button>
  );
}

function Breath() {
  const [phase, setPhase] = useState<"Inhale" | "Hold" | "Exhale" | "Rest">("Inhale");
  useEffect(() => {
    const seq: Array<typeof phase> = ["Inhale", "Hold", "Exhale", "Rest"];
    let i = 0;
    const id = setInterval(() => { i = (i + 1) % 4; setPhase(seq[i]); }, 4000);
    return () => clearInterval(id);
  }, []);
  const scale = phase === "Inhale" ? 1.3 : phase === "Exhale" ? 0.7 : 1;
  return (
    <div className="grid place-items-center py-10">
      <motion.div animate={{ scale }} transition={{ duration: 4, ease: "easeInOut" }}
        className="h-48 w-48 rounded-full grid place-items-center text-primary-foreground font-display font-bold text-2xl"
        style={{ background: "linear-gradient(135deg, var(--primary), var(--secondary))" }}>
        {phase}
      </motion.div>
      <p className="mt-6 text-sm text-muted-foreground">4-4-4-4 box breathing · breathe with the orb</p>
    </div>
  );
}

const EMOJIS = ["🌸","🌿","🦋","🌙","☀️","🍑","💜","✨"];
function Memory() {
  const [cards, setCards] = useState(() => shuffle([...EMOJIS, ...EMOJIS].map((e, i) => ({ id: i, emoji: e, open: false, done: false }))));
  const [picked, setPicked] = useState<number[]>([]);
  const open = (id: number) => {
    if (picked.length === 2 || cards[id].open) return;
    const next = cards.map(c => c.id === id ? { ...c, open: true } : c);
    const p = [...picked, id];
    setCards(next); setPicked(p);
    if (p.length === 2) {
      const [a, b] = p;
      setTimeout(() => {
        setCards(prev => prev.map(c => {
          if (c.id === a || c.id === b) {
            const match = next[a].emoji === next[b].emoji;
            return { ...c, done: c.done || match, open: match };
          }
          return c;
        }));
        setPicked([]);
      }, 700);
    }
  };
  return (
    <div className="grid grid-cols-4 gap-2 max-w-sm mx-auto">
      {cards.map(c => (
        <button key={c.id} onClick={() => open(c.id)}
          className="aspect-square rounded-2xl grid place-items-center text-2xl"
          style={{ background: c.open || c.done ? "color-mix(in oklab, var(--lavender) 80%, transparent)" : "var(--card)" }}>
          {c.open || c.done ? c.emoji : "?"}
        </button>
      ))}
    </div>
  );
}
function shuffle<T>(a: T[]) { return [...a].sort(() => Math.random() - 0.5); }

function Coloring() {
  const colors = ["#F9A8D4", "#C084FC", "#86EFAC", "#FDE68A", "#7DD3FC", "#FCA5A5"];
  const [color, setColor] = useState(colors[0]);
  const [fills, setFills] = useState<string[]>(Array(6).fill("transparent"));
  const setPetal = (i: number) => setFills(f => f.map((v, j) => j === i ? color : v));
  return (
    <div className="flex flex-col items-center gap-4 py-6">
      <svg viewBox="-50 -50 100 100" className="h-64 w-64">
        {Array.from({ length: 6 }).map((_, i) => {
          const angle = (i / 6) * Math.PI * 2;
          const x = Math.cos(angle) * 22, y = Math.sin(angle) * 22;
          return (
            <circle key={i} cx={x} cy={y} r={18} fill={fills[i]} stroke="#C084FC" strokeWidth={1.5}
              onClick={() => setPetal(i)} className="cursor-pointer" />
          );
        })}
        <circle cx={0} cy={0} r={10} fill="#FDE68A" stroke="#C084FC" strokeWidth={1.5} />
      </svg>
      <div className="flex gap-2">
        {colors.map(c => (
          <button key={c} onClick={() => setColor(c)} className="h-8 w-8 rounded-full"
            style={{ background: c, outline: color === c ? "2px solid var(--primary)" : "none", outlineOffset: 2 }} />
        ))}
      </div>
    </div>
  );
}

function RelaxTimer() {
  const total = 120;
  const [left, setLeft] = useState(total);
  const [run, setRun] = useState(false);
  useEffect(() => {
    if (!run) return;
    const id = setInterval(() => setLeft(l => Math.max(0, l - 1)), 1000);
    return () => clearInterval(id);
  }, [run]);
  const pct = (1 - left / total) * 100;
  return (
    <div className="flex flex-col items-center py-6">
      <div className="relative h-48 w-48 rounded-full grid place-items-center"
        style={{ background: `conic-gradient(var(--primary) ${pct}%, var(--muted) 0)` }}>
        <div className="absolute inset-3 rounded-full bg-card grid place-items-center">
          <p className="font-display text-3xl font-bold">{String(Math.floor(left / 60)).padStart(2, "0")}:{String(left % 60).padStart(2, "0")}</p>
        </div>
      </div>
      <button onClick={() => { if (left === 0) setLeft(total); setRun(r => !r); }}
        className="mt-6 rounded-full px-6 py-3 text-white font-semibold" style={{ background: "var(--primary)" }}>
        {run ? "Pause" : left === total ? "Start" : left === 0 ? "Restart" : "Resume"}
      </button>
    </div>
  );
}
