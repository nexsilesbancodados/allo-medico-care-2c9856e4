
-- =============================================================
-- HARDENING TOTAL: Fechar TODA exposição pública do banco
-- =============================================================

-- =========== 1. REVOGAR TODOS OS GRANTS DE ANON ===========
-- Remove SELECT de anon em TODAS as tabelas sensíveis
REVOKE SELECT ON public.doctor_profiles FROM anon;
REVOKE SELECT ON public.clinic_profiles FROM anon;
REVOKE SELECT ON public.document_verifications FROM anon;
REVOKE SELECT ON public.appointments FROM anon;

-- Remove INSERT de anon (guest flow usa service_role via edge function)
REVOKE INSERT ON public.appointments FROM anon;
REVOKE INSERT ON public.guest_patients FROM anon;

-- Revogar da role PUBLIC (fallback de segurança)
REVOKE ALL ON public.doctor_profiles FROM PUBLIC;
REVOKE ALL ON public.clinic_profiles FROM PUBLIC;
REVOKE ALL ON public.document_verifications FROM PUBLIC;
REVOKE ALL ON public.appointments FROM PUBLIC;
REVOKE ALL ON public.guest_patients FROM PUBLIC;

-- Revogar SELECT e escrita de anon na view doctor_profiles_public
REVOKE ALL ON public.doctor_profiles_public FROM anon;
REVOKE ALL ON public.doctor_profiles_public FROM PUBLIC;
-- Manter apenas para authenticated
GRANT SELECT ON public.doctor_profiles_public TO authenticated;

-- Revogar escrita de anon/PUBLIC em tabelas de catálogo (manter apenas SELECT)
REVOKE INSERT, UPDATE, DELETE ON public.optical_frames FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.optical_lens_types FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.health_tips FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.plans FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.specialties FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.doctor_specialties FROM anon, PUBLIC;
REVOKE INSERT, UPDATE, DELETE ON public.availability_slots FROM anon, PUBLIC;

-- wallet_balances view: apenas authenticated
REVOKE ALL ON public.wallet_balances FROM PUBLIC;
GRANT SELECT ON public.wallet_balances TO authenticated;

-- =========== 2. FUNÇÕES SEGURAS PARA ACESSO PÚBLICO ===========

-- 2a. Validar documento público (sem expor PII como CPF/hash)
CREATE OR REPLACE FUNCTION public.verify_document_public(p_code text)
RETURNS TABLE (
  verification_code text,
  document_type text,
  patient_name text,
  doctor_name text,
  doctor_crm text,
  issued_at timestamptz,
  details jsonb
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    dv.verification_code,
    dv.document_type,
    dv.patient_name,
    dv.doctor_name,
    dv.doctor_crm,
    dv.issued_at,
    COALESCE(dv.details, '{}'::jsonb)
  FROM public.document_verifications dv
  WHERE dv.verification_code = p_code
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.verify_document_public(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_document_public(text) TO anon, authenticated;

-- 2b. Perfil público do médico (sem user_id, kyc, rejection_reason)
CREATE OR REPLACE FUNCTION public.get_public_doctor_profile(p_doctor_id uuid)
RETURNS TABLE (
  id uuid,
  first_name text,
  last_name text,
  avatar_url text,
  bio text,
  consultation_price numeric,
  crm text,
  crm_state text,
  rating numeric,
  total_reviews integer,
  education text,
  experience_years integer,
  available_now boolean,
  specialties text[]
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    dp.id,
    p.first_name,
    p.last_name,
    p.avatar_url,
    dp.bio,
    dp.consultation_price,
    dp.crm,
    dp.crm_state,
    dp.rating,
    dp.total_reviews,
    dp.education,
    dp.experience_years,
    dp.available_now,
    COALESCE(
      array_agg(DISTINCT s.name) FILTER (WHERE s.name IS NOT NULL),
      ARRAY[]::text[]
    ) AS specialties
  FROM public.doctor_profiles dp
  JOIN public.profiles p ON p.user_id = dp.user_id
  LEFT JOIN public.doctor_specialties ds ON ds.doctor_id = dp.id
  LEFT JOIN public.specialties s ON s.id = ds.specialty_id
  WHERE dp.id = p_doctor_id AND dp.is_approved = true
  GROUP BY dp.id, p.first_name, p.last_name, p.avatar_url,
           dp.bio, dp.consultation_price, dp.crm, dp.crm_state,
           dp.rating, dp.total_reviews, dp.education,
           dp.experience_years, dp.available_now;
$$;

REVOKE ALL ON FUNCTION public.get_public_doctor_profile(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_public_doctor_profile(uuid) TO anon, authenticated;

-- 2c. Resolver slug do médico para ID (busca pública)
CREATE OR REPLACE FUNCTION public.resolve_doctor_slug(p_crm text, p_state text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dp.id
  FROM public.doctor_profiles dp
  WHERE dp.crm = p_crm AND dp.crm_state = p_state AND dp.is_approved = true
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.resolve_doctor_slug(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.resolve_doctor_slug(text, text) TO anon, authenticated;

-- 2d. Buscar médico por nome (para slug fallback)
CREATE OR REPLACE FUNCTION public.search_doctor_by_name(p_name text)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT dp.id
  FROM public.profiles p
  JOIN public.doctor_profiles dp ON dp.user_id = p.user_id
  WHERE dp.is_approved = true
    AND p.first_name ILIKE '%' || p_name || '%'
  LIMIT 1;
$$;

REVOKE ALL ON FUNCTION public.search_doctor_by_name(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_doctor_by_name(text) TO anon, authenticated;

-- =========== 3. DESATIVAR ESCALAÇÃO DE PRIVILÉGIOS ===========
-- A função assign_admin_on_signup permite escalação por email hardcoded
CREATE OR REPLACE FUNCTION public.assign_admin_on_signup()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- HARDENING: Desabilitado. Admins devem ser criados manualmente via dashboard.
  RETURN NEW;
END;
$$;

-- =========== 4. HARDENING DE VIEWS ===========
ALTER VIEW public.doctor_profiles_public SET (security_invoker = true);
ALTER VIEW public.wallet_balances SET (security_invoker = true);
