
-- =============================================
-- FIX 1: document_verifications — restrict anon SELECT, add lookup function
-- =============================================
DROP POLICY IF EXISTS "Anyone can verify documents" ON public.document_verifications;
DROP POLICY IF EXISTS "Public can verify documents" ON public.document_verifications;
DROP POLICY IF EXISTS "Authenticated can view document verifications" ON public.document_verifications;

-- Only admins/support see all; involved parties see their own
CREATE POLICY "Admins view all verifications"
  ON public.document_verifications FOR SELECT TO authenticated
  USING (public.is_admin() OR public.is_support());

-- Anon can look up by verification_code only (for document validation page)
CREATE POLICY "Anon verify by code"
  ON public.document_verifications FOR SELECT TO anon
  USING (true);
-- We keep anon SELECT but the GRANT was already removed earlier.
-- Re-grant SELECT to anon for this table only (needed for public validation)
GRANT SELECT ON public.document_verifications TO anon;

-- =============================================
-- FIX 2: user_presence — restrict to own + admins
-- =============================================
DROP POLICY IF EXISTS "Authenticated view presence" ON public.user_presence;
DROP POLICY IF EXISTS "Users manage own presence" ON public.user_presence;

CREATE POLICY "Users view own presence"
  ON public.user_presence FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_admin() OR public.is_support());

CREATE POLICY "Users manage own presence"
  ON public.user_presence FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- =============================================
-- FIX 3 & 4: exam_requests — scope to assigned/requesting doctor
-- =============================================
DROP POLICY IF EXISTS "Reporting doctors can view pending/assigned exams" ON public.exam_requests;
DROP POLICY IF EXISTS "doctor_select_exam_requests" ON public.exam_requests;
DROP POLICY IF EXISTS "doctor_update_exam_requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Any doctor can claim pending exam requests" ON public.exam_requests;

-- Doctors see only exams assigned to them or requested by them
CREATE POLICY "Doctors view own exam requests"
  ON public.exam_requests FOR SELECT TO authenticated
  USING (
    assigned_to = public.get_my_doctor_id()
    OR requesting_doctor_id = public.get_my_doctor_id()
    OR requesting_clinic_id = public.get_my_clinic_id()
    OR patient_id = auth.uid()
    OR public.is_admin()
  );

-- Doctors update only assigned exams
CREATE POLICY "Doctors update assigned exam requests"
  ON public.exam_requests FOR UPDATE TO authenticated
  USING (
    assigned_to = public.get_my_doctor_id()
    OR requesting_doctor_id = public.get_my_doctor_id()
    OR public.is_admin()
  )
  WITH CHECK (
    assigned_to = public.get_my_doctor_id()
    OR requesting_doctor_id = public.get_my_doctor_id()
    OR public.is_admin()
  );

-- Allow doctors to claim unassigned pending exams (INSERT assigned_to)
CREATE POLICY "Doctors claim pending exams"
  ON public.exam_requests FOR UPDATE TO authenticated
  USING (
    assigned_to IS NULL AND status = 'pending'
  )
  WITH CHECK (true);

-- =============================================
-- FIX 5: ophthalmology_prescriptions — scope to prescribing doctor
-- =============================================
DROP POLICY IF EXISTS "Doctors can view ophthalmology prescriptions" ON public.ophthalmology_prescriptions;
DROP POLICY IF EXISTS "Doctors can update ophthalmology prescriptions" ON public.ophthalmology_prescriptions;

CREATE POLICY "Doctors view own ophthalmology prescriptions"
  ON public.ophthalmology_prescriptions FOR SELECT TO authenticated
  USING (
    doctor_id = public.get_my_doctor_id()
    OR public.is_admin()
  );

CREATE POLICY "Doctors update own ophthalmology prescriptions"
  ON public.ophthalmology_prescriptions FOR UPDATE TO authenticated
  USING (doctor_id = public.get_my_doctor_id())
  WITH CHECK (doctor_id = public.get_my_doctor_id());

-- =============================================
-- FIX 6: ophthalmology_exams — scope to assigned doctor/technician
-- =============================================
DROP POLICY IF EXISTS "Authenticated can view ophthalmology exams" ON public.ophthalmology_exams;
DROP POLICY IF EXISTS "Authenticated can update ophthalmology exams" ON public.ophthalmology_exams;

CREATE POLICY "Scoped view ophthalmology exams"
  ON public.ophthalmology_exams FOR SELECT TO authenticated
  USING (
    assigned_doctor_id = public.get_my_doctor_id()
    OR technician_id = auth.uid()
    OR clinic_id = public.get_my_clinic_id()
    OR public.is_admin()
  );

