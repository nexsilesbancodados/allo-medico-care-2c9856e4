
-- 1. Add new columns to exam_requests
ALTER TABLE public.exam_requests
  ADD COLUMN IF NOT EXISTS requesting_clinic_id UUID REFERENCES public.clinic_profiles(id) NULL,
  ADD COLUMN IF NOT EXISTS patient_name TEXT NULL,
  ADD COLUMN IF NOT EXISTS patient_birth_date DATE NULL,
  ADD COLUMN IF NOT EXISTS patient_sex TEXT NULL,
  ADD COLUMN IF NOT EXISTS exam_date DATE NULL;

-- 2. Add check constraint for patient_sex
ALTER TABLE public.exam_requests
  ADD CONSTRAINT chk_patient_sex CHECK (patient_sex IS NULL OR patient_sex IN ('M','F','O'));

-- 3. Make requesting_doctor_id nullable
ALTER TABLE public.exam_requests ALTER COLUMN requesting_doctor_id DROP NOT NULL;

-- 4. Helper function to get clinic_profile_id for current user
CREATE OR REPLACE FUNCTION public.get_my_clinic_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.clinic_profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- 5. Helper function to get doctor_profile_id for current user
CREATE OR REPLACE FUNCTION public.get_my_doctor_id()
RETURNS UUID
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid() LIMIT 1
$$;

-- 6. Drop existing RLS policies on exam_requests to recreate
DROP POLICY IF EXISTS "Doctors can view exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Doctors can insert exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Doctors can update exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Users can view their exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Users can create exam requests" ON public.exam_requests;
DROP POLICY IF EXISTS "Doctors can update their assigned exams" ON public.exam_requests;

-- 7. New RLS policies for exam_requests

-- Doctors/laudistas: see all pending/in_review + their assigned/reported
CREATE POLICY "doctor_select_exam_requests" ON public.exam_requests
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin'))
);

-- Clinics: see only their own
CREATE POLICY "clinic_select_exam_requests" ON public.exam_requests
FOR SELECT TO authenticated
USING (
  requesting_clinic_id = public.get_my_clinic_id()
);

-- Doctors insert
CREATE POLICY "doctor_insert_exam_requests" ON public.exam_requests
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin'))
);

-- Clinics insert
CREATE POLICY "clinic_insert_exam_requests" ON public.exam_requests
FOR INSERT TO authenticated
WITH CHECK (
  requesting_clinic_id = public.get_my_clinic_id()
);

-- Doctors update (for claim/status)
CREATE POLICY "doctor_update_exam_requests" ON public.exam_requests
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin'))
);

-- 8. RLS for exam_reports: allow clinic to see reports for their exams
DROP POLICY IF EXISTS "Reporters can view their reports" ON public.exam_reports;
DROP POLICY IF EXISTS "Reporters can insert reports" ON public.exam_reports;
DROP POLICY IF EXISTS "Reporters can update reports" ON public.exam_reports;

CREATE POLICY "doctor_select_exam_reports" ON public.exam_reports
FOR SELECT TO authenticated
USING (
  reporter_id = public.get_my_doctor_id()
  OR EXISTS (
    SELECT 1 FROM public.exam_requests er
    WHERE er.id = exam_request_id
    AND er.requesting_clinic_id = public.get_my_clinic_id()
  )
  OR EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin'))
);

CREATE POLICY "doctor_insert_exam_reports" ON public.exam_reports
FOR INSERT TO authenticated
WITH CHECK (
  reporter_id = public.get_my_doctor_id()
);

CREATE POLICY "doctor_update_exam_reports" ON public.exam_reports
FOR UPDATE TO authenticated
USING (
  reporter_id = public.get_my_doctor_id()
);

-- 9. Trigger: when exam_reports.signed_at is set, update exam_requests.status to 'reported'
CREATE OR REPLACE FUNCTION public.fn_mark_exam_reported_on_sign()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.signed_at IS NOT NULL AND OLD.signed_at IS NULL THEN
    UPDATE public.exam_requests
    SET status = 'reported'
    WHERE id = NEW.exam_request_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_mark_exam_reported ON public.exam_reports;
CREATE TRIGGER trg_mark_exam_reported
  AFTER UPDATE ON public.exam_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_mark_exam_reported_on_sign();
