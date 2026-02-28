
-- 1. RPC atômica para incrementar uso de cupom
CREATE OR REPLACE FUNCTION public.fn_increment_coupon_usage_atomic(p_code TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_coupon RECORD;
BEGIN
  SELECT * INTO v_coupon FROM coupons
  WHERE code = p_code AND is_active = true
  FOR UPDATE;

  IF NOT FOUND THEN RETURN FALSE; END IF;

  IF v_coupon.expires_at IS NOT NULL AND v_coupon.expires_at < now() THEN
    RETURN FALSE;
  END IF;

  IF v_coupon.max_uses IS NOT NULL AND v_coupon.times_used >= v_coupon.max_uses THEN
    RETURN FALSE;
  END IF;

  UPDATE coupons SET times_used = times_used + 1 WHERE code = p_code;
  RETURN TRUE;
END;
$$;

-- 2. Add settings jsonb to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS settings jsonb DEFAULT '{}';

-- 3. UNIQUE constraint on satisfaction_surveys to prevent double ratings
ALTER TABLE public.satisfaction_surveys
  DROP CONSTRAINT IF EXISTS satisfaction_surveys_appointment_patient_unique;
ALTER TABLE public.satisfaction_surveys
  ADD CONSTRAINT satisfaction_surveys_appointment_patient_unique
  UNIQUE (appointment_id, patient_id);

-- 4. UNIQUE constraint on prescription_validations to prevent double validation
ALTER TABLE public.prescription_validations
  DROP CONSTRAINT IF EXISTS prescription_validations_prescription_unique;
ALTER TABLE public.prescription_validations
  ADD CONSTRAINT prescription_validations_prescription_unique
  UNIQUE (prescription_id);
