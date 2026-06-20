export type Mood = string;

export const MOODS: { name: string; emoji: string; tone: string }[] = [
  { name: "Calm", emoji: "😌", tone: "var(--soft-mint)" },
  { name: "Happy", emoji: "😊", tone: "var(--soft-mint)" },
  { name: "Energetic", emoji: "😎", tone: "var(--soft-yellow)" },
  { name: "Frisky", emoji: "😜", tone: "var(--lavender)" },
  { name: "Mood swings", emoji: "😕", tone: "var(--soft-sky)" },
  { name: "Irritated", emoji: "😠", tone: "var(--soft-pink)" },
  { name: "Sad", emoji: "😢", tone: "var(--soft-sky)" },
  { name: "Anxious", emoji: "😟", tone: "var(--lavender)" },
  { name: "Depressed", emoji: "😞", tone: "var(--soft-pink)" },
  { name: "Feeling guilty", emoji: "😔", tone: "var(--soft-peach)" },
  { name: "Obsessive thoughts", emoji: "😵", tone: "var(--soft-yellow)" },
  { name: "Low energy", emoji: "⚡", tone: "var(--soft-sky)" },
  { name: "Apathetic", emoji: "😐", tone: "var(--muted)" },
  { name: "Confused", emoji: "😕", tone: "var(--soft-peach)" },
  { name: "Very self-critical", emoji: "🥺", tone: "var(--soft-pink)" },
];

export function moodEmoji(name?: string): string {
  return MOODS.find((m) => m.name === name)?.emoji ?? "🙂";
}
