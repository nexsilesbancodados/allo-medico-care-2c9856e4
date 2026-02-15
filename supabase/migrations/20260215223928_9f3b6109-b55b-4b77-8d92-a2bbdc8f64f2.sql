
-- Table for guest patients (consulta avulsa without registration)
CREATE TABLE public.guest_patients (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  cpf TEXT NOT NULL,
  date_of_birth DATE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add access_token to appointments for guest access
ALTER TABLE public.appointments 
  ADD COLUMN access_token TEXT UNIQUE,
  ADD COLUMN guest_patient_id UUID REFERENCES public.guest_patients(id),
  ALTER COLUMN patient_id DROP NOT NULL;

-- Enable RLS on guest_patients
ALTER TABLE public.guest_patients ENABLE ROW LEVEL SECURITY;

-- Public insert (no auth needed for guest checkout)
CREATE POLICY "Anyone can create guest patients"
  ON public.guest_patients FOR INSERT
  WITH CHECK (true);

-- Only admins/doctors can view guest patients
CREATE POLICY "Admins and doctors can view guest patients"
  ON public.guest_patients FOR SELECT
  USING (is_admin() OR EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'doctor'
  ));

-- Allow unauthenticated appointment creation for guest consultations
CREATE POLICY "Guest can create appointments"
  ON public.appointments FOR INSERT
  WITH CHECK (guest_patient_id IS NOT NULL AND access_token IS NOT NULL);

-- Allow viewing appointment by access_token (for guest access page)
CREATE POLICY "Anyone can view by access_token"
  ON public.appointments FOR SELECT
  USING (access_token IS NOT NULL AND access_token = current_setting('request.headers', true)::json->>'x-access-token');
