import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY_NAME = "sm.visitor_name";

type Visitor = { visitorId: string; name: string };
type Ctx = {
  visitor: Visitor | null;
  loading: boolean;
  onboard: (name: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const VisitorCtx = createContext<Ctx | null>(null);

async function loadProfile(userId: string): Promise<string | null> {
  const { data } = await supabase
    .from("visitor_profiles")
    .select("name")
    .eq("visitor_id", userId)
    .maybeSingle();
  return data?.name ?? null;
}

export function VisitorProvider({ children }: { children: ReactNode }) {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getSession();
      const user = data.session?.user;
      if (!user) {
        setLoading(false);
        return;
      }
      const name = (await loadProfile(user.id)) ?? localStorage.getItem(KEY_NAME);
      if (cancelled) return;
      if (name) {
        localStorage.setItem(KEY_NAME, name);
        setVisitor({ visitorId: user.id, name });
      }
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_OUT") setVisitor(null);
      if (event === "SIGNED_IN" && session?.user) {
        loadProfile(session.user.id).then((name) => {
          const final = name ?? localStorage.getItem(KEY_NAME);
          if (final) {
            localStorage.setItem(KEY_NAME, final);
            setVisitor({ visitorId: session.user.id, name: final });
          }
        });
      }
    });
    return () => {
      cancelled = true;
      sub.subscription.unsubscribe();
    };
  }, []);

  const onboard = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const { data: sessionData } = await supabase.auth.getSession();
    let userId = sessionData.session?.user.id;
    if (!userId) {
      const { data, error } = await supabase.auth.signInAnonymously();
      if (error) throw error;
      userId = data.user?.id;
      if (!userId) throw new Error("Failed to create session");
    }
    const { error: upsertError } = await supabase
      .from("visitor_profiles")
      .upsert({ visitor_id: userId, name: trimmed }, { onConflict: "visitor_id" });
    if (upsertError) throw upsertError;
    localStorage.setItem(KEY_NAME, trimmed);
    setVisitor({ visitorId: userId, name: trimmed });
  };

  const updateName = async (name: string) => {
    if (!visitor) return;
    const trimmed = name.trim();
    if (!trimmed) return;
    await supabase
      .from("visitor_profiles")
      .update({ name: trimmed })
      .eq("visitor_id", visitor.visitorId);
    localStorage.setItem(KEY_NAME, trimmed);
    setVisitor({ ...visitor, name: trimmed });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem(KEY_NAME);
    setVisitor(null);
  };

  return (
    <VisitorCtx.Provider value={{ visitor, loading, onboard, updateName, signOut }}>
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
  return visitor?.visitorId ?? "";
}

export function greetingFor(now = new Date()) {
  const h = now.getHours();
  if (h < 12) return "Good Morning";
  if (h < 18) return "Good Afternoon";
  return "Good Evening";
}
