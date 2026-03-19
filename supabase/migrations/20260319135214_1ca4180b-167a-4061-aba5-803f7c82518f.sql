-- Clinical anamnesis: stores structured anamnesis per appointment
CREATE TABLE public.clinical_anamnesis (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id),
  social_name TEXT,
  gender TEXT,
  chief_complaint TEXT NOT NULL DEFAULT '',
  history_present_illness TEXT DEFAULT '',
  past_medical_history TEXT DEFAULT '',
  family_history TEXT DEFAULT '',
  lifestyle_habits TEXT DEFAULT '',
  review_of_systems TEXT DEFAULT '',
  blood_pressure_sys INTEGER,
  blood_pressure_dia INTEGER,
  heart_rate INTEGER,
  respiratory_rate INTEGER,
  spo2 NUMERIC(5,2),
  temperature NUMERIC(4,1),
  weight NUMERIC(5,1),
  height NUMERIC(5,1),
  physical_exam_notes TEXT DEFAULT '',
  diagnostic_hypothesis TEXT DEFAULT '',
  cid_codes TEXT[] DEFAULT '{}',
  treatment_plan TEXT DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.clinical_evolution_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  record_id UUID NOT NULL,
  record_table TEXT NOT NULL DEFAULT 'clinical_anamnesis',
  changed_by UUID NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE INDEX idx_anamnesis_patient ON public.clinical_anamnesis(patient_id);
CREATE INDEX idx_anamnesis_appointment ON public.clinical_anamnesis(appointment_id);
CREATE INDEX idx_evolution_audit_record ON public.clinical_evolution_audit(record_id);

CREATE TRIGGER trg_anamnesis_updated_at
  BEFORE UPDATE ON public.clinical_anamnesis
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

ALTER TABLE public.clinical_anamnesis ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinical_evolution_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Doctors manage anamnesis" ON public.clinical_anamnesis
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = clinical_anamnesis.appointment_id
      AND a.doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
    )
    OR patient_id = auth.uid()
    OR public.is_admin()
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.appointments a
      WHERE a.id = clinical_anamnesis.appointment_id
      AND a.doctor_id IN (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
    )
    OR public.is_admin()
  );

ALTER TABLE public.clinical_evolution_audit ENABLE ROW LEVEL SECURITY;

CREATE POLICY "View audit trail" ON public.clinical_evolution_audit
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.clinical_anamnesis ca
      WHERE ca.id = clinical_evolution_audit.record_id
      AND (ca.patient_id = auth.uid() OR public.is_admin()
        OR EXISTS (SELECT 1 FROM public.doctor_profiles dp WHERE dp.user_id = auth.uid() AND dp.id = ca.doctor_id))
    )
  );

CREATE POLICY "Insert audit trail" ON public.clinical_evolution_audit
  FOR INSERT TO authenticated
  WITH CHECK (changed_by = auth.uid());

CREATE OR REPLACE FUNCTION public.fn_audit_anamnesis_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  col TEXT;
  old_val TEXT;
  new_val TEXT;
  cols TEXT[] := ARRAY[
    'chief_complaint','history_present_illness','past_medical_history',
    'family_history','lifestyle_habits','review_of_systems',
    'blood_pressure_sys','blood_pressure_dia','heart_rate','respiratory_rate',
    'spo2','temperature','weight','height','physical_exam_notes',
    'diagnostic_hypothesis','treatment_plan','social_name','gender'
  ];
BEGIN
  FOREACH col IN ARRAY cols LOOP
    EXECUTE format('SELECT ($1).%I::text, ($2).%I::text', col, col)
      INTO old_val, new_val USING OLD, NEW;
    IF old_val IS DISTINCT FROM new_val THEN
      INSERT INTO public.clinical_evolution_audit (record_id, record_table, changed_by, field_name, old_value, new_value)
      VALUES (NEW.id, 'clinical_anamnesis', COALESCE(auth.uid(), NEW.doctor_id::uuid), col, old_val, new_val);
    END IF;
  END LOOP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_anamnesis_changes
  AFTER UPDATE ON public.clinical_anamnesis
  FOR EACH ROW EXECUTE FUNCTION public.fn_audit_anamnesis_changes();