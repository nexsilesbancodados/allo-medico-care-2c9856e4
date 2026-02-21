
-- 1. Add return_deadline to appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS return_deadline timestamp with time zone DEFAULT NULL;
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS original_appointment_id uuid DEFAULT NULL;

-- 2. Favorite doctors table
CREATE TABLE public.favorite_doctors (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid NOT NULL,
  doctor_id uuid NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(patient_id, doctor_id)
);
ALTER TABLE public.favorite_doctors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own favorites" ON public.favorite_doctors FOR ALL
  USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());

-- 3. User credits table
CREATE TABLE public.user_credits (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  amount numeric NOT NULL DEFAULT 0,
  reason text NOT NULL,
  reference_id uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);
ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own credits" ON public.user_credits FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "System can insert credits" ON public.user_credits FOR INSERT
  WITH CHECK (user_id = auth.uid() OR is_admin());

-- 4. Video presence logs table
CREATE TABLE public.video_presence_logs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  user_role text NOT NULL DEFAULT 'patient',
  joined_at timestamp with time zone NOT NULL DEFAULT now(),
  left_at timestamp with time zone,
  duration_seconds integer
);
ALTER TABLE public.video_presence_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can view presence logs" ON public.video_presence_logs FOR SELECT
  USING (user_id = auth.uid() OR is_admin());
CREATE POLICY "Users can insert own presence" ON public.video_presence_logs FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "Users can update own presence" ON public.video_presence_logs FOR UPDATE
  USING (user_id = auth.uid());

-- 5. Referral codes on profiles  
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referral_code text UNIQUE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS referred_by text;

-- Generate referral codes for existing users
UPDATE public.profiles SET referral_code = LOWER(SUBSTRING(first_name FROM 1 FOR 4) || SUBSTRING(id::text FROM 1 FOR 6))
WHERE referral_code IS NULL AND first_name != '';
