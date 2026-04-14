DROP VIEW IF EXISTS public.doctor_profiles_public;
CREATE VIEW public.doctor_profiles_public AS
SELECT 
  dp.id,
  dp.user_id,
  dp.full_name,
  dp.display_name,
  dp.avatar_url,
  dp.crm,
  dp.crm_state,
  dp.crm_verified,
  dp.bio,
  dp.short_description,
  dp.consultation_price,
  dp.consultation_duration_min,
  dp.rating,
  dp.total_reviews,
  dp.experience_years,
  dp.education,
  dp.specialty_id,
  dp.sub_specialties,
  dp.languages,
  dp.available_now,
  dp.available_now_since,
  dp.available_for_telemedicine,
  dp.available_for_in_person,
  dp.is_approved,
  dp.created_at,
  dp.updated_at
FROM doctor_profiles dp
WHERE dp.is_approved = true AND dp.show_in_directory IS NOT FALSE;

GRANT SELECT ON public.doctor_profiles_public TO anon, authenticated;