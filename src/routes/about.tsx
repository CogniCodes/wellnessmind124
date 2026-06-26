import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Sparkles, Heart, Activity, MessageCircle, Users, CalendarDays, BookOpen } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/about")({
  head: () => ({ meta: [
    { title: "About SereneMind" },
    { name: "description", content: "SereneMind — a gentle daily companion for mental wellness, mood tracking, and symptom awareness." },
  ]}),
  component: About,
});

function About() {
  return (
    <AppShell>
      <header className="flex items-center gap-3 py-6">
        <Link to="/profile" className="grid h-11 w-11 place-items-center rounded-full glass-card">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl"
            style={{ background: "color-mix(in oklab, var(--lavender) 80%, transparent)" }}>
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">About SereneMind</h1>
            <p className="text-xs text-muted-foreground">A gentle companion for your mind 💜</p>
          </div>
        </div>
      </header>

      <section className="glass-card rounded-3xl p-5 mb-4">
        <p className="text-sm leading-relaxed">
          SereneMind is a calm, private daily companion built to help you notice how you feel, spot
          patterns in your wellbeing, and take small steps toward feeling steadier. We believe
          taking care of your mind should feel kind — not clinical.
        </p>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Feat tint="var(--soft-pink)" icon={<Heart className="h-5 w-5 text-secondary" />} title="Daily mood check-ins">
          Tap a feeling, see how it shifts over time, and build a streak that gently reminds you to come back.
        </Feat>
        <Feat tint="var(--soft-sky)" icon={<Activity className="h-5 w-5 text-primary" />} title="Symptom logging">
          Track headaches, fatigue, sleep, pain — anything your body is telling you — with severity and notes.
        </Feat>
        <Feat tint="var(--lavender)" icon={<MessageCircle className="h-5 w-5 text-primary" />} title="AI-powered insights">
          A warm AI companion analyzes your moods and symptoms to suggest small, personalized next steps.
        </Feat>
        <Feat tint="var(--soft-mint)" icon={<CalendarDays className="h-5 w-5" style={{ color: "oklch(0.55 0.15 160)" }} />} title="Health timeline">
          Your mood and symptom history lives in one place so you can share clear summaries with a clinician if you choose.
        </Feat>
        <Feat tint="var(--soft-peach)" icon={<Users className="h-5 w-5 text-secondary" />} title="Support circle">
          Add a small list of trusted people. With one tap, let them know you'd like support — no awkward explaining.
        </Feat>
        <Feat tint="var(--soft-yellow)" icon={<BookOpen className="h-5 w-5" style={{ color: "oklch(0.6 0.18 80)" }} />} title="Community">
          Share a thought anonymously and read others'. You are not alone — quite literally.
        </Feat>
      </div>

      <section className="glass-card rounded-3xl p-5 mt-4">
        <h2 className="font-display font-bold mb-2">Mental health is health</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          One in eight people lives with a mental-health condition, and many more experience times of
          stress, anxiety, or low mood. Talking about it, tracking it, and seeking support are all
          signs of strength. SereneMind exists to make those first small steps a little easier — and
          to remind you, every time you open the app, that you matter. 🌿
        </p>
        <p className="text-xs text-muted-foreground mt-3 italic">
          SereneMind is a wellness companion, not a medical device. Please seek professional care if
          symptoms are severe or persistent.
        </p>
      </section>
    </AppShell>
  );
}

function Feat({ tint, icon, title, children }: { tint: string; icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl p-4 soft-shadow"
      style={{ background: `color-mix(in oklab, ${tint} 60%, var(--card))` }}>
      <div className="flex items-center gap-2 mb-1.5">
        <div className="grid h-8 w-8 place-items-center rounded-2xl bg-card">{icon}</div>
        <p className="font-display font-semibold">{title}</p>
      </div>
      <p className="text-sm text-muted-foreground leading-snug">{children}</p>
    </div>
  );
}
