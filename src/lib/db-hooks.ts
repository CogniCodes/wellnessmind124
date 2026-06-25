import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useVisitorId } from "@/lib/visitor";

// ---------- Types (mirrors DB rows) ----------
export type MoodRow = { id: string; user_id: string; mood: string; created_at: string };
export type SymptomRow = {
  id: string; user_id: string; symptom_name: string;
  severity: number; notes: string | null; created_at: string;
};
export type ChatRow = {
  id: string; user_id: string; role: "user" | "assistant"; message: string; created_at: string;
};
export type ContactRow = {
  id: string; user_id: string; name: string; relationship: string | null;
  phone_number: string | null; created_at: string;
};
export type PostRow = {
  id: string; user_id: string; anonymous_name: string; content: string;
  tags: string[]; likes_count: number; created_at: string;
};
export type CommentRow = {
  id: string; post_id: string; user_id: string; comment: string; created_at: string;
};
export type MedicalRow = {
  id: string; user_id: string; category: string; title: string;
  description: string | null; created_at: string;
};
export type GameRow = {
  id: string; user_id: string; game_name: string;
  score: number; completion_time: number | null; created_at: string;
};

// ---------- Realtime: invalidate queries on changes ----------
export function useRealtimeFor(table: string, queryKey: unknown[]) {
  const qc = useQueryClient();
  useEffect(() => {
    const channel = supabase
      .channel(`rt:${table}:${queryKey.join(":")}`)
      .on("postgres_changes", { event: "*", schema: "public", table }, () => {
        qc.invalidateQueries({ queryKey });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [table, qc, queryKey.join("|")]); // eslint-disable-line react-hooks/exhaustive-deps
}

// ---------- Moods ----------
export function useMoods() {
  const userId = useVisitorId();
  const key = ["moods", userId];
  return useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("mood_entries")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as MoodRow[];
    },
  });
}

export function useSetTodayMood() {
  const userId = useVisitorId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (mood: string) => {
      const start = new Date(); start.setHours(0, 0, 0, 0);
      await supabase
        .from("mood_entries")
        .delete()
        .eq("user_id", userId)
        .gte("created_at", start.toISOString());
      const { error } = await supabase
        .from("mood_entries")
        .insert({ user_id: userId, mood });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["moods", userId] }),
  });
}

// ---------- Symptoms ----------
export function useSymptoms() {
  const userId = useVisitorId();
  const key = ["symptoms", userId];
  return useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("symptom_logs")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as SymptomRow[];
    },
  });
}

export function useAddSymptom() {
  const userId = useVisitorId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { symptom_name: string; severity: number; notes?: string | null }) => {
      const { data, error } = await supabase.from("symptom_logs").insert({
        user_id: userId,
        symptom_name: input.symptom_name,
        severity: input.severity,
        notes: input.notes ?? null,
      }).select("id").single();
      if (error) throw error;
      return data as { id: string };
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["symptoms", userId] }),
  });
}

// ---------- Chat ----------
export function useChat() {
  const userId = useVisitorId();
  const key = ["chat", userId];
  return useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ai_chat_messages")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ChatRow[];
    },
  });
}

export async function insertChat(userId: string, role: "user" | "assistant", message: string) {
  const { error } = await supabase
    .from("ai_chat_messages")
    .insert({ user_id: userId, role, message });
  if (error) throw error;
}

// ---------- Contacts ----------
export function useContacts() {
  const userId = useVisitorId();
  const key = ["contacts", userId];
  return useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("support_contacts")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as ContactRow[];
    },
  });
}

export function useSaveContact() {
  const userId = useVisitorId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: { id?: string; name: string; relationship: string | null; phone_number: string | null }) => {
      if (c.id) {
        const { error } = await supabase
          .from("support_contacts")
          .update({ name: c.name, relationship: c.relationship, phone_number: c.phone_number })
          .eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("support_contacts")
          .insert({ user_id: userId, name: c.name, relationship: c.relationship, phone_number: c.phone_number });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts", userId] }),
  });
}

export function useDeleteContact() {
  const userId = useVisitorId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("support_contacts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contacts", userId] }),
  });
}

// ---------- Community Posts ----------
export function usePosts() {
  const key = ["posts"];
  useRealtimeFor("community_posts", key);
  return useQuery({
    queryKey: key,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_posts")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as PostRow[];
    },
  });
}

export function useCreatePost() {
  const userId = useVisitorId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (p: { content: string; tags: string[]; anonymous_name?: string }) => {
      const { error } = await supabase.from("community_posts").insert({
        user_id: userId,
        content: p.content,
        tags: p.tags,
        anonymous_name: p.anonymous_name ?? "Anonymous",
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

export function useLikePost() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (post: PostRow) => {
      const { error } = await supabase.rpc("increment_post_likes", { _post_id: post.id });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["posts"] }),
  });
}

// ---------- Comments ----------
export function useComments(postId: string | null) {
  const key = ["comments", postId ?? "none"];
  useRealtimeFor("community_comments", key);
  return useQuery({
    queryKey: key,
    enabled: !!postId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("community_comments")
        .select("*")
        .eq("post_id", postId!)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as CommentRow[];
    },
  });
}

export function useAddComment() {
  const userId = useVisitorId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { post_id: string; comment: string }) => {
      const { error } = await supabase
        .from("community_comments")
        .insert({ post_id: input.post_id, user_id: userId, comment: input.comment });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["comments", vars.post_id] }),
  });
}

// ---------- Medical ----------
export function useMedical() {
  const userId = useVisitorId();
  const key = ["medical", userId];
  return useQuery({
    queryKey: key,
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("medical_history")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as MedicalRow[];
    },
  });
}

export function useSaveMedical() {
  const userId = useVisitorId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (m: { id?: string; category: string; title: string; description: string | null }) => {
      if (m.id) {
        const { error } = await supabase
          .from("medical_history")
          .update({ category: m.category, title: m.title, description: m.description })
          .eq("id", m.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("medical_history").insert({
          user_id: userId, category: m.category, title: m.title, description: m.description,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medical", userId] }),
  });
}

export function useDeleteMedical() {
  const userId = useVisitorId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("medical_history").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["medical", userId] }),
  });
}

// ---------- Games progress ----------
export function useGameStats(game: string) {
  const userId = useVisitorId();
  return useQuery({
    queryKey: ["games", userId, game],
    enabled: !!userId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("games_progress")
        .select("*")
        .eq("user_id", userId)
        .eq("game_name", game)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as GameRow[];
    },
  });
}

export function useSaveGameRun() {
  const userId = useVisitorId();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (r: { game_name: string; score: number; completion_time?: number | null }) => {
      const { error } = await supabase.from("games_progress").insert({
        user_id: userId, game_name: r.game_name,
        score: r.score, completion_time: r.completion_time ?? null,
      });
      if (error) throw error;
    },
    onSuccess: (_d, vars) => qc.invalidateQueries({ queryKey: ["games", userId, vars.game_name] }),
  });
}
