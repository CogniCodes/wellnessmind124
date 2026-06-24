// User-ID based identity (no auth). The User ID is the sole credential.
// Exports keep "visitor" naming for backward compatibility with existing callers,
// but everything maps to the new public.user_profiles table keyed by text user_id.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "sm.user_id";

export type CurrentUser = { userId: string; name: string };
type Ctx = {
  visitor: CurrentUser | null;
  loading: boolean;
  /** Look up an existing User ID and load the profile. Throws if not found. */
  signInWithId: (userId: string) => Promise<CurrentUser>;
  /** Create a new account for the given display name. Returns the generated User ID. */
  createAccount: (name: string) => Promise<CurrentUser>;
  updateName: (name: string) => Promise<void>;
  signOut: () => void;
};

const VisitorCtx = createContext<Ctx | null>(null);

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no confusing chars
function randSuffix(len = 4): string {
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += ALPHABET[arr[i] % ALPHABET.length];
  return out;
}

function prefixFromName(name: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  const base = (letters + "XXX").slice(0, 3);
  return base;
}

async function idExists(id: string): Promise<boolean> {
  const { data } = await supabase
    .from("user_profiles")
    .select("user_id")
    .eq("user_id", id)
    .maybeSingle();
  return !!data;
}

async function generateUniqueId(name: string): Promise<string> {
  const prefix = prefixFromName(name);
  for (let i = 0; i < 12; i++) {
    const candidate = `${prefix}-${randSuffix(4)}`;
    if (!(await idExists(candidate))) return candidate;
  }
  // Extremely unlikely fallback
  return `${prefix}-${randSuffix(6)}`;
}

async function loadProfile(userId: string): Promise<CurrentUser | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id, name")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return { userId: data.user_id, name: data.name };
}

export function VisitorProvider({ children }: { children: ReactNode }) {
  const [visitor, setVisitor] = useState<CurrentUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) { setLoading(false); return; }
    let cancelled = false;
    (async () => {
      const profile = await loadProfile(stored);
      if (cancelled) return;
      if (profile) setVisitor(profile);
      else localStorage.removeItem(STORAGE_KEY);
      setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const signInWithId = async (rawId: string): Promise<CurrentUser> => {
    const id = rawId.trim().toUpperCase();
    if (!id) throw new Error("Please enter a User ID.");
    const profile = await loadProfile(id);
    if (!profile) throw new Error("No account found for that User ID.");
    localStorage.setItem(STORAGE_KEY, profile.userId);
    setVisitor(profile);
    return profile;
  };

  const createAccount = async (name: string): Promise<CurrentUser> => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error("Please enter your name.");
    const userId = await generateUniqueId(trimmed);
    const { error } = await supabase
      .from("user_profiles")
      .insert({ user_id: userId, name: trimmed });
    if (error) throw error;
    const profile: CurrentUser = { userId, name: trimmed };
    localStorage.setItem(STORAGE_KEY, userId);
    setVisitor(profile);
    return profile;
  };

  const updateName = async (name: string) => {
    if (!visitor) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    const { error } = await supabase
      .from("user_profiles")
      .update({ name: trimmed })
      .eq("user_id", visitor.userId);
    if (error) throw error;
    setVisitor({ ...visitor, name: trimmed });
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setVisitor(null);
  };

  return (
    <VisitorCtx.Provider value={{ visitor, loading, signInWithId, createAccount, updateName, signOut }}>
      {children}
    </VisitorCtx.Provider>
  );
}

export function useVisitor() {
  const ctx = useContext(VisitorCtx);
  if (!ctx) throw new Error("useVisitor must be used inside VisitorProvider");
  return ctx;
}

/** Returns the current user's User ID (empty string while loading / signed out). */
export function useVisitorId(): string {
  const { visitor } = useVisitor();
  return visitor?.userId ?? "";
}

export function greetingFor(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}
