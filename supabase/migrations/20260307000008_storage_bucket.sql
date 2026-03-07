-- Private storage bucket for CSV/XLSX uploads and receipt images.

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'financial-uploads',
  'financial-uploads',
  false,
  52428800,  -- 50 MB
  ARRAY[
    'text/csv',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'image/jpeg',
    'image/png'
  ]
);

-- Users can only upload into their own uid-prefixed folder.
CREATE POLICY "user_upload" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'financial-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can only read files in their own folder.
CREATE POLICY "user_read" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'financial-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own files.
CREATE POLICY "user_delete" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'financial-uploads'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );
