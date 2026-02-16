
-- 1. Add appointment_type to appointments (first_visit, return, urgency)
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS appointment_type text DEFAULT 'first_visit';

-- 2. Create patient_documents table for exam uploads
CREATE TABLE public.patient_documents (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL,
  appointment_id uuid REFERENCES public.appointments(id),
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size bigint,
  description text,
  uploaded_by uuid NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.patient_documents ENABLE ROW LEVEL SECURITY;

-- Patient can view own documents
CREATE POLICY "Patients can view own documents"
ON public.patient_documents FOR SELECT
USING (
  patient_id = auth.uid()
  OR uploaded_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM doctor_profiles dp
    JOIN appointments a ON a.doctor_id = dp.id
    WHERE dp.user_id = auth.uid()
    AND a.patient_id = patient_documents.patient_id
  )
  OR is_admin()
);

-- Patients can upload documents
CREATE POLICY "Users can upload documents"
ON public.patient_documents FOR INSERT
WITH CHECK (
  uploaded_by = auth.uid()
);

-- Patients can delete own uploads
CREATE POLICY "Users can delete own documents"
ON public.patient_documents FOR DELETE
USING (uploaded_by = auth.uid() OR is_admin());

-- 3. Create storage bucket for patient exams (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('patient-documents', 'patient-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for patient-documents bucket
CREATE POLICY "Users can upload own documents to storage"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'patient-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can view own documents in storage"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'patient-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR EXISTS (
      SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'doctor'
    )
    OR is_admin()
  )
);

CREATE POLICY "Users can delete own documents from storage"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'patient-documents'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
