-- Make requesting_doctor_id nullable so clinics can insert without a doctor
ALTER TABLE public.exam_requests ALTER COLUMN requesting_doctor_id DROP NOT NULL;

-- RLS: Clinic can see/insert their own exam_requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='clinic_select_own_exams' AND tablename='exam_requests') THEN
    CREATE POLICY clinic_select_own_exams ON public.exam_requests
      FOR SELECT TO authenticated
      USING (
        requesting_clinic_id IN (
          SELECT id FROM public.clinic_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='clinic_insert_own_exams' AND tablename='exam_requests') THEN
    CREATE POLICY clinic_insert_own_exams ON public.exam_requests
      FOR INSERT TO authenticated
      WITH CHECK (
        requesting_clinic_id IN (
          SELECT id FROM public.clinic_profiles WHERE user_id = auth.uid()
        )
      );
  END IF;
END $$;

-- RLS: Clinic can view exam reports for their exam requests
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='clinic_select_reports' AND tablename='exam_reports') THEN
    CREATE POLICY clinic_select_reports ON public.exam_reports
      FOR SELECT TO authenticated
      USING (
        exam_request_id IN (
          SELECT er.id FROM public.exam_requests er
          WHERE er.requesting_clinic_id IN (
            SELECT id FROM public.clinic_profiles WHERE user_id = auth.uid()
          )
        )
      );
  END IF;
END $$;

-- Trigger: auto-update exam_requests.status when report is signed
CREATE OR REPLACE FUNCTION public.update_exam_request_on_report_signed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.signed_at IS NULL AND NEW.signed_at IS NOT NULL THEN
    UPDATE public.exam_requests
    SET status = 'reported', completed_at = NEW.signed_at, updated_at = now()
    WHERE id = NEW.exam_request_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exam_report_signed ON public.exam_reports;
CREATE TRIGGER trg_exam_report_signed
  AFTER UPDATE OF signed_at ON public.exam_reports
  FOR EACH ROW
  EXECUTE FUNCTION public.update_exam_request_on_report_signed();