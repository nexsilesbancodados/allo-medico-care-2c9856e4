
-- Revoke ALL write permissions from anon on every public table
DO $$
DECLARE tbl RECORD;
BEGIN
  FOR tbl IN SELECT tablename FROM pg_tables WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon', tbl.tablename);
  END LOOP;
END;
$$;

-- Also revoke from views
DO $$
DECLARE v RECORD;
BEGIN
  FOR v IN SELECT viewname FROM pg_views WHERE schemaname = 'public' LOOP
    EXECUTE format('REVOKE INSERT, UPDATE, DELETE ON public.%I FROM anon', v.viewname);
  END LOOP;
END;
$$;

-- Re-grant only SELECT on public-facing tables for anon
GRANT SELECT ON public.health_tips TO anon;
GRANT SELECT ON public.plans TO anon;
GRANT SELECT ON public.specialties TO anon;
GRANT SELECT ON public.doctor_profiles_public TO anon;
GRANT SELECT ON public.document_verifications TO anon;
GRANT SELECT ON public.clinic_profiles TO anon;
GRANT SELECT ON public.optical_frames TO anon;
GRANT SELECT ON public.optical_lens_types TO anon;
GRANT SELECT ON public.doctor_specialties TO anon;

-- Re-grant INSERT only on lead/guest tables for anon
GRANT INSERT ON public.guest_patients TO anon;
GRANT INSERT ON public.b2b_leads TO anon;
GRANT INSERT ON public.doctor_applications TO anon;
GRANT INSERT ON public.newsletter_subscribers TO anon;

-- Drop any permissive UPDATE/DELETE policies for anon on flagged tables
DO $$
DECLARE
  pol RECORD;
  flagged_tables TEXT[] := ARRAY[
    'availability_slots','doctor_profiles','optical_frames','optical_lens_types',
    'appointments','health_tips','doctor_specialties',
    'plans','document_verifications','clinic_profiles','specialties'
  ];
  tname TEXT;
BEGIN
  FOREACH tname IN ARRAY flagged_tables LOOP
    FOR pol IN
      SELECT policyname FROM pg_policies
      WHERE tablename = tname AND schemaname = 'public'
        AND cmd IN ('UPDATE', 'DELETE')
        AND (roles @> ARRAY['anon']::name[] OR roles @> ARRAY['public']::name[])
    LOOP
      EXECUTE format('DROP POLICY IF EXISTS %I ON public.%I', pol.policyname, tname);
    END LOOP;
  END LOOP;
END;
$$;
