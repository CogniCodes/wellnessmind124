import { useEffect, useMemo, useState } from "react";
import { Bell, Flame, ClipboardList, Sparkles, BarChart3, Pill, Check } from "lucide-react";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription,
} from "@/components/ui/sheet";
import { useMoods, useSymptoms, useMedical, type MoodRow, type SymptomRow, type MedicalRow } from "@/lib/db-hooks";

const READ_KEY = "sm.notif.readIds";

type Notif = {
  id: string;
  icon: React.ReactNode;
  title: string;
  body: string;
  tint: string;
  at: Date;
};

function getRead(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try { return new Set(JSON.parse(localStorage.getItem(READ_KEY) || "[]")); }
  catch { return new Set(); }
}
function setRead(ids: Set<string>) {
  if (typeof window === "undefined") return;
  localStorage.setItem(READ_KEY, JSON.stringify([...ids]));
}

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function buildNotifications(moods: MoodRow[], symptoms: SymptomRow[], medical: MedicalRow[]): Notif[] {
  const out: Notif[] = [];
  const now = new Date();
  const todayKey = now.toISOString().slice(0, 10);

  // Streak
  const days = new Set(moods.map((m) => new Date(m.created_at).toDateString()));
  let streak = 0;
  const cur = new Date();
  while (days.has(cur.toDateString())) { streak++; cur.setDate(cur.getDate() - 1); }
  const moodToday = moods.some((m) => isSameDay(new Date(m.created_at), now));
  if (streak >= 3 && moodToday) {
    out.push({
      id: `streak-${todayKey}-${streak}`,
      icon: <Flame className="h-4 w-4" style={{ color: "oklch(0.65 0.2 30)" }} />,
      title: `${streak}-day streak! 🔥`,
      body: `You've checked in ${streak} days in a row. Keep going — consistency is the magic.`,
      tint: "var(--soft-pink)",
      at: now,
    });
  } else if (!moodToday) {
    out.push({
      id: `mood-reminder-${todayKey}`,
      icon: <Flame className="h-4 w-4" style={{ color: "oklch(0.65 0.2 30)" }} />,
      title: "Don't break your streak 🌿",
      body: "Take a moment to log today's mood. It only takes a few seconds.",
      tint: "var(--soft-pink)",
      at: now,
    });
  }

  // Symptom logging reminder
  const last24 = Date.now() - 24 * 60 * 60 * 1000;
  const recentSym = symptoms.find((s) => new Date(s.created_at).getTime() > last24);
  if (!recentSym) {
    out.push({
      id: `symptom-reminder-${todayKey}`,
      icon: <ClipboardList className="h-4 w-4 text-primary" />,
      title: "How is your body feeling?",
      body: "Logging symptoms daily helps spot patterns. Tap Add Symptoms when you have a moment.",
      tint: "var(--lavender)",
      at: now,
    });
  }

  // AI insights available
  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const moodsThisWeek = moods.filter((m) => new Date(m.created_at).getTime() > weekAgo).length;
  const symsThisWeek = symptoms.filter((s) => new Date(s.created_at).getTime() > weekAgo).length;
  if (moodsThisWeek >= 3 && symsThisWeek >= 2) {
    out.push({
      id: `ai-insight-${todayKey}`,
      icon: <Sparkles className="h-4 w-4 text-secondary" />,
      title: "New AI insights ready ✨",
      body: "Your wellness companion has fresh observations on your week. Open AI Chat to explore.",
      tint: "var(--lavender)",
      at: now,
    });
  }

  // Weekly summary (Sun/Mon)
  const dow = now.getDay();
  if (dow === 0 || dow === 1) {
    const weekKey = `${now.getFullYear()}-W${Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / (7 * 86400000))}`;
    out.push({
      id: `weekly-${weekKey}`,
      icon: <BarChart3 className="h-4 w-4 text-primary" />,
      title: "Your weekly wellness summary",
      body: `This week you logged ${moodsThisWeek} mood${moodsThisWeek === 1 ? "" : "s"} and ${symsThisWeek} symptom${symsThisWeek === 1 ? "" : "s"}. Visit your dashboard for the full picture.`,
      tint: "var(--soft-sky)",
      at: now,
    });
  }

  // Medication reminder (placeholder, sourced from medical_history Medication entries)
  const meds = medical.filter((m) => /med/i.test(m.category));
  if (meds.length > 0) {
    const m = meds[0];
    out.push({
      id: `med-${m.id}-${todayKey}`,
      icon: <Pill className="h-4 w-4" style={{ color: "oklch(0.7 0.15 150)" }} />,
      title: `Reminder: ${m.title}`,
      body: m.description ?? "Don't forget your medication today.",
      tint: "var(--soft-mint)",
      at: now,
    });
  } else {
    out.push({
      id: `med-placeholder-${todayKey}`,
      icon: <Pill className="h-4 w-4" style={{ color: "oklch(0.7 0.15 150)" }} />,
      title: "Add medication reminders",
      body: "Track medications under Medical History to get gentle daily reminders here.",
      tint: "var(--soft-mint)",
      at: now,
    });
  }

  return out;
}

export function NotificationsDrawer({
  open, onOpenChange,
}: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data: moods = [] } = useMoods();
  const { data: symptoms = [] } = useSymptoms();
  const { data: medical = [] } = useMedical();

  const notifications = useMemo(
    () => buildNotifications(moods, symptoms, medical),
    [moods, symptoms, medical],
  );

  const [read, setReadState] = useState<Set<string>>(() => getRead());

  useEffect(() => {
    if (!open) return;
    const next = new Set(read);
    notifications.forEach((n) => next.add(n.id));
    setReadState(next);
    setRead(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2 font-display">
            <Bell className="h-5 w-5 text-primary" /> Notifications
          </SheetTitle>
          <SheetDescription>
            Gentle reminders to support your wellness journey.
          </SheetDescription>
        </SheetHeader>

        <div className="mt-5 space-y-3">
          {notifications.length === 0 && (
            <div className="rounded-2xl bg-muted/40 p-6 text-center text-sm text-muted-foreground">
              You're all caught up 💜
            </div>
          )}
          {notifications.map((n) => {
            const wasUnread = !getRead().has(n.id) && !read.has(n.id);
            return (
              <div
                key={n.id}
                className="rounded-2xl p-3 flex gap-3 relative"
                style={{ background: `color-mix(in oklab, ${n.tint} 55%, var(--card))` }}
              >
                <div className="grid h-9 w-9 place-items-center rounded-2xl bg-card shrink-0">
                  {n.icon}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm flex items-center gap-2">
                    {n.title}
                    {wasUnread && <span className="h-2 w-2 rounded-full bg-secondary" />}
                  </p>
                  <p className="text-xs text-muted-foreground leading-snug mt-0.5">{n.body}</p>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-6 text-center text-xs text-muted-foreground inline-flex items-center gap-1.5">
          <Check className="h-3 w-3" /> Marked as read
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Returns count of unread notifications based on current data. */
export function useUnreadNotifCount(): number {
  const { data: moods = [] } = useMoods();
  const { data: symptoms = [] } = useSymptoms();
  const { data: medical = [] } = useMedical();
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const i = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(i);
  }, []);
  return useMemo(() => {
    const list = buildNotifications(moods, symptoms, medical);
    const read = getRead();
    return list.filter((n) => !read.has(n.id)).length;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moods, symptoms, medical, tick]);
}
