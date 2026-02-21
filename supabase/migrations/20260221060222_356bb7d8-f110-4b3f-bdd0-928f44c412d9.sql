
-- Table to store certificate/attestation verification codes
CREATE TABLE public.document_verifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  verification_code text NOT NULL UNIQUE,
  document_type text NOT NULL DEFAULT 'certificate',
  patient_name text NOT NULL,
  patient_cpf text,
  doctor_name text NOT NULL,
  doctor_crm text,
  issued_at timestamp with time zone NOT NULL DEFAULT now(),
  details jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.document_verifications ENABLE ROW LEVEL SECURITY;

-- Anyone can verify a document (public validation)
CREATE POLICY "Anyone can verify documents" 
ON public.document_verifications 
FOR SELECT 
USING (true);

-- Only authenticated doctors can create verifications
CREATE POLICY "Doctors can create verifications" 
ON public.document_verifications 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = auth.uid() AND role IN ('doctor', 'admin')
  )
);

-- Create index for fast lookup
CREATE INDEX idx_document_verifications_code ON public.document_verifications(verification_code);
