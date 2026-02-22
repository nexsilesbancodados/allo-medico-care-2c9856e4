
-- Table for tracking user consent to terms of service and privacy policy
CREATE TABLE public.user_consents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  consent_type text NOT NULL DEFAULT 'terms_and_privacy',
  version text NOT NULL DEFAULT '1.0',
  accepted_at timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  user_agent text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Users can view own consents
CREATE POLICY "Users can view own consents" ON public.user_consents
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR is_admin());

-- Users can insert own consents
CREATE POLICY "Users can insert own consents" ON public.user_consents
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Admins can view all consents
CREATE POLICY "Admins can view all consents" ON public.user_consents
  FOR SELECT TO authenticated
  USING (is_admin());

-- Add document_hash column to document_verifications for digital signature
ALTER TABLE public.document_verifications 
  ADD COLUMN IF NOT EXISTS document_hash text;

-- Add document_hash column to prescriptions for digital signature
ALTER TABLE public.prescriptions 
  ADD COLUMN IF NOT EXISTS document_hash text;
