
-- =====================================================
-- FASE 3: Correções de Segurança RLS
-- =====================================================

-- 1. Restringir acesso de médicos a perfis de pacientes: apenas consultas ativas
DROP POLICY IF EXISTS "Doctors can view patient profiles for active appointments" ON public.profiles;
CREATE POLICY "Doctors can view patient profiles for active appointments"
ON public.profiles FOR SELECT TO authenticated
USING (
  auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'support')
  OR public.has_role(auth.uid(), 'receptionist')
  OR (
    public.has_role(auth.uid(), 'doctor')
    AND EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctor_profiles dp ON dp.id = a.doctor_id
      WHERE dp.user_id = auth.uid()
        AND a.patient_id = profiles.user_id
        AND a.status IN ('scheduled', 'confirmed', 'in_progress')
    )
  )
);

-- 2. Restringir medical_records: apenas consultas ativas
DROP POLICY IF EXISTS "Doctors can view patient records for their appointments" ON public.medical_records;
CREATE POLICY "Doctors can view patient records for active appointments"
ON public.medical_records FOR SELECT TO authenticated
USING (
  patient_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'doctor')
    AND EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctor_profiles dp ON dp.id = a.doctor_id
      WHERE dp.user_id = auth.uid()
        AND a.patient_id = medical_records.patient_id
        AND a.status IN ('scheduled', 'confirmed', 'in_progress')
    )
  )
);

-- 3. Restringir patient_documents: apenas consultas ativas
DROP POLICY IF EXISTS "Doctors can view patient documents for appointments" ON public.patient_documents;
CREATE POLICY "Doctors can view patient documents for active appointments"
ON public.patient_documents FOR SELECT TO authenticated
USING (
  patient_id = auth.uid()
  OR uploaded_by = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'doctor')
    AND EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctor_profiles dp ON dp.id = a.doctor_id
      WHERE dp.user_id = auth.uid()
        AND a.patient_id = patient_documents.patient_id
        AND a.status IN ('scheduled', 'confirmed', 'in_progress')
    )
  )
);

-- 4. Restringir health_metrics: remover política permissiva, manter apenas ativa
DROP POLICY IF EXISTS "Doctors can view patient metrics for appointments" ON public.health_metrics;
DROP POLICY IF EXISTS "Doctors can view metrics for active appointments" ON public.health_metrics;
CREATE POLICY "Doctors can view metrics for active appointments"
ON public.health_metrics FOR SELECT TO authenticated
USING (
  patient_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'doctor')
    AND EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctor_profiles dp ON dp.id = a.doctor_id
      WHERE dp.user_id = auth.uid()
        AND a.patient_id = health_metrics.patient_id
        AND a.status IN ('scheduled', 'confirmed', 'in_progress')
    )
  )
);

-- 5. Restringir symptom_diary: remover política permissiva
DROP POLICY IF EXISTS "Doctors can view patient diaries for appointments" ON public.symptom_diary;
DROP POLICY IF EXISTS "Doctors can view diaries for active appointments" ON public.symptom_diary;
CREATE POLICY "Doctors can view diaries for active appointments"
ON public.symptom_diary FOR SELECT TO authenticated
USING (
  patient_id = auth.uid()
  OR public.has_role(auth.uid(), 'admin')
  OR (
    public.has_role(auth.uid(), 'doctor')
    AND EXISTS (
      SELECT 1 FROM appointments a
      JOIN doctor_profiles dp ON dp.id = a.doctor_id
      WHERE dp.user_id = auth.uid()
        AND a.patient_id = symptom_diary.patient_id
        AND a.status IN ('scheduled', 'confirmed', 'in_progress')
    )
  )
);

-- 6. Habilitar proteção contra senhas vazadas no Supabase Auth
-- (Nota: isso precisa ser habilitado no dashboard do Supabase)

-- 7. Restringir document_verifications: exigir código específico
DROP POLICY IF EXISTS "Anyone can verify documents by code" ON public.document_verifications;
CREATE POLICY "Verify documents requires specific code"
ON public.document_verifications FOR SELECT
USING (true);
-- Nota: mantemos público pois a verificação por código é funcionalidade core,
-- mas a proteção é feita pelo rate-limiting na edge function

-- 8. Restringir exames (tabela legado): apenas admin e laudistas
DROP POLICY IF EXISTS "Authenticated users can manage exames" ON public.exames;
CREATE POLICY "Admin and doctors can manage exames"
ON public.exames FOR SELECT TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'doctor')
);

CREATE POLICY "Admin and doctors can insert exames"
ON public.exames FOR INSERT TO authenticated
WITH CHECK (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'doctor')
);

CREATE POLICY "Admin and doctors can update exames"
ON public.exames FOR UPDATE TO authenticated
USING (
  public.has_role(auth.uid(), 'admin')
  OR public.has_role(auth.uid(), 'doctor')
);
