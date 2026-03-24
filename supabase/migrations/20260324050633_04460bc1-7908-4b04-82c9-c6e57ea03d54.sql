
ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS kyc_verified_at timestamptz,
  ADD COLUMN IF NOT EXISTS kyc_face_match_score numeric;

COMMENT ON COLUMN public.doctor_profiles.kyc_status IS 'KYC verification status: pending, verified, failed';
COMMENT ON COLUMN public.doctor_profiles.kyc_verified_at IS 'When KYC was successfully verified';
COMMENT ON COLUMN public.doctor_profiles.kyc_face_match_score IS 'Face match similarity score (0-1)';
