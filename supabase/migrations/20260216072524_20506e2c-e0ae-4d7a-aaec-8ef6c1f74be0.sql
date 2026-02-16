
-- 1. Add health fields to profiles
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS allergies text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS blood_type text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS chronic_conditions text[] DEFAULT '{}';

-- 2. Add consultation_price to specialties
ALTER TABLE public.specialties
  ADD COLUMN IF NOT EXISTS consultation_price numeric DEFAULT NULL;

-- 3. Add payment_status to appointments for manual payment tracking
ALTER TABLE public.appointments
  ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS payment_confirmed_by uuid DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS payment_confirmed_at timestamp with time zone DEFAULT NULL;
