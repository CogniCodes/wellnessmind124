import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MoreHorizontal, Send, Smile, Loader2 } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { useChat, useMoods, useSymptoms, insertChat } from "@/lib/db-hooks";
import { useVisitorId } from "@/lib/visitor";
import { sendChat } from "@/lib/ai.functions";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "AI Companion · SereneMind" }] }),
  component: ChatPage,
});

function ChatPage() {
  const visitorId = useVisitorId();
  const { data: messages = [], isLoading } = useChat();
  const { data: moods = [] } = useMoods();
  const { data: symptoms = [] } = useSymptoms();
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const autoTriggeredRef = useRef(false);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const isToday = (iso: string) => {
    const d = new Date(iso); const n = new Date();
    return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
  };

  // Auto-start an AI conversation when the user opens chat after logging a symptom.
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (autoTriggeredRef.current) return;
    if (isLoading || !visitorId || loading) return;
    const pendingId = localStorage.getItem("sm.pendingSymptomChat");
    if (!pendingId) return;
    const sym = symptoms.find((s) => s.id === pendingId);
    if (!sym) return; // wait until symptoms load or skip if stale
    autoTriggeredRef.current = true;
    localStorage.removeItem("sm.pendingSymptomChat");

    const firstOccurrence = symptoms
      .filter((s) => s.symptom_name === sym.symptom_name)
      .reduce<Date | null>((acc, s) => {
        const d = new Date(s.created_at);
        return !acc || d < acc ? d : acc;
      }, null);
    const durationDays = firstOccurrence
      ? Math.max(1, Math.ceil((Date.now() - firstOccurrence.getTime()) / (24 * 60 * 60 * 1000)))
      : 1;

    (async () => {
      setLoading(true);
      try {
        const reply = await sendChat({ data: {
          messages: [
            ...messages.map((m) => ({ role: m.role, content: m.message })),
            { role: "user" as const, content: `[auto] I just logged a new symptom: ${sym.symptom_name} (severity ${sym.severity}/5). Please analyze it for me.` },
          ],
          context: {
            currentMood: moods.find((m) => isToday(m.created_at))?.mood,
            recentMoods: moods.slice(0, 7).map((m) => ({ mood: m.mood, at: m.created_at })),
            recentSymptoms: symptoms.slice(0, 8).map((s) => ({
              name: s.symptom_name, severity: s.severity, at: s.created_at, notes: s.notes ?? undefined,
            })),
            autoSymptomFocus: {
              name: sym.symptom_name,
              severity: sym.severity,
              at: sym.created_at,
              notes: sym.notes,
              durationDays,
            },
          },
        }});
        await insertChat(visitorId, "assistant", reply.text);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoading, visitorId, symptoms.length]);

  const send = async () => {
    const text = input.trim();
    if (!text || loading || !visitorId) return;
    setInput("");
    setLoading(true);
    try {
      await insertChat(visitorId, "user", text);

      const reply = await sendChat({ data: {
        messages: [
          ...messages.map((m) => ({ role: m.role, content: m.message })),
          { role: "user" as const, content: text },
        ],
        context: {
          currentMood: moods.find((m) => isToday(m.created_at))?.mood,
          recentMoods: moods.slice(0, 7).map((m) => ({ mood: m.mood, at: m.created_at })),
          recentSymptoms: symptoms.slice(0, 8).map((s) => ({
            name: s.symptom_name, severity: s.severity, at: s.created_at, notes: s.notes ?? undefined,
          })),
        },
      }});
      await insertChat(visitorId, "assistant", reply.text);
    } catch (e) {
      console.error(e);
      await insertChat(visitorId, "assistant",
        "I'm having trouble responding right now. Please try again in a moment. 💜");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <header className="flex items-center justify-between py-4">
        <Link to="/" className="grid h-11 w-11 place-items-center rounded-full glass-card"><ArrowLeft className="h-5 w-5" /></Link>
        <div className="flex flex-col items-center">
          <div className="grid h-11 w-11 place-items-center rounded-full text-2xl"
            style={{ background: "color-mix(in oklab, var(--lavender) 80%, transparent)" }}>🪷</div>
          <p className="font-display font-bold text-sm mt-1">AI Wellness Companion <span className="text-secondary">✨</span></p>
          <p className="text-[10px] text-muted-foreground">Always here for you</p>
        </div>
        <button className="grid h-11 w-11 place-items-center rounded-full glass-card"><MoreHorizontal className="h-5 w-5" /></button>
      </header>

      <div className="rounded-2xl px-3 py-2 text-[11px] text-center mb-3"
        style={{ background: "color-mix(in oklab, var(--warning) 50%, transparent)" }}>
        Not medical advice. Seek professional care for emergencies.
      </div>

      <div className="space-y-3 mb-6">
        {isLoading && (
          <div className="grid place-items-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        )}
        {!isLoading && messages.length === 0 && (
          <div className="glass-card rounded-3xl p-5 text-center text-sm text-muted-foreground">
            Hi 🌸 Tell me how you're feeling today, and I'll be here for you.
          </div>
        )}
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.message} time={fmt(m.created_at)} />
        ))}
        {loading && (
          <div className="flex items-end gap-2">
            <Avatar />
            <div className="glass-card rounded-3xl rounded-bl-md px-4 py-3 text-sm">
              <span className="inline-flex gap-1">
                <Dot delay={0} /><Dot delay={150} /><Dot delay={300} />
              </span>
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      <div className="sticky bottom-24 md:bottom-4">
        <div className="glass-card rounded-full pl-4 pr-2 py-2 flex items-center gap-2">
          <Smile className="h-5 w-5 text-muted-foreground" />
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Type a message..."
            className="flex-1 bg-transparent outline-none text-sm py-1"
          />
          <button onClick={send} disabled={loading || !input.trim()}
            className="grid h-10 w-10 place-items-center rounded-full text-white disabled:opacity-50"
            style={{ background: "var(--primary)" }}>
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </AppShell>
  );
}

function Avatar() {
  return (
    <div className="grid h-8 w-8 place-items-center rounded-full text-lg shrink-0"
      style={{ background: "color-mix(in oklab, var(--lavender) 80%, transparent)" }}>🪷</div>
  );
}

function Bubble({ role, content, time }: { role: "user" | "assistant"; content: string; time: string }) {
  const isUser = role === "user";
  return (
    <div className={`flex items-end gap-2 ${isUser ? "justify-end" : ""}`}>
      {!isUser && <Avatar />}
      <div className={`max-w-[80%] rounded-3xl px-4 py-3 text-sm soft-shadow ${isUser ? "rounded-br-md text-foreground" : "rounded-bl-md bg-card"}`}
        style={isUser ? { background: "color-mix(in oklab, var(--lavender) 70%, var(--card))" } : undefined}>
        <p className="whitespace-pre-line leading-relaxed">{content}</p>
        <p className="text-[10px] text-muted-foreground mt-1 text-right" suppressHydrationWarning>{time}</p>
      </div>
    </div>
  );
}
function Dot({ delay }: { delay: number }) {
  return <span className="inline-block h-2 w-2 rounded-full animate-bounce" style={{ background: "var(--primary)", animationDelay: `${delay}ms` }} />;
}
function fmt(iso: string) {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}
