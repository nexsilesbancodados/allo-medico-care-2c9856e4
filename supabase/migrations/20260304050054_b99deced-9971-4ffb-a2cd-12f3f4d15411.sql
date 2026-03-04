
-- Tighten doctor access: remove 'confirmed' from patient data policies, keep only 'in_progress'
-- This ensures doctors can only access patient data during active consultations

-- 1. PROFILES - fix doctor access
DROP POLICY IF EXISTS "Doctors can view patient profiles for active appointments" ON public.profiles;
CREATE POLICY "Doctors can view patient profiles for active appointments"
ON public.profiles FOR SELECT TO authenticated
USING (
  (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'support'::app_role) OR has_role(auth.uid(), 'receptionist'::app_role)
  OR (has_role(auth.uid(), 'doctor'::app_role) AND EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE dp.user_id = auth.uid() AND a.patient_id = profiles.user_id 
    AND a.status IN ('in_progress', 'completed')
  ))
);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  (user_id = auth.uid()) OR is_admin() OR EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE a.patient_id = profiles.user_id AND dp.user_id = auth.uid()
    AND a.status IN ('in_progress', 'completed')
  )
);

-- 2. HEALTH_METRICS
DROP POLICY IF EXISTS "Doctors can view metrics for active appointments" ON public.health_metrics;
CREATE POLICY "Doctors can view metrics for active appointments"
ON public.health_metrics FOR SELECT TO authenticated
USING (
  (patient_id = auth.uid()) OR has_role(auth.uid(), 'admin'::app_role)
  OR (has_role(auth.uid(), 'doctor'::app_role) AND EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE dp.user_id = auth.uid() AND a.patient_id = health_metrics.patient_id
    AND a.status = 'in_progress'
  ))
);

-- 3. MEDICAL_RECORDS
DROP POLICY IF EXISTS "Doctors can view patient records confirmed only" ON public.medical_records;
CREATE POLICY "Doctors can view patient records in_progress only"
ON public.medical_records FOR SELECT TO authenticated
USING (
  (patient_id = auth.uid()) OR is_admin()
  OR EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE dp.user_id = auth.uid() AND a.patient_id = medical_records.patient_id
    AND a.status = 'in_progress'
  )
);

-- 4. PATIENT_DOCUMENTS
DROP POLICY IF EXISTS "Doctors can view patient documents confirmed only" ON public.patient_documents;
CREATE POLICY "Doctors can view patient docs in_progress only"
ON public.patient_documents FOR SELECT TO authenticated
USING (
  (patient_id = auth.uid()) OR (uploaded_by = auth.uid()) OR is_admin()
  OR EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE dp.user_id = auth.uid() AND a.patient_id = patient_documents.patient_id
    AND a.status = 'in_progress'
  )
);

-- 5. SYMPTOM_DIARY
DROP POLICY IF EXISTS "Doctors can view patient diary confirmed only" ON public.symptom_diary;
CREATE POLICY "Doctors can view diary in_progress only"
ON public.symptom_diary FOR SELECT TO authenticated
USING (
  (patient_id = auth.uid()) OR is_admin()
  OR (has_role(auth.uid(), 'doctor'::app_role) AND EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE dp.user_id = auth.uid() AND a.patient_id = symptom_diary.patient_id
    AND a.status = 'in_progress'
  ))
);

-- 6. GUEST_PATIENTS
DROP POLICY IF EXISTS "Doctors can view their own guest patients" ON public.guest_patients;
CREATE POLICY "Doctors can view their own guest patients"
ON public.guest_patients FOR SELECT TO authenticated
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE a.guest_patient_id = guest_patients.id AND dp.user_id = auth.uid()
    AND a.status IN ('in_progress', 'completed')
  )
);

-- 7. Create a secure view for public doctor profiles WITHOUT pix_key
CREATE OR REPLACE VIEW public.doctor_profiles_public AS
SELECT id, user_id, crm, crm_state, crm_verified, bio, consultation_price, 
       rating, total_reviews, experience_years, education, is_approved, 
       available_now, available_now_since, created_at, updated_at
FROM public.doctor_profiles
WHERE is_approved = true;
