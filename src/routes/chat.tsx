import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { ArrowLeft, MoreHorizontal, Send, Smile } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { AppShell } from "@/components/app-shell";
import { usePersistent } from "@/lib/store";
import type { ChatMessage } from "@/lib/store";
import { sendChat } from "@/lib/ai.functions";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "AI Companion · SereneMind" }] }),
  component: ChatPage,
});

const WELCOME: ChatMessage[] = [
  { id: "w1", role: "assistant", at: new Date().toISOString(),
    content: "I've analyzed your symptoms from today." },
  { id: "w2", role: "assistant", at: new Date().toISOString(),
    content: "It looks like you had a headache (intensity 4) and felt low energy. Here's what I suggest:\n• 💧 Drink enough water\n• 🌿 Take a short break and rest your eyes\n• 🌬️ Try 5 minutes of deep breathing\n• 💡 Avoid screens for some time" },
];

function ChatPage() {
  const [messages, setMessages] = usePersistent<ChatMessage[]>("sm.chat", WELCOME);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, loading]);

  const send = async () => {
    const text = input.trim();
    if (!text) return;
    const userMsg: ChatMessage = { id: crypto.randomUUID(), role: "user", content: text, at: new Date().toISOString() };
    setMessages((p) => [...p, userMsg]);
    setInput("");
    setLoading(true);
    try {
      const reply = await sendChat({ data: { messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })) } });
      setMessages((p) => [...p, { id: crypto.randomUUID(), role: "assistant", content: reply.text, at: new Date().toISOString() }]);
    } catch (e: any) {
      setMessages((p) => [...p, { id: crypto.randomUUID(), role: "assistant", content: "I'm having trouble responding right now. Please try again in a moment. 💜", at: new Date().toISOString() }]);
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
        {messages.map((m) => (
          <Bubble key={m.id} role={m.role} content={m.content} time={fmt(m.at)} />
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
        <p className="text-[10px] text-muted-foreground mt-1 text-right">{time}</p>
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
