-- =============================================================
-- ADMIN KYC REVIEW
-- Provides SECURITY DEFINER functions so admin users can
-- read and override KYC status on doctor_profiles (column-level
-- SELECT on kyc_status was revoked from `authenticated` role).
-- =============================================================

-- ── 1. List all doctors with KYC data (admin-only) ──────────────────────────
CREATE OR REPLACE FUNCTION public.fn_admin_doctor_kyc_list()
RETURNS TABLE(
  doctor_id            UUID,
  user_id              UUID,
  kyc_status           TEXT,
  kyc_face_match_score NUMERIC,
  kyc_verified_at      TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  RETURN QUERY
  SELECT dp.id, dp.user_id, dp.kyc_status, dp.kyc_face_match_score, dp.kyc_verified_at
    FROM public.doctor_profiles dp;
END;
$$;

-- ── 2. Admin manual KYC override ────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.fn_admin_set_doctor_kyc(
  p_doctor_id UUID,
  p_status    TEXT  -- 'approved' | 'rejected' | 'pending'
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles
     WHERE user_id = auth.uid() AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Unauthorized: admin role required';
  END IF;

  IF p_status NOT IN ('approved', 'rejected', 'pending') THEN
    RAISE EXCEPTION 'Invalid status: must be approved, rejected, or pending';
  END IF;

  UPDATE public.doctor_profiles
     SET kyc_status      = p_status,
         kyc_verified_at = CASE WHEN p_status = 'approved' THEN now() ELSE kyc_verified_at END,
         updated_at      = now()
   WHERE id = p_doctor_id;
END;
$$;

-- Grant execute to authenticated (the functions enforce admin check internally)
GRANT EXECUTE ON FUNCTION public.fn_admin_doctor_kyc_list()                         TO authenticated;
GRANT EXECUTE ON FUNCTION public.fn_admin_set_doctor_kyc(UUID, TEXT)                TO authenticated;
