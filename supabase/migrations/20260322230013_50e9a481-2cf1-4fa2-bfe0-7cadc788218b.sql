
-- FIX: Remove remaining overly permissive policies that weren't dropped in failed migration

-- exames: Remove broad authenticated policies (laudista-scoped ones already exist)
DROP POLICY IF EXISTS "Authenticated users can view exames" ON public.exames;
DROP POLICY IF EXISTS "Authenticated users can update exames" ON public.exames;
DROP POLICY IF EXISTS "Authenticated users can insert exames" ON public.exames;

-- medical_records: Remove broad doctor policies
DROP POLICY IF EXISTS "Doctors can create records" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors can update records" ON public.medical_records;

-- medical_records: Create properly scoped policies
CREATE POLICY "Doctors create records for active patients"
  ON public.medical_records FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp
      JOIN public.appointments a ON a.doctor_id = dp.id
      WHERE dp.user_id = auth.uid()
        AND a.patient_id = medical_records.patient_id
        AND a.status = 'in_progress'
    )
    OR patient_id = auth.uid()
    OR is_admin()
  );

CREATE POLICY "Doctors update records for active patients"
  ON public.medical_records FOR UPDATE TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles dp
      JOIN public.appointments a ON a.doctor_id = dp.id
      WHERE dp.user_id = auth.uid()
        AND a.patient_id = medical_records.patient_id
        AND a.status = 'in_progress'
    )
    OR patient_id = auth.uid()
    OR is_admin()
  );

-- doctor_profiles: Remove PIX columns (data already migrated to doctor_financial)
ALTER TABLE public.doctor_profiles DROP COLUMN IF EXISTS pix_key;
ALTER TABLE public.doctor_profiles DROP COLUMN IF EXISTS pix_key_type;

-- symptom_diary: ensure broad doctor policy is gone
DROP POLICY IF EXISTS "Doctors can view patient diary" ON public.symptom_diary;
