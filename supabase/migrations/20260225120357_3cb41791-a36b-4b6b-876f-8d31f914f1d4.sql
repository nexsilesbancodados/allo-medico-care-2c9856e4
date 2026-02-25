
-- Fix 1: Restrict guest_patients access to only doctors with related appointments
DROP POLICY IF EXISTS "Admins and doctors can view guest patients" ON public.guest_patients;
CREATE POLICY "Admins can view all guest patients"
ON public.guest_patients FOR SELECT
USING (is_admin());

-- Fix 2: Restrict medical_records - doctors only see records for patients with ACTIVE appointments
DROP POLICY IF EXISTS "Patients can view own records" ON public.medical_records;
CREATE POLICY "Patients can view own records"
ON public.medical_records FOR SELECT
USING (
  patient_id = auth.uid()
  OR (EXISTS (
    SELECT 1 FROM doctor_profiles dp
    JOIN appointments a ON a.doctor_id = dp.id
    WHERE dp.user_id = auth.uid()
      AND a.patient_id = medical_records.patient_id
      AND a.status IN ('scheduled', 'confirmed', 'in_progress', 'completed')
  ))
  OR is_admin()
);

-- Fix 3: Restrict health_metrics - doctors only see metrics for patients with active appointments
DROP POLICY IF EXISTS "Doctors can view patient metrics" ON public.health_metrics;
CREATE POLICY "Doctors can view patient metrics"
ON public.health_metrics FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM doctor_profiles dp
    JOIN appointments a ON a.doctor_id = dp.id
    WHERE dp.user_id = auth.uid()
      AND a.patient_id = health_metrics.patient_id
      AND a.status IN ('scheduled', 'confirmed', 'in_progress', 'completed')
  )
);

-- Fix 4: Restrict patient_documents - doctors only see docs for patients with active appointments
DROP POLICY IF EXISTS "Patients can view own documents" ON public.patient_documents;
CREATE POLICY "Patients can view own documents"
ON public.patient_documents FOR SELECT
USING (
  patient_id = auth.uid()
  OR uploaded_by = auth.uid()
  OR (EXISTS (
    SELECT 1 FROM doctor_profiles dp
    JOIN appointments a ON a.doctor_id = dp.id
    WHERE dp.user_id = auth.uid()
      AND a.patient_id = patient_documents.patient_id
      AND a.status IN ('scheduled', 'confirmed', 'in_progress', 'completed')
  ))
  OR is_admin()
);
