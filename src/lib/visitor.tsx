import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

const KEY_ID = "sm.visitor_id";
const KEY_NAME = "sm.visitor_name";

type Visitor = { visitorId: string; name: string };
type Ctx = {
  visitor: Visitor | null;
  loading: boolean;
  onboard: (name: string) => Promise<void>;
  updateName: (name: string) => Promise<void>;
  signOut: () => void;
};

const VisitorCtx = createContext<Ctx | null>(null);

export function VisitorProvider({ children }: { children: ReactNode }) {
  const [visitor, setVisitor] = useState<Visitor | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const id = localStorage.getItem(KEY_ID);
    const name = localStorage.getItem(KEY_NAME);
    if (id && name) {
      setVisitor({ visitorId: id, name });
      // refresh profile from supabase in background
      supabase
        .from("visitor_profiles")
        .select("name")
        .eq("visitor_id", id)
        .maybeSingle()
        .then(({ data }) => {
          if (data?.name && data.name !== name) {
            localStorage.setItem(KEY_NAME, data.name);
            setVisitor({ visitorId: id, name: data.name });
          }
        });
    }
    setLoading(false);
  }, []);

  const onboard = async (name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    const visitorId = crypto.randomUUID();
    const { error } = await supabase
      .from("visitor_profiles")
      .insert({ visitor_id: visitorId, name: trimmed });
    if (error) throw error;
    localStorage.setItem(KEY_ID, visitorId);
    localStorage.setItem(KEY_NAME, trimmed);
    setVisitor({ visitorId, name: trimmed });
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

  const signOut = () => {
    localStorage.removeItem(KEY_ID);
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
