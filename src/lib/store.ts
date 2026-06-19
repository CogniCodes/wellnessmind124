// Tiny localStorage-backed store with React subscriptions.
// Acts as the app's "database" for v1 demo data. Lovable Cloud can replace it.
import { useSyncExternalStore } from "react";

type Listener = () => void;
const listeners = new Map<string, Set<Listener>>();

function emit(key: string) {
  listeners.get(key)?.forEach((l) => l());
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(key, JSON.stringify(value));
  emit(key);
}

export function usePersistent<T>(key: string, fallback: T): [T, (next: T | ((prev: T) => T)) => void] {
  const subscribe = (cb: Listener) => {
    let set = listeners.get(key);
    if (!set) {
      set = new Set();
      listeners.set(key, set);
    }
    set.add(cb);
    return () => set!.delete(cb);
  };
  const value = useSyncExternalStore(
    subscribe,
    () => {
      const raw = typeof window === "undefined" ? null : window.localStorage.getItem(key);
      return raw ?? "__null__";
    },
    () => "__null__",
  );
  const parsed: T = value === "__null__" ? fallback : (JSON.parse(value) as T);
  const setValue = (next: T | ((prev: T) => T)) => {
    const current = read<T>(key, fallback);
    const resolved = typeof next === "function" ? (next as (p: T) => T)(current) : next;
    write(key, resolved);
  };
  return [parsed, setValue];
}

export const storage = { read, write };

// ---------- Types ----------
export type Mood =
  | "Calm" | "Happy" | "Energetic" | "Frisky"
  | "Mood swings" | "Irritated" | "Sad" | "Anxious"
  | "Depressed" | "Feeling guilty" | "Obsessive thoughts" | "Low energy"
  | "Apathetic" | "Confused" | "Very self-critical";

export type MoodEntry = { id: string; mood: Mood; at: string };

export type SymptomCategory = "Physical" | "Emotional" | "Sleep" | "Pain" | "Digestion";
export type SymptomLog = {
  id: string;
  name: string;
  category: SymptomCategory;
  severity: number;
  mood?: Mood;
  notes?: string;
  at: string;
  status?: "Ongoing" | "Recovered";
};

export type Post = {
  id: string;
  body: string;
  tags: string[];
  emoji: string;
  at: string;
  likes: number;
  comments: number;
  saved: boolean;
  liked: boolean;
};

export type Contact = {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  avatarHue: number;
};

export type MedicalItem = { id: string; title: string; detail: string; tag?: string };

export type ChatMessage = { id: string; role: "user" | "assistant"; content: string; at: string };

export type Profile = {
  name: string;
  streak: number;
  wellnessScore: number;
};
