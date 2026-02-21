
-- Add "available now" toggle for on-duty doctors
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS available_now boolean NOT NULL DEFAULT false;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS available_now_since timestamp with time zone;

-- Create pre-consultation symptoms table
CREATE TABLE public.pre_consultation_symptoms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  patient_id uuid NOT NULL,
  main_complaint text NOT NULL,
  symptoms text[] DEFAULT '{}',
  duration text,
  severity text DEFAULT 'moderate',
  additional_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.pre_consultation_symptoms ENABLE ROW LEVEL SECURITY;

-- Patients can create/view their own symptoms
CREATE POLICY "Patients can insert own symptoms"
ON public.pre_consultation_symptoms FOR INSERT
WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Patients can view own symptoms"
ON public.pre_consultation_symptoms FOR SELECT
USING (patient_id = auth.uid());

-- Doctors can view symptoms for their appointments
CREATE POLICY "Doctors can view patient symptoms"
ON public.pre_consultation_symptoms FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM appointments a
    JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE a.id = pre_consultation_symptoms.appointment_id
    AND dp.user_id = auth.uid()
  )
  OR is_admin()
);

-- Index for fast lookups
CREATE INDEX idx_pre_consultation_appointment ON public.pre_consultation_symptoms(appointment_id);
