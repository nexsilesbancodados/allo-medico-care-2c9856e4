
-- Table to store patient informed consent records (TCLE - CFM 2.314/2022)
CREATE TABLE public.patient_consents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  appointment_id UUID NOT NULL REFERENCES public.appointments(id),
  consent_type TEXT NOT NULL DEFAULT 'telemedicine_tcle',
  consent_text TEXT NOT NULL,
  ip_address TEXT,
  user_agent TEXT,
  accepted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  revoked_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.patient_consents ENABLE ROW LEVEL SECURITY;

-- Patients can insert their own consent
CREATE POLICY "Patients can create own consent"
ON public.patient_consents FOR INSERT
WITH CHECK (patient_id = auth.uid());

-- Patients and doctors of the appointment can view consent
CREATE POLICY "Parties can view consent"
ON public.patient_consents FOR SELECT
USING (
  patient_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM doctor_profiles dp
    JOIN appointments a ON a.doctor_id = dp.id
    WHERE a.id = patient_consents.appointment_id AND dp.user_id = auth.uid()
  )
  OR is_admin()
);

-- Index for quick lookup
CREATE INDEX idx_patient_consents_appointment ON public.patient_consents(appointment_id);
CREATE INDEX idx_patient_consents_patient ON public.patient_consents(patient_id);
