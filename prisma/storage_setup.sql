-- Create a private "plans" bucket for the generated PDFs.
INSERT INTO storage.buckets (id, name, public)
VALUES ('plans', 'plans', false)
ON CONFLICT (id) DO NOTHING;

-- Each signed-in user can write/read PDFs only inside their own folder
-- (path = <user-id>/<profile-id>.pdf). The Supabase dashboard (admin) sees all.
DROP POLICY IF EXISTS "plans_insert_own" ON storage.objects;
CREATE POLICY "plans_insert_own" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'plans' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "plans_select_own" ON storage.objects;
CREATE POLICY "plans_select_own" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'plans' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "plans_update_own" ON storage.objects;
CREATE POLICY "plans_update_own" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'plans' AND (storage.foldername(name))[1] = auth.uid()::text);
