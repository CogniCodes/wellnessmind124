// User-ID based identity (no auth). The User ID is the sole credential.
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "sm.user_id";

export type CurrentUser = {
  userId: string;
  name: string;
  dob: string | null;
  gender: string | null;
  blood_group: string | null;
  contact_number: string | null;
  height_cm: number | null;
  weight_kg: number | null;
  avatar_url: string | null;
  medications: string | null;
  allergies: string | null;
};

export type ProfileUpdate = Partial<Omit<CurrentUser, "userId">>;

type Ctx = {
  visitor: CurrentUser | null;
  loading: boolean;
  signInWithId: (userId: string) => Promise<CurrentUser>;
  createAccount: (name: string) => Promise<CurrentUser>;
  updateName: (name: string) => Promise<void>;
  updateProfile: (patch: ProfileUpdate) => Promise<void>;
  signOut: () => void;
};

const VisitorCtx = createContext<Ctx | null>(null);

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
function randSuffix(len = 4): string {
  let out = "";
  const arr = new Uint32Array(len);
  crypto.getRandomValues(arr);
  for (let i = 0; i < len; i++) out += ALPHABET[arr[i] % ALPHABET.length];
  return out;
}

function prefixFromName(name: string): string {
  const letters = name.toUpperCase().replace(/[^A-Z]/g, "");
  return (letters + "XXX").slice(0, 3);
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
  return `${prefix}-${randSuffix(6)}`;
}

async function loadProfile(userId: string): Promise<CurrentUser | null> {
  const { data, error } = await supabase
    .from("user_profiles")
    .select("user_id, name, dob, gender, blood_group, contact_number, height_cm, weight_kg, avatar_url, medications, allergies")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !data) return null;
  return {
    userId: data.user_id,
    name: data.name,
    dob: data.dob,
    gender: data.gender,
    blood_group: data.blood_group,
    contact_number: data.contact_number,
    height_cm: data.height_cm,
    weight_kg: data.weight_kg,
    avatar_url: data.avatar_url,
    medications: data.medications,
    allergies: data.allergies,
  };
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
    const profile: CurrentUser = {
      userId, name: trimmed, dob: null, gender: null, blood_group: null,
      contact_number: null, height_cm: null, weight_kg: null,
      avatar_url: null, medications: null, allergies: null,
    };
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

  const updateProfile = async (patch: ProfileUpdate) => {
    if (!visitor) return;
    const { error } = await supabase
      .from("user_profiles")
      .update(patch)
      .eq("user_id", visitor.userId);
    if (error) throw error;
    setVisitor({ ...visitor, ...patch });
  };

  const signOut = () => {
    localStorage.removeItem(STORAGE_KEY);
    setVisitor(null);
  };

  return (
    <VisitorCtx.Provider value={{ visitor, loading, signInWithId, createAccount, updateName, updateProfile, signOut }}>
      {children}
    </VisitorCtx.Provider>
  );
}

export function useVisitor() {
  const ctx = useContext(VisitorCtx);
  if (!ctx) throw new Error("useVisitor must be used inside VisitorProvider");
  return ctx;
}

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
