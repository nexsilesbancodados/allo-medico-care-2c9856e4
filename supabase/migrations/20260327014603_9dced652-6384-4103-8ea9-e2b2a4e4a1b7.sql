ALTER TABLE public.specialties
  ADD COLUMN IF NOT EXISTS price_min numeric DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS price_max numeric DEFAULT NULL;