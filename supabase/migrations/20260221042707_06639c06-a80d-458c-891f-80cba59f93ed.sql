
-- Add crm_verified column to doctor_profiles
ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS crm_verified boolean NOT NULL DEFAULT false;

-- Add crm_verified_at timestamp
ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS crm_verified_at timestamp with time zone DEFAULT NULL;

-- Add crm_verified_by (admin who verified)
ALTER TABLE public.doctor_profiles 
ADD COLUMN IF NOT EXISTS crm_verified_by uuid DEFAULT NULL;
