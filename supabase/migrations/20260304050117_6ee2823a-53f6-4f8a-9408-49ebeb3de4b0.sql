
-- Fix: Change view to SECURITY INVOKER (default, safe)
DROP VIEW IF EXISTS public.doctor_profiles_public;

CREATE VIEW public.doctor_profiles_public
WITH (security_invoker = true) AS
SELECT id, user_id, crm, crm_state, crm_verified, bio, consultation_price, 
       rating, total_reviews, experience_years, education, is_approved, 
       available_now, available_now_since, created_at, updated_at
FROM public.doctor_profiles
WHERE is_approved = true;
