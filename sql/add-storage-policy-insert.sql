-- Add storage policy to allow authenticated users to upload to classificados bucket
-- Execute this in Supabase SQL editor or via migration tool

-- Allow authenticated users to INSERT (upload) files to the 'classificados' bucket
-- Note: Storage policies in Supabase are defined via the storage.objects table
INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
VALUES ('classificados', 'classificados', true, false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
ON CONFLICT (id) DO UPDATE
SET public = true, file_size_limit = 5242880;

-- Create policy for authenticated users to upload files
DROP POLICY IF EXISTS "authenticated_upload_classificados" ON storage.objects;
CREATE POLICY "authenticated_upload_classificados" ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'classificados'
    AND auth.uid() IS NOT NULL
  );

-- Create policy for public read access
DROP POLICY IF EXISTS "public_read_classificados" ON storage.objects;
CREATE POLICY "public_read_classificados" ON storage.objects
  FOR SELECT
  USING (bucket_id = 'classificados');

-- Create policy for authenticated users to delete their own uploads
DROP POLICY IF EXISTS "authenticated_delete_classificados" ON storage.objects;
CREATE POLICY "authenticated_delete_classificados" ON storage.objects
  FOR DELETE
  USING (
    bucket_id = 'classificados'
    AND auth.uid() IS NOT NULL
  );
