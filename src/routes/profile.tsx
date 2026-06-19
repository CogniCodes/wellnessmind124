import { createFileRoute } from "@tanstack/react-router";
import { User, LogOut, Moon, Sun, Bell, Lock, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/app-shell";
import { PageHeader } from "@/components/page-header";
import { usePersistent } from "@/lib/store";
import { DEFAULT_PROFILE } from "@/lib/seed";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile · SereneMind" }] }),
  component: Profile,
});

function Profile() {
  const [profile, setProfile] = usePersistent("sm.profile", DEFAULT_PROFILE);
  const [dark, setDark] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  return (
    <AppShell>
      <PageHeader title="Profile" subtitle="Your wellness journey"
        icon={<User className="h-5 w-5 text-primary" />} />

      <div className="glass-card rounded-3xl p-5 mb-4 text-center">
        <div className="mx-auto h-20 w-20 rounded-full grid place-items-center text-3xl"
          style={{ background: "linear-gradient(135deg, var(--soft-pink), var(--lavender))" }}>
          🐻
        </div>
        <h2 className="font-display text-xl font-bold mt-3">{profile.name}</h2>
        <p className="text-xs text-muted-foreground">Member since this week ✨</p>
        <div className="grid grid-cols-2 gap-3 mt-5">
          <div className="rounded-2xl p-3" style={{ background: "color-mix(in oklab, var(--soft-pink) 50%, transparent)" }}>
            <p className="text-xs text-muted-foreground">Streak</p>
            <p className="font-display font-bold text-lg">{profile.streak} days</p>
          </div>
          <div className="rounded-2xl p-3" style={{ background: "color-mix(in oklab, var(--lavender) 50%, transparent)" }}>
            <p className="text-xs text-muted-foreground">Wellness</p>
            <p className="font-display font-bold text-lg">{profile.wellnessScore}/100</p>
          </div>
        </div>
        <label className="block mt-4 text-left">
          <span className="text-xs text-muted-foreground">Name</span>
          <input value={profile.name} onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
            className="w-full mt-1 rounded-2xl bg-muted/40 px-3 py-2.5 text-sm outline-none" />
        </label>
      </div>

      <div className="glass-card rounded-3xl p-2">
        <Row icon={<Bell className="h-4 w-4" />} label="Notifications" />
        <Row icon={dark ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />} label="Dark mode"
          right={
            <button onClick={() => setDark(d => !d)}
              className="h-6 w-11 rounded-full relative transition-colors"
              style={{ background: dark ? "var(--primary)" : "var(--muted)" }}>
              <span className="absolute top-0.5 h-5 w-5 rounded-full bg-white transition-all"
                style={{ left: dark ? "calc(100% - 22px)" : "2px" }} />
            </button>
          } />
        <Row icon={<Lock className="h-4 w-4" />} label="Privacy" />
        <Row icon={<Sparkles className="h-4 w-4" />} label="About SereneMind" />
      </div>

      <button className="w-full mt-4 rounded-full py-3 text-sm font-semibold flex items-center justify-center gap-2 text-destructive">
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
