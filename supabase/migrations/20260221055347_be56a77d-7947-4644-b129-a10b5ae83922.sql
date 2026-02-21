
-- Symptom diary entries table
CREATE TABLE public.symptom_diary (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL,
  entry_date date NOT NULL DEFAULT CURRENT_DATE,
  mood text NOT NULL DEFAULT 'neutral',
  symptoms text[] DEFAULT '{}'::text[],
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(patient_id, entry_date)
);

ALTER TABLE public.symptom_diary ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own diary" ON public.symptom_diary
FOR ALL USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Doctors can view patient diary" ON public.symptom_diary
FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM doctor_profiles dp
    JOIN appointments a ON a.doctor_id = dp.id
    WHERE dp.user_id = auth.uid() AND a.patient_id = symptom_diary.patient_id
  )
);

CREATE POLICY "Admins manage diary" ON public.symptom_diary
FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- Make prescriptions publicly readable by ID for validation page
CREATE POLICY "Anyone can validate prescriptions by id" ON public.prescriptions
FOR SELECT USING (true);
