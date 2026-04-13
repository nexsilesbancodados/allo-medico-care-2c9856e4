
-- =============================================================
-- KYC AUTO-APPROVE TRIGGER
-- Automatically sets is_approved = true on doctor_profiles when
-- BOTH kyc_status = 'approved' AND crm_verified = true.
-- Covers two paths:
--   1. KYC webhook updates kyc_status → 'approved' (crm already verified)
--   2. Admin toggles crm_verified → true (kyc already approved)
-- =============================================================

-- -------------------------------------------------------
-- 1. TRIGGER FUNCTION: fn_check_doctor_approval
-- -------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_check_doctor_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doctor_name  TEXT;
  v_admin_id     UUID;
BEGIN
  -- Only proceed when both conditions are now met AND approval not yet set
  IF NEW.kyc_status = 'approved'
     AND NEW.crm_verified = TRUE
     AND OLD.is_approved = FALSE
  THEN
    -- Set approval flag and bump updated_at
    NEW.is_approved := TRUE;
    NEW.updated_at  := now();

    -- Fetch doctor's display name from profiles
    SELECT COALESCE(p.first_name, '') || ' ' || COALESCE(p.last_name, '')
      INTO v_doctor_name
      FROM public.profiles p
     WHERE p.user_id = NEW.user_id
     LIMIT 1;

    -- Notify the doctor
    INSERT INTO public.notifications
      (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '✅ Cadastro aprovado!',
      'Seu cadastro foi aprovado. Você já pode atender pacientes.',
      'system',
      '/dashboard'
    );

    -- Notify every admin
    FOR v_admin_id IN
      SELECT ur.user_id
        FROM public.user_roles ur
       WHERE ur.role = 'admin'
    LOOP
      INSERT INTO public.notifications
        (user_id, title, message, type)
      VALUES (
        v_admin_id,
        'Médico aprovado automaticamente',
        v_doctor_name || ' teve aprovação automática após KYC + CRM verificados.',
        'system'
      );
    END LOOP;

  END IF;

  RETURN NEW;
END;
$$;

-- -------------------------------------------------------
-- 2. ATTACH TRIGGER TO doctor_profiles
-- Drop first so re-running migration is safe (idempotent)
-- -------------------------------------------------------
DROP TRIGGER IF EXISTS trg_doctor_auto_approve ON public.doctor_profiles;

CREATE TRIGGER trg_doctor_auto_approve
  BEFORE UPDATE ON public.doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_check_doctor_approval();

-- -------------------------------------------------------
-- 3. ONE-TIME BACKFILL
-- Fix any existing doctors already stuck in limbo
-- (kyc approved + crm verified but is_approved still false)
-- The trigger only fires on UPDATE, so we patch them directly.
-- -------------------------------------------------------
UPDATE public.doctor_profiles
   SET is_approved = true,
       updated_at  = now()
 WHERE kyc_status   = 'approved'
   AND crm_verified = true
   AND is_approved  = false;

-- -------------------------------------------------------
-- NOTES ON AdminApprovals.tsx
-- -------------------------------------------------------
-- The admin UI (src/components/admin/AdminApprovals.tsx) has two relevant paths:
--
--   a) toggleCrmVerified()  — calls UPDATE doctor_profiles SET crm_verified = !current
--      This fires the trigger. If kyc_status is already 'approved', the trigger
--      will auto-set is_approved = true. No change needed to the component.
--
--   b) autoVerifyCrm()      — invokes edge function "verify-crm" which presumably
--      sets crm_verified = true via service_role. Same trigger path applies.
--
--   c) approve()            — manually sets is_approved = true. This is still valid
--      for cases where admin wants to override regardless of KYC/CRM state.
--
-- The component does NOT need to be changed. The trigger covers all cases.
-- -------------------------------------------------------
