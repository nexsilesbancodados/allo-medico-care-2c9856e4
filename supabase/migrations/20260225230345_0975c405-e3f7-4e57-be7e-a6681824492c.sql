
-- Drop conflicting policies first, then recreate
DO $$
BEGIN
  -- Drop existing policies that conflict
  DROP POLICY IF EXISTS "Doctors can upload prescriptions" ON storage.objects;
  DROP POLICY IF EXISTS "Avatar images are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;
  DROP POLICY IF EXISTS "Patients can view own documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can upload own patient documents" ON storage.objects;
  DROP POLICY IF EXISTS "Users can delete own patient documents" ON storage.objects;
  DROP POLICY IF EXISTS "View prescriptions" ON storage.objects;
  DROP POLICY IF EXISTS "View exam files" ON storage.objects;
  DROP POLICY IF EXISTS "Upload exam files" ON storage.objects;
  DROP POLICY IF EXISTS "Clinic logos are publicly accessible" ON storage.objects;
  DROP POLICY IF EXISTS "Clinic owners can upload logos" ON storage.objects;
  DROP POLICY IF EXISTS "Clinic owners can update logos" ON storage.objects;
END $$;

-- Create buckets
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('patient-documents', 'patient-documents', false, 10485760, ARRAY['application/pdf','image/jpeg','image/png','image/webp']),
  ('prescriptions', 'prescriptions', false, 10485760, ARRAY['application/pdf']),
  ('exam-files', 'exam-files', false, 52428800, ARRAY['application/pdf','image/jpeg','image/png','application/dicom','image/webp']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg','image/png','image/webp']),
  ('clinic-logos', 'clinic-logos', true, 2097152, ARRAY['image/jpeg','image/png','image/webp','image/svg+xml'])
ON CONFLICT (id) DO NOTHING;

-- AVATARS
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- PATIENT DOCUMENTS
CREATE POLICY "Patients can view own documents" ON storage.objects FOR SELECT
  USING (bucket_id = 'patient-documents' AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
    OR EXISTS (SELECT 1 FROM public.doctor_profiles dp JOIN public.appointments a ON a.doctor_id = dp.id WHERE dp.user_id = auth.uid() AND a.patient_id::text = (storage.foldername(name))[1] AND a.status IN ('scheduled','confirmed','in_progress','completed'))
  ));
CREATE POLICY "Users can upload own patient documents" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'patient-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','doctor'))));
CREATE POLICY "Users can delete own patient documents" ON storage.objects FOR DELETE
  USING (bucket_id = 'patient-documents' AND (auth.uid()::text = (storage.foldername(name))[1] OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')));

-- PRESCRIPTIONS
CREATE POLICY "View prescriptions" ON storage.objects FOR SELECT
  USING (bucket_id = 'prescriptions' AND (auth.uid()::text = (storage.foldername(name))[1] OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','doctor'))));
CREATE POLICY "Doctors can upload prescriptions" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'prescriptions' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','doctor')));

-- EXAM FILES
CREATE POLICY "View exam files" ON storage.objects FOR SELECT
  USING (bucket_id = 'exam-files' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','doctor')));
CREATE POLICY "Upload exam files" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'exam-files' AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin','doctor','receptionist')));

-- CLINIC LOGOS
CREATE POLICY "Clinic logos are publicly accessible" ON storage.objects FOR SELECT USING (bucket_id = 'clinic-logos');
CREATE POLICY "Clinic owners can upload logos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'clinic-logos' AND (EXISTS (SELECT 1 FROM public.clinic_profiles WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')));
CREATE POLICY "Clinic owners can update logos" ON storage.objects FOR UPDATE
  USING (bucket_id = 'clinic-logos' AND (EXISTS (SELECT 1 FROM public.clinic_profiles WHERE user_id = auth.uid()) OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')));
