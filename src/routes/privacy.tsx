import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { AppShell } from "@/components/app-shell";

export const Route = createFileRoute("/privacy")({
  head: () => ({ meta: [
    { title: "Privacy Policy · SereneMind" },
    { name: "description", content: "How SereneMind collects, stores, and protects your wellness data." },
  ]}),
  component: Privacy,
});

function Privacy() {
  return (
    <AppShell>
      <header className="flex items-center gap-3 py-6">
        <Link to="/profile" className="grid h-11 w-11 place-items-center rounded-full glass-card">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div className="flex items-center gap-3">
          <div className="grid h-12 w-12 place-items-center rounded-2xl"
            style={{ background: "color-mix(in oklab, var(--lavender) 80%, transparent)" }}>
            <Lock className="h-6 w-6 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold">Privacy Policy</h1>
            <p className="text-xs text-muted-foreground">Last updated: June 2026</p>
          </div>
        </div>
      </header>

      <article className="glass-card rounded-3xl p-5 space-y-5 text-sm leading-relaxed">
        <Section title="Our promise">
          SereneMind is built around your privacy. We deliberately don't ask for your real name,
          email, or phone number to use the app. Your User ID is the only thing tying your data to you.
        </Section>

        <Section title="Data we collect">
          <ul className="list-disc pl-5 space-y-1">
            <li><strong>Profile</strong> — a display name you choose and optional health details you add (date of birth, gender, blood group, height, weight, contact number, medications, allergies, avatar).</li>
            <li><strong>Moods</strong> — the mood you log each day.</li>
            <li><strong>Symptoms</strong> — names, severity (1–5), and any notes you add.</li>
            <li><strong>AI conversations</strong> — the messages you exchange with the AI Wellness Companion.</li>
            <li><strong>Support circle</strong> — names, relationship, and phone numbers of contacts you add.</li>
            <li><strong>Community posts and comments</strong> — content you publish under an anonymous handle.</li>
            <li><strong>Medical history</strong> — entries you create.</li>
            <li><strong>Game progress</strong> — scores and completion times for wellness games.</li>
          </ul>
        </Section>

        <Section title="How mood and symptom data are stored">
          Mood and symptom entries are stored against your User ID in our database. They are used to
          power your dashboard, charts, and personalized AI insights. We do not sell, rent, or share
          this data with advertisers.
        </Section>

        <Section title="AI conversations">
          When you chat with the AI companion, your recent moods, symptoms, and the messages in the
          current conversation are sent to an AI model so it can give context-aware responses.
          Conversations are saved against your User ID so you can keep continuity, and you can
          permanently delete them at any time using <em>Clear chat</em> in the chat menu.
        </Section>

        <Section title="Security">
          Data is transmitted over HTTPS and stored on a managed Postgres database with row-level
          access controls. Avatars are stored in private object storage and served through signed URLs.
        </Section>

        <Section title="Data ownership and your rights">
          <ul className="list-disc pl-5 space-y-1">
            <li>You own your data. You can edit or delete entries from inside the app.</li>
            <li>You can clear your AI chat history at any time.</li>
            <li>You can sign out by clearing your User ID from this device. Without your User ID nobody can sign back in.</li>
            <li>To request full deletion of your account and data, contact support and include your User ID.</li>
          </ul>
        </Section>

        <Section title="Not medical advice">
          SereneMind is a wellness companion, not a medical device. Insights, suggestions, and AI
          responses are informational only. Always consult a qualified healthcare professional for
          medical decisions, and seek emergency care if symptoms are severe or worsening.
        </Section>
      </article>
    </AppShell>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="font-display font-bold mb-1.5">{title}</h2>
      <div className="text-muted-foreground">{children}</div>
    </section>
  );
}
