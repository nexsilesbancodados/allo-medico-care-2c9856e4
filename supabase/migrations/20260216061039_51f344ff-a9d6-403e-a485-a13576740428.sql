
-- Medical records: structured health data per patient
CREATE TABLE public.medical_records (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  record_type TEXT NOT NULL, -- 'allergy', 'medication', 'condition', 'evolution'
  title TEXT NOT NULL,
  description TEXT,
  cid_code TEXT, -- ICD/CID code for conditions
  severity TEXT, -- for allergies: mild, moderate, severe
  is_active BOOLEAN NOT NULL DEFAULT true,
  start_date DATE,
  end_date DATE,
  doctor_id UUID REFERENCES public.doctor_profiles(id),
  appointment_id UUID REFERENCES public.appointments(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can view own records"
  ON public.medical_records FOR SELECT
  USING (patient_id = auth.uid() OR EXISTS (
    SELECT 1 FROM doctor_profiles dp
    JOIN appointments a ON a.doctor_id = dp.id
    WHERE dp.user_id = auth.uid() AND a.patient_id = medical_records.patient_id
  ) OR is_admin());

CREATE POLICY "Doctors can create records"
  ON public.medical_records FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid()
  ) OR patient_id = auth.uid() OR is_admin());

CREATE POLICY "Doctors can update records"
  ON public.medical_records FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid()
  ) OR patient_id = auth.uid() OR is_admin());

CREATE INDEX idx_medical_records_patient ON public.medical_records (patient_id, record_type);

-- Satisfaction surveys (NPS)
CREATE TABLE public.satisfaction_surveys (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id),
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id),
  nps_score INTEGER NOT NULL CHECK (nps_score >= 0 AND nps_score <= 10),
  ease_score INTEGER CHECK (ease_score >= 1 AND ease_score <= 5),
  quality_score INTEGER CHECK (quality_score >= 1 AND quality_score <= 5),
  would_recommend BOOLEAN,
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.satisfaction_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients can create own surveys"
  ON public.satisfaction_surveys FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can view own surveys"
  ON public.satisfaction_surveys FOR SELECT
  USING (patient_id = auth.uid() OR EXISTS (
    SELECT 1 FROM doctor_profiles WHERE id = satisfaction_surveys.doctor_id AND user_id = auth.uid()
  ) OR is_admin());

CREATE INDEX idx_surveys_doctor ON public.satisfaction_surveys (doctor_id, created_at);
CREATE INDEX idx_surveys_appointment ON public.satisfaction_surveys (appointment_id);

-- Push subscriptions table
CREATE TABLE public.push_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  endpoint TEXT NOT NULL,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own push subs"
  ON public.push_subscriptions FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
