
-- Fix: Remove 'scheduled' from doctor access policies across all patient data tables
-- Doctors should only access patient data for 'confirmed' or 'in_progress' appointments

-- 1. PROFILES
DROP POLICY IF EXISTS "Doctors can view patient profiles for active appointments" ON public.profiles;
CREATE POLICY "Doctors can view patient profiles for active appointments"
ON public.profiles FOR SELECT TO authenticated
USING (
  (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'support'::app_role) OR has_role(auth.uid(), 'receptionist'::app_role)
  OR (has_role(auth.uid(), 'doctor'::app_role) AND EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE dp.user_id = auth.uid() AND a.patient_id = profiles.user_id 
    AND a.status IN ('confirmed', 'in_progress')
  ))
);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  (user_id = auth.uid()) OR is_admin() OR EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE a.patient_id = profiles.user_id AND dp.user_id = auth.uid()
    AND a.status IN ('confirmed', 'in_progress', 'completed')
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
    AND a.status IN ('confirmed', 'in_progress')
  ))
);

DROP POLICY IF EXISTS "Doctors can view patient metrics" ON public.health_metrics;
DROP POLICY IF EXISTS "Doctors can view patient metrics active only" ON public.health_metrics;

-- 3. MEDICAL_RECORDS
DROP POLICY IF EXISTS "Doctors can view patient medical records active" ON public.medical_records;
DROP POLICY IF EXISTS "Doctors can view patient records for active appointments" ON public.medical_records;

CREATE POLICY "Doctors can view patient records confirmed only"
ON public.medical_records FOR SELECT TO authenticated
USING (
  (patient_id = auth.uid()) OR is_admin()
  OR EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE dp.user_id = auth.uid() AND a.patient_id = medical_records.patient_id
    AND a.status IN ('confirmed', 'in_progress')
  )
);

-- 4. PATIENT_DOCUMENTS
DROP POLICY IF EXISTS "Doctors can view patient documents active" ON public.patient_documents;
DROP POLICY IF EXISTS "Doctors can view patient documents for active appointments" ON public.patient_documents;

CREATE POLICY "Doctors can view patient documents confirmed only"
ON public.patient_documents FOR SELECT TO authenticated
USING (
  (patient_id = auth.uid()) OR (uploaded_by = auth.uid()) OR is_admin()
  OR EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE dp.user_id = auth.uid() AND a.patient_id = patient_documents.patient_id
    AND a.status IN ('confirmed', 'in_progress')
  )
);

-- 5. SYMPTOM_DIARY
DROP POLICY IF EXISTS "Doctors can view diaries for active appointments" ON public.symptom_diary;
DROP POLICY IF EXISTS "Doctors can view patient diary active only" ON public.symptom_diary;

CREATE POLICY "Doctors can view patient diary confirmed only"
ON public.symptom_diary FOR SELECT TO authenticated
USING (
  (patient_id = auth.uid()) OR is_admin()
  OR (has_role(auth.uid(), 'doctor'::app_role) AND EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE dp.user_id = auth.uid() AND a.patient_id = symptom_diary.patient_id
    AND a.status IN ('confirmed', 'in_progress')
  ))
);

-- 6. GUEST_PATIENTS: fix the overly broad policy
DROP POLICY IF EXISTS "Doctors can view their own guest patients" ON public.guest_patients;

CREATE POLICY "Doctors can view their own guest patients"
ON public.guest_patients FOR SELECT TO authenticated
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE a.guest_patient_id = guest_patients.id AND dp.user_id = auth.uid()
    AND a.status IN ('confirmed', 'in_progress', 'completed')
  )
);
