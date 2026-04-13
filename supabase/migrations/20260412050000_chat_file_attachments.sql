-- Add file attachment support to messages table
ALTER TABLE messages
  ADD COLUMN IF NOT EXISTS file_url   TEXT,
  ADD COLUMN IF NOT EXISTS file_name  TEXT,
  ADD COLUMN IF NOT EXISTS file_type  TEXT,
  ADD COLUMN IF NOT EXISTS file_size  INTEGER;

-- Allow content to be empty when a file is attached
ALTER TABLE messages
  ALTER COLUMN content SET DEFAULT '';

-- Storage bucket for chat attachments (idempotent)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  10485760, -- 10 MB
  ARRAY['image/jpeg','image/png','image/webp','image/gif','application/pdf','text/plain']
)
ON CONFLICT (id) DO NOTHING;

-- RLS: appointment participants can upload/read their own chat files
CREATE POLICY "Chat participants can upload attachments"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE id::text = (storage.foldername(name))[1]
        AND (patient_id = auth.uid() OR doctor_id IN (
          SELECT id FROM doctor_profiles WHERE user_id = auth.uid()
        ))
    )
  );

CREATE POLICY "Chat participants can read attachments"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'chat-attachments'
    AND auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM appointments
      WHERE id::text = (storage.foldername(name))[1]
        AND (patient_id = auth.uid() OR doctor_id IN (
          SELECT id FROM doctor_profiles WHERE user_id = auth.uid()
        ))
    )
  );
