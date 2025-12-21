-- Add policies to allow authenticated users to UPDATE and DELETE classifieds
-- Execute this in Supabase SQL editor or via migration tool

-- Ensure RLS is enabled
ALTER TABLE classifieds ENABLE ROW LEVEL SECURITY;

-- UPDATE: allow owner (seller_id) or admin to update their classifieds
DROP POLICY IF EXISTS "authenticated_update_classifieds" ON classifieds;
CREATE POLICY "authenticated_update_classifieds" ON classifieds
  FOR UPDATE
  USING (
    seller_id = auth.uid()
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  )
  WITH CHECK (
    -- Ensure updated row still belongs to the actor (prevents escalation)
    seller_id = auth.uid()
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- DELETE: allow owner (seller_id) or admin to delete
DROP POLICY IF EXISTS "authenticated_delete_classifieds" ON classifieds;
CREATE POLICY "authenticated_delete_classifieds" ON classifieds
  FOR DELETE
  USING (
    seller_id = auth.uid()
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );

-- You can extend these policies to restrict fields in WITH CHECK if needed.

