
-- =============================================================
-- HARDENING ROUND 3: Fechar findings finais
-- =============================================================

-- 1. Remover INSERT anon em appointments (guest flow usa service_role)
DROP POLICY IF EXISTS "Guest create appointments" ON public.appointments;

-- 2. Corrigir UPDATE de exames: laudista_id é doctor_profile.id, não auth.uid()
DROP POLICY IF EXISTS "Scoped update exames" ON public.exames;
CREATE POLICY "Scoped update exames"
  ON public.exames FOR UPDATE TO authenticated
  USING (
    is_admin()
    OR laudista_id = (SELECT id FROM doctor_profiles WHERE user_id = auth.uid() LIMIT 1)
  )
  WITH CHECK (
    is_admin()
    OR laudista_id = (SELECT id FROM doctor_profiles WHERE user_id = auth.uid() LIMIT 1)
  );

-- 3. Corrigir ophthalmology_prescriptions INSERT: exigir doctor_id = próprio
DROP POLICY IF EXISTS "Doctors can insert ophthalmology prescriptions" ON public.ophthalmology_prescriptions;
CREATE POLICY "Doctors insert own ophthalmology prescriptions"
  ON public.ophthalmology_prescriptions FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR doctor_id = get_my_doctor_id()
  );

-- 4. Corrigir ophthalmology_exams: restringir technician ao próprio exam
-- (technician_id já é auth.uid(), então a política está correta, mas vamos
--  garantir que assigned_doctor_id também seja escopo)
DROP POLICY IF EXISTS "Scoped view ophthalmology exams" ON public.ophthalmology_exams;
CREATE POLICY "Scoped view ophthalmology exams"
  ON public.ophthalmology_exams FOR SELECT TO authenticated
  USING (
    is_admin() OR is_support()
    OR technician_id = auth.uid()
    OR assigned_doctor_id = get_my_doctor_id()
    OR clinic_id = get_my_clinic_id()
  );

-- 5. Rate limits: permitir INSERT para authenticated (rate limiter precisa inserir)
CREATE POLICY "Authenticated can insert rate limits"
  ON public.rate_limits FOR INSERT TO authenticated
  WITH CHECK (true);

-- 6. Garantir que doctor_profiles column-level security funcione
-- Os campos sensíveis já foram revogados na migração anterior
-- Mas precisamos garantir que o SELECT geral ainda funcione para colunas públicas
GRANT SELECT (id, user_id, crm, crm_state, bio, education, experience_years, 
  consultation_price, is_approved, rating, total_reviews, created_at, updated_at,
  crm_verified, available_now, available_now_since) 
  ON public.doctor_profiles TO authenticated;
