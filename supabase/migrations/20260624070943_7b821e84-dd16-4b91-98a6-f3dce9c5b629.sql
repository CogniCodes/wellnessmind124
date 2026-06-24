
-- =========================================================
-- 1) Realtime publication: remove sensitive tables
-- =========================================================
DO $$
DECLARE
  t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['ai_chat_messages','support_contacts'] LOOP
    IF EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime'
        AND schemaname = 'public'
        AND tablename = t
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime DROP TABLE public.%I', t);
    END IF;
  END LOOP;
END $$;

-- =========================================================
-- 2) Drop existing permissive policies
-- =========================================================
DO $$
DECLARE r record;
BEGIN
  FOR r IN
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN (
        'visitor_profiles','mood_entries','symptom_logs','ai_chat_messages',
        'support_contacts','medical_history','games_progress',
        'community_posts','community_comments'
      )
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
  END LOOP;
END $$;

-- =========================================================
-- 3) Owner-only policies (visitor_id = auth.uid())
-- =========================================================

-- visitor_profiles
CREATE POLICY "own profile select" ON public.visitor_profiles
  FOR SELECT TO authenticated USING (visitor_id = auth.uid());
CREATE POLICY "own profile insert" ON public.visitor_profiles
  FOR INSERT TO authenticated WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own profile update" ON public.visitor_profiles
  FOR UPDATE TO authenticated USING (visitor_id = auth.uid()) WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own profile delete" ON public.visitor_profiles
  FOR DELETE TO authenticated USING (visitor_id = auth.uid());

-- mood_entries
CREATE POLICY "own moods select" ON public.mood_entries
  FOR SELECT TO authenticated USING (visitor_id = auth.uid());
CREATE POLICY "own moods insert" ON public.mood_entries
  FOR INSERT TO authenticated WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own moods update" ON public.mood_entries
  FOR UPDATE TO authenticated USING (visitor_id = auth.uid()) WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own moods delete" ON public.mood_entries
  FOR DELETE TO authenticated USING (visitor_id = auth.uid());

-- symptom_logs
CREATE POLICY "own symptoms select" ON public.symptom_logs
  FOR SELECT TO authenticated USING (visitor_id = auth.uid());
CREATE POLICY "own symptoms insert" ON public.symptom_logs
  FOR INSERT TO authenticated WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own symptoms update" ON public.symptom_logs
  FOR UPDATE TO authenticated USING (visitor_id = auth.uid()) WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own symptoms delete" ON public.symptom_logs
  FOR DELETE TO authenticated USING (visitor_id = auth.uid());

-- ai_chat_messages
CREATE POLICY "own chat select" ON public.ai_chat_messages
  FOR SELECT TO authenticated USING (visitor_id = auth.uid());
CREATE POLICY "own chat insert" ON public.ai_chat_messages
  FOR INSERT TO authenticated WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own chat update" ON public.ai_chat_messages
  FOR UPDATE TO authenticated USING (visitor_id = auth.uid()) WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own chat delete" ON public.ai_chat_messages
  FOR DELETE TO authenticated USING (visitor_id = auth.uid());

-- support_contacts
CREATE POLICY "own contacts select" ON public.support_contacts
  FOR SELECT TO authenticated USING (visitor_id = auth.uid());
CREATE POLICY "own contacts insert" ON public.support_contacts
  FOR INSERT TO authenticated WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own contacts update" ON public.support_contacts
  FOR UPDATE TO authenticated USING (visitor_id = auth.uid()) WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own contacts delete" ON public.support_contacts
  FOR DELETE TO authenticated USING (visitor_id = auth.uid());

-- medical_history
CREATE POLICY "own medical select" ON public.medical_history
  FOR SELECT TO authenticated USING (visitor_id = auth.uid());
CREATE POLICY "own medical insert" ON public.medical_history
  FOR INSERT TO authenticated WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own medical update" ON public.medical_history
  FOR UPDATE TO authenticated USING (visitor_id = auth.uid()) WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own medical delete" ON public.medical_history
  FOR DELETE TO authenticated USING (visitor_id = auth.uid());

-- games_progress
CREATE POLICY "own games select" ON public.games_progress
  FOR SELECT TO authenticated USING (visitor_id = auth.uid());
CREATE POLICY "own games insert" ON public.games_progress
  FOR INSERT TO authenticated WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own games update" ON public.games_progress
  FOR UPDATE TO authenticated USING (visitor_id = auth.uid()) WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "own games delete" ON public.games_progress
  FOR DELETE TO authenticated USING (visitor_id = auth.uid());

-- =========================================================
-- 4) Community: public read, owner write
-- =========================================================
CREATE POLICY "posts public read" ON public.community_posts
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "posts owner insert" ON public.community_posts
  FOR INSERT TO authenticated WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "posts owner update" ON public.community_posts
  FOR UPDATE TO authenticated USING (visitor_id = auth.uid()) WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "posts owner delete" ON public.community_posts
  FOR DELETE TO authenticated USING (visitor_id = auth.uid());

CREATE POLICY "comments public read" ON public.community_comments
  FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "comments owner insert" ON public.community_comments
  FOR INSERT TO authenticated WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "comments owner update" ON public.community_comments
  FOR UPDATE TO authenticated USING (visitor_id = auth.uid()) WITH CHECK (visitor_id = auth.uid());
CREATE POLICY "comments owner delete" ON public.community_comments
  FOR DELETE TO authenticated USING (visitor_id = auth.uid());

-- Grants: tighten anon (community is publicly readable only)
REVOKE ALL ON public.visitor_profiles, public.mood_entries, public.symptom_logs,
  public.ai_chat_messages, public.support_contacts, public.medical_history,
  public.games_progress, public.community_posts, public.community_comments FROM anon;
GRANT SELECT ON public.community_posts, public.community_comments TO anon;

-- =========================================================
-- 5) Likes helper (so users can like without ownership of the post)
-- =========================================================
CREATE OR REPLACE FUNCTION public.increment_post_likes(_post_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_count integer;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;
  UPDATE public.community_posts
    SET likes_count = likes_count + 1
    WHERE id = _post_id
    RETURNING likes_count INTO new_count;
  RETURN new_count;
END;
$$;
REVOKE ALL ON FUNCTION public.increment_post_likes(uuid) FROM public, anon;
GRANT EXECUTE ON FUNCTION public.increment_post_likes(uuid) TO authenticated;

-- =========================================================
-- 6) Realtime channel authorization
-- =========================================================
ALTER TABLE realtime.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "authenticated can read realtime" ON realtime.messages;
CREATE POLICY "authenticated can read realtime"
  ON realtime.messages FOR SELECT
  TO authenticated
  USING ((SELECT auth.uid()) IS NOT NULL);

DROP POLICY IF EXISTS "authenticated can write realtime" ON realtime.messages;
CREATE POLICY "authenticated can write realtime"
  ON realtime.messages FOR INSERT
  TO authenticated
  WITH CHECK ((SELECT auth.uid()) IS NOT NULL);
