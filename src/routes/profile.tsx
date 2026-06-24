import { createFileRoute } from "@tanstack/react-router";
import { User, LogOut, Moon, Sun, Bell, Lock, Sparkles, Copy, Check } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { useVisitor } from "@/lib/visitor";
import { useMoods, useSymptoms } from "@/lib/db-hooks";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · SereneMind" }] }),
  component: Profile,
});

function Profile() {
  const { visitor, updateName, signOut } = useVisitor();
  const { data: moods = [] } = useMoods();
  const { data: symptoms = [] } = useSymptoms();
  const [dark, setDark] = useState(false);
  const [name, setName] = useState(visitor?.name ?? "");

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  useEffect(() => { setName(visitor?.name ?? ""); }, [visitor?.name]);

  const streak = (() => {
    const days = new Set(moods.map((m) => new Date(m.created_at).toDateString()));
    let s = 0;
    const cur = new Date();
    while (days.has(cur.toDateString())) { s++; cur.setDate(cur.getDate() - 1); }
    return s;
  })();

  const wellness = (() => {
    if (!moods.length) return 50;
    const SCORE: Record<string, number> = { Happy: 5, Calm: 4, Energetic: 5, Frisky: 4, Confused: 3, "Mood swings": 3, "Low energy": 2, Apathetic: 2, Anxious: 2, Irritated: 2, Sad: 1, Depressed: 1 };
    const recent = moods.slice(0, 14);
    const avg = recent.reduce((s, m) => s + (SCORE[m.mood] ?? 3), 0) / recent.length;
    const sevPenalty = symptoms.slice(0, 10).reduce((s, x) => s + x.severity, 0);
    return Math.max(10, Math.min(100, Math.round((avg / 5) * 100) - Math.min(30, sevPenalty)));
  })();

  const saveName = async () => {
    if (!name.trim() || name === visitor?.name) return;
    try {
      await updateName(name);
      toast.success("Name updated 💜");
    } catch {
      toast.error("Could not update name.");
    }
  };

  return (
    <AppShell>
      <PageHeader title="Profile" subtitle="Your wellness journey"
        icon={<User className="h-5 w-5 text-primary" />} />

      <div className="glass-card rounded-3xl p-5 mb-4 text-center">
        <div className="mx-auto h-20 w-20 rounded-full grid place-items-center text-3xl"
          style={{ background: "linear-gradient(135deg, var(--soft-pink), var(--lavender))" }}>
          🐻
        </div>
        <h2 className="font-display text-xl font-bold mt-3">{visitor?.name ?? "—"}</h2>
        <UserIdBadge userId={visitor?.userId ?? ""} />
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl p-3" style={{ background: "color-mix(in oklab, var(--soft-pink) 50%, transparent)" }}>
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="font-display font-bold text-lg">{streak} day{streak === 1 ? "" : "s"}</p>
          </div>
          <div className="rounded-2xl p-3" style={{ background: "color-mix(in oklab, var(--lavender) 50%, transparent)" }}>
            <p className="text-xs text-muted-foreground">Wellness</p>
            <p className="font-display font-bold text-lg">{wellness}/100</p>
          </div>
        </div>
        <label className="block mt-4 text-left">
          <span className="text-xs text-muted-foreground">Display name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} onBlur={saveName}
            className="w-full mt-1 rounded-2xl bg-muted/40 px-3 py-2.5 text-sm outline-none" />
        </label>
      </div>

      <div className="glass-card rounded-3xl p-2">
        <Row icon={<Bell className="h-4 w-4" />} label="Notifications" />
        <Row icon={dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} label="Dark mode"
          right={
            <button onClick={() => setDark((d) => !d)}
              className="h-6 w-11 rounded-full relative transition-colors"
              style={{ background: dark ? "var(--primary)" : "var(--muted)" }}>
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
                style={{ left: dark ? "calc(100% - 22px)" : "2px" }} />
            </button>
          } />
        <Row icon={<Lock className="h-4 w-4" />} label="Privacy" />
        <Row icon={<Sparkles className="h-4 w-4" />} label="About SereneMind" />
      </div>

      <button
        onClick={() => {
          if (confirm("Sign out of this device? Save your User ID first — you'll need it to sign back in.")) {
            signOut();
            toast.success("Signed out");
          }
        }}
        className="w-full mt-4 rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2 text-destructive">
        <LogOut className="h-4 w-4" /> Log Out
      </button>
    </AppShell>
  );
}

function Row({ icon, label, right }: { icon: React.ReactNode; label: string; right?: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 px-3 py-3 rounded-2xl hover:bg-muted/40">
      <div className="grid h-9 w-9 place-items-center rounded-2xl bg-muted/40">{icon}</div>
      <span className="flex-1 text-sm font-medium">{label}</span>
      {right}
    </div>
  );
}

function UserIdBadge({ userId }: { userId: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!userId) return;
    try {
      await navigator.clipboard.writeText(userId);
      setCopied(true);
      toast.success("User ID copied");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Could not copy");
    }
  };
  return (
    <button
      onClick={copy}
      className="mt-2 inline-flex items-center gap-2 rounded-full bg-muted/40 px-3 py-1.5 text-xs font-semibold tracking-widest hover:bg-muted/60"
      title="Copy your User ID"
    >
      <span className="text-muted-foreground font-normal">ID</span>
      <span>{userId || "—"}</span>
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
    </button>
  );
}
