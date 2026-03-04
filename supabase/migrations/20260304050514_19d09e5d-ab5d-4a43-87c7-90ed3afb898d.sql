
-- 1. Create separate table for doctor financial data (PIX keys)
CREATE TABLE IF NOT EXISTS public.doctor_financial (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id uuid REFERENCES public.doctor_profiles(id) ON DELETE CASCADE NOT NULL UNIQUE,
  pix_key text,
  pix_key_type text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.doctor_financial ENABLE ROW LEVEL SECURITY;

-- Only the doctor themselves or admins can access financial data
CREATE POLICY "Doctor can view own financial" ON public.doctor_financial
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.id = doctor_financial.doctor_id AND dp.user_id = auth.uid())
  OR is_admin()
);

CREATE POLICY "Doctor can update own financial" ON public.doctor_financial
FOR UPDATE TO authenticated
USING (
  EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.id = doctor_financial.doctor_id AND dp.user_id = auth.uid())
  OR is_admin()
);

CREATE POLICY "Doctor can insert own financial" ON public.doctor_financial
FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (SELECT 1 FROM doctor_profiles dp WHERE dp.id = doctor_financial.doctor_id AND dp.user_id = auth.uid())
  OR is_admin()
);

-- Migrate existing PIX data
INSERT INTO public.doctor_financial (doctor_id, pix_key, pix_key_type)
SELECT id, pix_key, pix_key_type FROM public.doctor_profiles
WHERE pix_key IS NOT NULL
ON CONFLICT (doctor_id) DO UPDATE SET pix_key = EXCLUDED.pix_key, pix_key_type = EXCLUDED.pix_key_type;

-- 2. Remove completed from profiles doctor access
DROP POLICY IF EXISTS "Doctors can view patient profiles for active appointments" ON public.profiles;
CREATE POLICY "Doctors can view patient profiles for active appointments"
ON public.profiles FOR SELECT TO authenticated
USING (
  (auth.uid() = user_id) OR has_role(auth.uid(), 'admin'::app_role) 
  OR has_role(auth.uid(), 'support'::app_role) OR has_role(auth.uid(), 'receptionist'::app_role)
  OR (has_role(auth.uid(), 'doctor'::app_role) AND EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE dp.user_id = auth.uid() AND a.patient_id = profiles.user_id 
    AND a.status = 'in_progress'
  ))
);

DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT TO authenticated
USING (
  (user_id = auth.uid()) OR is_admin() OR EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE a.patient_id = profiles.user_id AND dp.user_id = auth.uid()
    AND a.status = 'in_progress'
  )
);

-- 3. Guest patients - in_progress only
DROP POLICY IF EXISTS "Doctors can view their own guest patients" ON public.guest_patients;
CREATE POLICY "Doctors can view their own guest patients"
ON public.guest_patients FOR SELECT TO authenticated
USING (
  is_admin() OR EXISTS (
    SELECT 1 FROM appointments a JOIN doctor_profiles dp ON dp.id = a.doctor_id
    WHERE a.guest_patient_id = guest_patients.id AND dp.user_id = auth.uid()
    AND a.status = 'in_progress'
  )
);

-- 4. Update doctor_profiles_public view to confirm no pix_key
DROP VIEW IF EXISTS public.doctor_profiles_public;
CREATE VIEW public.doctor_profiles_public
WITH (security_invoker = true) AS
SELECT id, user_id, crm, crm_state, crm_verified, bio, consultation_price, 
       rating, total_reviews, experience_years, education, is_approved, 
       available_now, available_now_since, created_at, updated_at
FROM public.doctor_profiles
WHERE is_approved = true;
