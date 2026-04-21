-- Add missing columns to prescriptions
ALTER TABLE public.prescriptions 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'finalized',
ADD COLUMN IF NOT EXISTS observations TEXT;

-- Add missing columns to document_verifications
ALTER TABLE public.document_verifications 
ADD COLUMN IF NOT EXISTS verification_code TEXT UNIQUE,
ADD COLUMN IF NOT EXISTS patient_name TEXT,
ADD COLUMN IF NOT EXISTS patient_cpf TEXT,
ADD COLUMN IF NOT EXISTS doctor_name TEXT,
ADD COLUMN IF NOT EXISTS doctor_crm TEXT,
ADD COLUMN IF NOT EXISTS details JSONB DEFAULT '{}'::jsonb;

-- Add index for faster verification
CREATE INDEX IF NOT EXISTS idx_document_verifications_code ON public.document_verifications(verification_code);

-- Update RLS for document_verifications to allow public verification
CREATE POLICY "Anyone can view verification by code" 
ON public.document_verifications FOR SELECT 
USING (true);
