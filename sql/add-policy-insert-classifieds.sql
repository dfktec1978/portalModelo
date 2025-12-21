-- Add policy to allow authenticated users to insert classifieds
-- Execute this in Supabase SQL editor or via migration tool

-- Ensure RLS is enabled (should already be enabled by supabase-init.sql)
ALTER TABLE classifieds ENABLE ROW LEVEL SECURITY;

-- Allow users to insert classifieds when the seller_id equals their auth.uid(),
-- or if they are admin (role = 'admin').
-- Remove existing policy if present (Postgres doesn't support IF NOT EXISTS on CREATE POLICY)
DROP POLICY IF EXISTS "authenticated_insert_classifieds" ON classifieds;

CREATE POLICY "authenticated_insert_classifieds" ON classifieds
  FOR INSERT
  WITH CHECK (
    seller_id = auth.uid()
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- Optional: you may also want to add update/delete policies later.
