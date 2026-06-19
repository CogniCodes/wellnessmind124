import { createServerFn } from "@tanstack/react-start";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { z } from "zod";

const ContextSchema = z.object({
  currentMood: z.string().optional(),
  recentMoods: z.array(z.object({ mood: z.string(), at: z.string() })).optional(),
  recentSymptoms: z.array(z.object({
    name: z.string(),
    severity: z.number(),
    category: z.string().optional(),
    at: z.string(),
    notes: z.string().optional(),
  })).optional(),
  wellnessScore: z.number().optional(),
  streak: z.number().optional(),
}).optional();

const MsgSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
  })).min(1).max(50),
  context: ContextSchema,
});

const SYSTEM = `You are SereneMind, a warm, gentle AI wellness companion. You adapt every response to the user's current mood, symptoms, severity, and recent wellness trends provided in the user-context message.

Style:
- Empathetic, conversational, 2-5 short sentences (or a small bulleted list when suggesting actions).
- Acknowledge what the user is experiencing first, then offer 2-3 concrete, personalized suggestions tied to their actual data (mood, symptom name, severity, recent trend).
- Ask ONE relevant follow-up question to deepen understanding. Tailor it to their condition:
  • Headache → hydration, sleep quality, screen-time, eye strain
  • Anxiety/Anxious → grounding (5-4-3-2-1), breathing, recent stressors
  • Low energy/Fatigue → sleep duration, nutrition, movement, sunlight
  • Sad/Depressed → social connection, small wins, journaling
  • Pain → location, triggers, recent activity
  • Sleep issues → caffeine, screen-time before bed, routine
- Use soft emojis sparingly (💜🌿🌬️💧✨).

Safety:
- Always end with this exact disclaimer on its own line:
  "_This is not medical advice. Seek professional care if symptoms are severe or persistent._"
- If user describes self-harm or crisis, gently encourage contacting local emergency services or a trusted person.`;

function formatContext(ctx: z.infer<typeof ContextSchema>): string | null {
  if (!ctx) return null;
  const lines: string[] = ["User context for this conversation:"];
  if (ctx.currentMood) lines.push(`- Current mood today: ${ctx.currentMood}`);
  if (ctx.recentMoods?.length) {
    const recent = ctx.recentMoods.slice(0, 7).map(m => m.mood).join(", ");
    lines.push(`- Recent moods (newest first): ${recent}`);
  }
  if (ctx.recentSymptoms?.length) {
    lines.push(`- Recent symptoms:`);
    for (const s of ctx.recentSymptoms.slice(0, 8)) {
      const when = new Date(s.at).toLocaleDateString();
      lines.push(`  • ${s.name} (severity ${s.severity}/10, ${s.category ?? "—"}, ${when})${s.notes ? ` — ${s.notes}` : ""}`);
    }
  }
  if (typeof ctx.wellnessScore === "number") lines.push(`- Wellness score: ${ctx.wellnessScore}/100`);
  if (typeof ctx.streak === "number") lines.push(`- Check-in streak: ${ctx.streak} days`);
  return lines.join("\n");
}

export const sendChat = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => MsgSchema.parse(input))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createOpenAICompatible({
      name: "lovable",
      baseURL: "https://ai.gateway.lovable.dev/v1",
      headers: { "Lovable-API-Key": key },
    });

    const ctxText = formatContext(data.context);
    const messages = ctxText
      ? [{ role: "system" as const, content: ctxText }, ...data.messages]
      : data.messages;

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: SYSTEM,
      messages,
    });

    return { text };
  });