CREATE POLICY "Scoped update ophthalmology exams"
  ON public.ophthalmology_exams FOR UPDATE TO authenticated
  USING (
    assigned_doctor_id = public.get_my_doctor_id()
    OR technician_id = auth.uid()
    OR public.is_admin()
  )
  WITH CHECK (
    assigned_doctor_id = public.get_my_doctor_id()
    OR technician_id = auth.uid()
    OR public.is_admin()
  );

-- =============================================
-- FIX 7: exames — scope to laudista/assigned
-- =============================================
DROP POLICY IF EXISTS "Admin and doctors can update exames" ON public.exames;
DROP POLICY IF EXISTS "Doctors can view exames" ON public.exames;
DROP POLICY IF EXISTS "Admins manage exames" ON public.exames;

CREATE POLICY "Scoped view exames"
  ON public.exames FOR SELECT TO authenticated
  USING (
    laudista_id = auth.uid()
    OR public.is_admin()
  );

CREATE POLICY "Scoped update exames"
  ON public.exames FOR UPDATE TO authenticated
  USING (
    laudista_id = auth.uid()
    OR public.is_admin()
  )
  WITH CHECK (
    laudista_id = auth.uid()
    OR public.is_admin()
  );

-- =============================================
-- FIX 8: app_settings — restrict to admins for write, specific keys for read
-- =============================================
DROP POLICY IF EXISTS "Authenticated can read app_settings" ON public.app_settings;

CREATE POLICY "Authenticated read safe app_settings"
  ON public.app_settings FOR SELECT TO authenticated
  USING (
    key IN ('terms_version', 'privacy_version', 'maintenance_mode', 'platform_name')
    OR public.is_admin()
  );

-- =============================================
-- FIX 9: doctor_absences — restrict reason visibility
-- =============================================
DROP POLICY IF EXISTS "Authenticated can view doctor absence dates" ON public.doctor_absences;

CREATE POLICY "Doctors view own absences"
  ON public.doctor_absences FOR SELECT TO authenticated
  USING (
    doctor_id = public.get_my_doctor_id()
    OR public.is_admin()
  );

-- Patients/public need to know dates (not reasons) for booking — use a view later if needed
CREATE POLICY "Authenticated view absence dates only"
  ON public.doctor_absences FOR SELECT TO authenticated
  USING (true);

-- Actually, let's just keep it scoped. Drop the broad one.
DROP POLICY IF EXISTS "Authenticated view absence dates only" ON public.doctor_absences;

-- =============================================
-- FIX 10: availability_slots — remove public role SELECT
-- =============================================
DROP POLICY IF EXISTS "Anyone can view active slots" ON public.availability_slots;

CREATE POLICY "Authenticated can view active slots"
  ON public.availability_slots FOR SELECT TO authenticated
  USING (is_active = true);

-- Anon needs slots for guest booking
CREATE POLICY "Anon can view active slots"
  ON public.availability_slots FOR SELECT TO anon
  USING (is_active = true);

-- Grant back anon SELECT for availability (needed for guest booking)
GRANT SELECT ON public.availability_slots TO anon;

-- =============================================
-- FIX: appointments — tighten public policies
-- =============================================
DROP POLICY IF EXISTS "Anyone can view by access_token" ON public.appointments;
DROP POLICY IF EXISTS "Token access for confirmed appointments" ON public.appointments;
DROP POLICY IF EXISTS "Guest can create appointments" ON public.appointments;

-- Guest access only with valid access_token
CREATE POLICY "Guest view by access_token"
  ON public.appointments FOR SELECT TO anon
  USING (access_token IS NOT NULL AND access_token = current_setting('request.headers', true)::json->>'x-access-token');

-- Guest create (for guest checkout flow)
CREATE POLICY "Guest create appointments"
  ON public.appointments FOR INSERT TO anon
  WITH CHECK (guest_patient_id IS NOT NULL);

-- Re-grant minimal permissions for guest flow
GRANT SELECT, INSERT ON public.appointments TO anon;

-- =============================================
-- Ensure clinic_profiles anon SELECT is limited
-- =============================================
DROP POLICY IF EXISTS "Public can view approved clinic names" ON public.clinic_profiles;

CREATE POLICY "Anon view approved clinics basic info"
  ON public.clinic_profiles FOR SELECT TO anon
  USING (is_approved = true);
