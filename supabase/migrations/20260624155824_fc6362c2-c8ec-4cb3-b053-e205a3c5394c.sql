
-- 1) Drop existing auth-scoped policies on user-data tables
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

-- 2) Rename visitor_profiles -> user_profiles, change PK to text
ALTER TABLE public.visitor_profiles RENAME TO user_profiles;
ALTER TABLE public.user_profiles RENAME COLUMN visitor_id TO user_id;
ALTER TABLE public.user_profiles ALTER COLUMN user_id TYPE text USING user_id::text;

-- 3) Rename visitor_id -> user_id (text) on all data tables
ALTER TABLE public.mood_entries       RENAME COLUMN visitor_id TO user_id;
ALTER TABLE public.symptom_logs       RENAME COLUMN visitor_id TO user_id;
ALTER TABLE public.ai_chat_messages   RENAME COLUMN visitor_id TO user_id;
ALTER TABLE public.support_contacts   RENAME COLUMN visitor_id TO user_id;
ALTER TABLE public.medical_history    RENAME COLUMN visitor_id TO user_id;
ALTER TABLE public.games_progress     RENAME COLUMN visitor_id TO user_id;
ALTER TABLE public.community_posts    RENAME COLUMN visitor_id TO user_id;
ALTER TABLE public.community_comments RENAME COLUMN visitor_id TO user_id;

ALTER TABLE public.mood_entries       ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.symptom_logs       ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.ai_chat_messages   ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.support_contacts   ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.medical_history    ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.games_progress     ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.community_posts    ALTER COLUMN user_id TYPE text USING user_id::text;
ALTER TABLE public.community_comments ALTER COLUMN user_id TYPE text USING user_id::text;

-- 4) Grants: re-enable anon access (no auth in this version)
GRANT SELECT, INSERT, UPDATE, DELETE ON
  public.user_profiles, public.mood_entries, public.symptom_logs,
  public.ai_chat_messages, public.support_contacts, public.medical_history,
  public.games_progress, public.community_posts, public.community_comments
  TO anon, authenticated;

-- 5) Permissive policies (User ID is the credential)
CREATE POLICY "open user_profiles"      ON public.user_profiles      FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open mood_entries"       ON public.mood_entries       FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open symptom_logs"       ON public.symptom_logs       FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open ai_chat_messages"   ON public.ai_chat_messages   FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open support_contacts"   ON public.support_contacts   FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open medical_history"    ON public.medical_history    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open games_progress"     ON public.games_progress     FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open community_posts"    ON public.community_posts    FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
CREATE POLICY "open community_comments" ON public.community_comments FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 6) Replace likes helper to not require auth
CREATE OR REPLACE FUNCTION public.increment_post_likes(_post_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE new_count integer;
BEGIN
  UPDATE public.community_posts
    SET likes_count = likes_count + 1
    WHERE id = _post_id
    RETURNING likes_count INTO new_count;
  RETURN new_count;
END;
$$;
GRANT EXECUTE ON FUNCTION public.increment_post_likes(uuid) TO anon, authenticated;
