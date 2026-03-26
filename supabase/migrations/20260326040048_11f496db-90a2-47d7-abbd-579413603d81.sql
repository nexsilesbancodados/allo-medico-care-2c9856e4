
-- =============================================================
-- HARDENING ROUND 2: Fechar os findings restantes do scan
-- =============================================================

-- 1. Remover políticas anon inseguras de document_verifications
DROP POLICY IF EXISTS "Anon verify by code" ON public.document_verifications;
DROP POLICY IF EXISTS "Anyone can verify documents by code" ON public.document_verifications;
-- Agora só a função verify_document_public(text) dá acesso anon

-- 2. Remover INSERT público de guest_patients (edge function usa service_role)
DROP POLICY IF EXISTS "Guest patients can be created with valid data" ON public.guest_patients;

-- 3. Remover política anon SELECT de doctor_profiles (agora usa RPC)
DROP POLICY IF EXISTS "Anon can view approved doctors" ON public.doctor_profiles;

-- 4. Restringir authenticated SELECT em doctor_profiles para esconder campos KYC
-- Trocar a política ampla por uma mais restrita
DROP POLICY IF EXISTS "Authenticated can view doctors" ON public.doctor_profiles;

-- Owner vê tudo do próprio perfil
CREATE POLICY "Owner reads own doctor profile"
  ON public.doctor_profiles FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Admin/support vê tudo
CREATE POLICY "Admin reads all doctor profiles"
  ON public.doctor_profiles FOR SELECT TO authenticated
  USING (is_admin() OR is_support());

-- Outros authenticated veem apenas dados públicos de médicos aprovados
-- (campos sensíveis como kyc_status ficam NULL pela column-level security abaixo)
CREATE POLICY "Authenticated reads approved doctors basic"
  ON public.doctor_profiles FOR SELECT TO authenticated
  USING (is_approved = true);

-- 4b. Revogar acesso a colunas sensíveis para authenticated (exceto owner/admin via policy)
REVOKE SELECT (kyc_status, kyc_face_match_score, kyc_verified_at, rejection_reason, crm_verified_by) 
  ON public.doctor_profiles FROM authenticated;
-- Re-grant ao service_role para edge functions
GRANT SELECT ON public.doctor_profiles TO service_role;

-- 5. Corrigir exam_reports: remover acesso amplo de doctor
DROP POLICY IF EXISTS "doctor_select_exam_reports" ON public.exam_reports;
CREATE POLICY "doctor_select_own_exam_reports"
  ON public.exam_reports FOR SELECT TO authenticated
  USING (
    reporter_id = get_my_doctor_id()
    OR is_admin()
    OR EXISTS (
      SELECT 1 FROM exam_requests er
      WHERE er.id = exam_reports.exam_request_id
      AND er.requesting_clinic_id = get_my_clinic_id()
    )
  );

-- 6. Corrigir exam_requests INSERT: exigir que requesting_doctor_id = próprio
DROP POLICY IF EXISTS "doctor_insert_exam_requests" ON public.exam_requests;
CREATE POLICY "doctor_insert_own_exam_requests"
  ON public.exam_requests FOR INSERT TO authenticated
  WITH CHECK (
    is_admin()
    OR (requesting_doctor_id = get_my_doctor_id())
  );

-- 7. Corrigir exames: restringir SELECT amplo de doctor para apenas laudista atribuído
DROP POLICY IF EXISTS "Admin and doctors can manage exames" ON public.exames;
CREATE POLICY "Admin and scoped laudista read exames"
  ON public.exames FOR SELECT TO authenticated
  USING (
    is_admin()
    OR laudista_id::text = (SELECT id::text FROM doctor_profiles WHERE user_id = auth.uid() LIMIT 1)
  );
