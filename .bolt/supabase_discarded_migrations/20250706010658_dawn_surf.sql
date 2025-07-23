/*
  # Add promotional images storage bucket and image_url field

  1. Storage Bucket
    - Create 'promotional-images' bucket for promotion images
    - Public read access for displaying images
    - 5MB file size limit
    - Restricted to image formats

  2. Database Changes
    - Add image_url field to promotions table
    - Allow storing image URLs for promotional content

  3. Security Policies
    - Public read access for promotional images
    - Authenticated users can upload/manage promotional images
*/

-- Add image_url column to promotions table
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'promotions' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE promotions ADD COLUMN image_url text;
  END IF;
END $$;

-- Create promotional-images storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'promotional-images',
  'promotional-images',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Drop existing promotional image policies to avoid conflicts
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' 
        AND tablename = 'objects'
        AND policyname ILIKE '%promotional%'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(policy_record.policyname) || ' ON storage.objects';
        EXCEPTION
            WHEN OTHERS THEN
                NULL;
        END;
    END LOOP;
END $$;

-- Create storage policies for promotional images
CREATE POLICY "Promotional images are publicly accessible"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'promotional-images');

CREATE POLICY "Authenticated users can upload promotional images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'promotional-images');

CREATE POLICY "Authenticated users can update promotional images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'promotional-images')
WITH CHECK (bucket_id = 'promotional-images');

CREATE POLICY "Authenticated users can delete promotional images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'promotional-images');