
-- All tables use a client-generated visitor_id (no auth.users). Permissive RLS for anon since onboarding is name-only.

CREATE TABLE public.visitor_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visitor_profiles TO anon, authenticated;
GRANT ALL ON public.visitor_profiles TO service_role;
ALTER TABLE public.visitor_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open visitor_profiles" ON public.visitor_profiles FOR ALL USING (true) WITH CHECK (true);

CREATE TABLE public.mood_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL,
  mood text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.mood_entries TO anon, authenticated;
GRANT ALL ON public.mood_entries TO service_role;
ALTER TABLE public.mood_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open mood_entries" ON public.mood_entries FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX ON public.mood_entries (visitor_id, created_at DESC);

CREATE TABLE public.symptom_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL,
  symptom_name text NOT NULL,
  severity int NOT NULL DEFAULT 5,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.symptom_logs TO anon, authenticated;
GRANT ALL ON public.symptom_logs TO service_role;
ALTER TABLE public.symptom_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open symptom_logs" ON public.symptom_logs FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX ON public.symptom_logs (visitor_id, created_at DESC);

CREATE TABLE public.ai_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL,
  role text NOT NULL,
  message text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_chat_messages TO anon, authenticated;
GRANT ALL ON public.ai_chat_messages TO service_role;
ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open ai_chat_messages" ON public.ai_chat_messages FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX ON public.ai_chat_messages (visitor_id, created_at);

CREATE TABLE public.support_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL,
  name text NOT NULL,
  relationship text,
  phone_number text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.support_contacts TO anon, authenticated;
GRANT ALL ON public.support_contacts TO service_role;
ALTER TABLE public.support_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open support_contacts" ON public.support_contacts FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX ON public.support_contacts (visitor_id);

CREATE TABLE public.community_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL,
  anonymous_name text NOT NULL DEFAULT 'Anonymous',
  content text NOT NULL,
  tags text[] NOT NULL DEFAULT '{}',
  likes_count int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_posts TO anon, authenticated;
GRANT ALL ON public.community_posts TO service_role;
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open community_posts" ON public.community_posts FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX ON public.community_posts (created_at DESC);

CREATE TABLE public.community_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  visitor_id uuid NOT NULL,
  comment text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_comments TO anon, authenticated;
GRANT ALL ON public.community_comments TO service_role;
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open community_comments" ON public.community_comments FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX ON public.community_comments (post_id, created_at);

CREATE TABLE public.medical_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medical_history TO anon, authenticated;
GRANT ALL ON public.medical_history TO service_role;
ALTER TABLE public.medical_history ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open medical_history" ON public.medical_history FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX ON public.medical_history (visitor_id, category);

CREATE TABLE public.games_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  visitor_id uuid NOT NULL,
  game_name text NOT NULL,
  score int NOT NULL DEFAULT 0,
  completion_time int,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.games_progress TO anon, authenticated;
GRANT ALL ON public.games_progress TO service_role;
ALTER TABLE public.games_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "open games_progress" ON public.games_progress FOR ALL USING (true) WITH CHECK (true);
CREATE INDEX ON public.games_progress (visitor_id, game_name);

ALTER PUBLICATION supabase_realtime ADD TABLE public.community_posts;
ALTER PUBLICATION supabase_realtime ADD TABLE public.community_comments;
ALTER PUBLICATION supabase_realtime ADD TABLE public.ai_chat_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_contacts;
