-- ============================================================
-- PROJ-11: Bild-Upload im Chat – Storage Bucket & RLS
-- ============================================================
-- Creates a private storage bucket for chat images with
-- family-scoped RLS policies. Images stored as:
--   {family_id}/{uuid}.{ext}
-- Access via signed URLs only (no public access).
-- ============================================================

-- 1. Create private bucket for chat images
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-images',
  'chat-images',
  false,          -- private: signed URLs required
  10485760,       -- 10 MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage RLS: Upload – any family member can upload to their family folder
CREATE POLICY "chat_images_insert"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND profiles.family_id IS NOT NULL
        AND split_part(name, '/', 1) = profiles.family_id::text
    )
  );

-- 3. Storage RLS: Select – family members can view images in their family folder
CREATE POLICY "chat_images_select"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-images'
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
        AND split_part(name, '/', 1) = profiles.family_id::text
    )
  );

-- 4. Storage RLS: Delete – own images or admin/adult can delete any family image
--    owner_id is text in storage.objects, auth.uid() returns uuid → cast needed
CREATE POLICY "chat_images_delete"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'chat-images'
    AND (
      -- Owner can delete own uploads
      owner_id = auth.uid()::text
      OR
      -- Admin/adult can delete any image in their family folder
      EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
          AND profiles.role IN ('admin', 'adult')
          AND split_part(name, '/', 1) = profiles.family_id::text
      )
    )
  );
