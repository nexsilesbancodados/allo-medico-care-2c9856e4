
-- ============================================
-- SECURITY HARDENING: Fix critical RLS issues
-- ============================================

-- 1. PRESCRIPTIONS: Restrict to prescribing doctor + patient only
DROP POLICY IF EXISTS "Doctors can view prescriptions" ON public.prescriptions;
CREATE POLICY "Doctors can view own prescriptions"
ON public.prescriptions FOR SELECT TO authenticated
USING (
  auth.uid() = patient_id
  OR doctor_id = (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid() LIMIT 1)
  OR public.is_admin()
);

-- 2. MEDICAL RECORDS: Restrict doctors to only active appointments (not completed)
DROP POLICY IF EXISTS "Doctors can view patient medical records" ON public.medical_records;
CREATE POLICY "Doctors can view patient medical records active"
ON public.medical_records FOR SELECT TO authenticated
USING (
  auth.uid() = patient_id
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.doctor_id = (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid() LIMIT 1)
      AND (a.patient_id = medical_records.patient_id)
      AND a.status IN ('scheduled', 'confirmed', 'in_progress')
  )
);

-- 3. GUEST PATIENTS: Restrict to confirmed appointments only
DROP POLICY IF EXISTS "Doctors can view their guest patients" ON public.guest_patients;
CREATE POLICY "Doctors can view confirmed guest patients"
ON public.guest_patients FOR SELECT TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.guest_patient_id = guest_patients.id
      AND a.doctor_id = (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid() LIMIT 1)
      AND a.status IN ('confirmed', 'in_progress')
  )
);

-- 4. APPOINTMENTS token-based access: Remove overly permissive token policy
DROP POLICY IF EXISTS "Guest access via token" ON public.appointments;
DROP POLICY IF EXISTS "Anyone can view appointments with valid token" ON public.appointments;

-- Recreate token policy with tighter scope (only own appointment, confirmed status)
CREATE POLICY "Token access for confirmed appointments"
ON public.appointments FOR SELECT
USING (
  access_token IS NOT NULL
  AND access_token = current_setting('request.headers', true)::json->>'x-access-token'
  AND status IN ('confirmed', 'in_progress', 'completed')
);

-- 5. CONSULTATION NOTES: Allow patients to view their own notes
CREATE POLICY "Patients can view own consultation notes"
ON public.consultation_notes FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.id = consultation_notes.appointment_id
      AND a.patient_id = auth.uid()
  )
);

-- 6. PATIENT DOCUMENTS: Restrict doctors to active appointments only
DROP POLICY IF EXISTS "Doctors can view patient documents" ON public.patient_documents;
CREATE POLICY "Doctors can view patient documents active"
ON public.patient_documents FOR SELECT TO authenticated
USING (
  auth.uid() = patient_id
  OR auth.uid() = uploaded_by
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.doctor_id = (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid() LIMIT 1)
      AND a.patient_id = patient_documents.patient_id
      AND a.status IN ('scheduled', 'confirmed', 'in_progress')
  )
);

-- 7. SYMPTOM DIARY: Restrict to active appointments only
DROP POLICY IF EXISTS "Doctors can view patient symptom diary" ON public.symptom_diary;
CREATE POLICY "Doctors can view patient diary active only"
ON public.symptom_diary FOR SELECT TO authenticated
USING (
  auth.uid() = patient_id
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.doctor_id = (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid() LIMIT 1)
      AND a.patient_id = symptom_diary.patient_id
      AND a.status IN ('scheduled', 'confirmed', 'in_progress')
  )
);

-- 8. HEALTH METRICS: Restrict to active appointments
DROP POLICY IF EXISTS "Doctors can view patient health metrics" ON public.health_metrics;
CREATE POLICY "Doctors can view patient metrics active only"
ON public.health_metrics FOR SELECT TO authenticated
USING (
  auth.uid() = patient_id
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    WHERE a.doctor_id = (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid() LIMIT 1)
      AND a.patient_id = health_metrics.patient_id
      AND a.status IN ('scheduled', 'confirmed', 'in_progress')
  )
);

-- 9. B2B_LEADS: Add rate-limit-friendly constraint (can't enforce in RLS, but add admin-only update)
-- Already has INSERT with true for anon, which is intentional. Keep as-is but note for monitoring.

-- 10. Enable leaked password protection note: must be done in Supabase dashboard
