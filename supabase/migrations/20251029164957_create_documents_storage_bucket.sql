/*
  # Create Documents Storage Bucket

  ## Overview
    Creates a secure storage bucket for document files with proper access policies

  ## Changes
    1. Creates 'documents' storage bucket
    2. Sets up RLS policies for secure file access
    3. Allows authenticated users to upload files
    4. Restricts file access based on document ownership

  ## Security
    - Only authenticated users can upload
    - Users can only access documents they own or are assigned to
    - Files are private by default
*/

-- Create storage bucket for documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'documents',
  'documents',
  false,
  52428800, -- 50MB limit
  ARRAY['application/pdf', 'image/jpeg', 'image/jpg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Authenticated users can upload documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can read accessible documents" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own documents" ON storage.objects;

-- Allow authenticated users to upload files
CREATE POLICY "Authenticated users can upload documents"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

-- Allow users to read their own documents or documents assigned to them
CREATE POLICY "Users can read accessible documents"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'documents' AND (
    auth.uid()::text = (storage.foldername(name))[1] OR
    EXISTS (
      SELECT 1 FROM public.documents d
      WHERE d.file_path = name
      AND (d.uploaded_by = auth.uid() OR d.assigned_to = auth.uid())
    )
  )
);

-- Allow users to delete their own uploaded documents
CREATE POLICY "Users can delete own documents"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'documents' AND
  auth.uid()::text = (storage.foldername(name))[1]
);