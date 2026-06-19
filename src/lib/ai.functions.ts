import { createServerFn } from "@tanstack/react-start";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";
import { generateText } from "ai";
import { z } from "zod";

const MsgSchema = z.object({
  messages: z.array(z.object({
    role: z.enum(["user", "assistant", "system"]),
    content: z.string(),
  })).min(1).max(50),
});

const SYSTEM = `You are SereneMind, a warm, gentle AI wellness companion. You support the user's mental and physical wellbeing with empathy.

Style:
- Brief, warm, conversational (2-5 short sentences or a small bulleted list).
- Use the user's mood and symptoms when relevant.
- Suggest concrete, gentle actions: hydration, breathing exercises, short breaks, sleep hygiene, journaling, grounding.
- Use occasional soft emojis (💜🌿🌬️💧✨) tastefully.

Safety:
- Always include a short reminder when relevant: "This isn't medical advice — please reach out to a professional for emergencies."
- If user describes self-harm or crisis, encourage them to contact local emergency services or a trusted person, gently and without judgement.`;

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

    const { text } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      system: SYSTEM,
      messages: data.messages,
    });

    return { text };
  });
