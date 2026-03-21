
-- Adiciona colunas da clínica em exam_requests
ALTER TABLE public.exam_requests
  ADD COLUMN IF NOT EXISTS requesting_clinic_id uuid REFERENCES public.clinic_profiles(id),
  ADD COLUMN IF NOT EXISTS patient_name text,
  ADD COLUMN IF NOT EXISTS patient_birth_date date,
  ADD COLUMN IF NOT EXISTS patient_sex text CHECK (patient_sex IN ('M', 'F', 'O'));

-- Torna requesting_doctor_id nullable (clínica não tem doctor_profile)
ALTER TABLE public.exam_requests
  ALTER COLUMN requesting_doctor_id DROP NOT NULL;

-- RLS: clínica vê apenas seus próprios exam_requests
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exam_requests'
    AND policyname = 'Clinic can view own exam requests'
  ) THEN
    CREATE POLICY "Clinic can view own exam requests"
    ON public.exam_requests FOR SELECT TO authenticated
    USING (
      requesting_clinic_id IN (
        SELECT id FROM public.clinic_profiles WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- RLS: clínica pode inserir exam_requests com seu próprio clinic_id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'exam_requests'
    AND policyname = 'Clinic can insert own exam requests'
  ) THEN
    CREATE POLICY "Clinic can insert own exam requests"
    ON public.exam_requests FOR INSERT TO authenticated
    WITH CHECK (
      requesting_clinic_id IN (
        SELECT id FROM public.clinic_profiles WHERE user_id = auth.uid()
      )
    );
  END IF;
END $$;

-- Trigger: quando exam_report é assinado, atualizar exam_request.status para 'reported'
CREATE OR REPLACE FUNCTION public.fn_update_exam_status_on_sign()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.signed_at IS NOT NULL AND OLD.signed_at IS NULL THEN
    UPDATE public.exam_requests
    SET status = 'reported', updated_at = now()
    WHERE id = NEW.exam_request_id;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_update_exam_status_on_sign ON public.exam_reports;
CREATE TRIGGER trg_update_exam_status_on_sign
AFTER UPDATE ON public.exam_reports
FOR EACH ROW EXECUTE FUNCTION public.fn_update_exam_status_on_sign();
