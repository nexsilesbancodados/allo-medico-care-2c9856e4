
-- Revoke ALL from anon on ALL tables, then re-grant only what's needed
REVOKE ALL ON ALL TABLES IN SCHEMA public FROM anon;

-- Public SELECT tables (institutional/public data)
GRANT SELECT ON public.health_tips TO anon;
GRANT SELECT ON public.plans TO anon;
GRANT SELECT ON public.specialties TO anon;
GRANT SELECT ON public.doctor_profiles TO anon;
GRANT SELECT ON public.doctor_profiles_public TO anon;
GRANT SELECT ON public.document_verifications TO anon;
GRANT SELECT ON public.clinic_profiles TO anon;
GRANT SELECT ON public.availability_slots TO anon;
GRANT SELECT ON public.doctor_specialties TO anon;
GRANT SELECT ON public.optical_frames TO anon;
GRANT SELECT ON public.optical_lens_types TO anon;
GRANT SELECT ON public.appointments TO anon;

-- Public INSERT (guest flows, lead capture)
GRANT INSERT ON public.guest_patients TO anon;
GRANT INSERT ON public.appointments TO anon;
GRANT INSERT ON public.b2b_leads TO anon;
GRANT INSERT ON public.doctor_applications TO anon;
GRANT INSERT ON public.newsletter_subscribers TO anon;
