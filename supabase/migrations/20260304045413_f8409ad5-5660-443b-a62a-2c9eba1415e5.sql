
-- 1. Fix doctor_profiles: split public role into anon/authenticated
DROP POLICY IF EXISTS "Public can view approved doctor basics" ON public.doctor_profiles;

CREATE POLICY "Anon can view approved doctors"
ON public.doctor_profiles FOR SELECT
TO anon
USING (is_approved = true);

CREATE POLICY "Authenticated can view doctors"
ON public.doctor_profiles FOR SELECT
TO authenticated
USING (
  (is_approved = true) OR (user_id = auth.uid()) OR is_admin()
);

-- 2. Fix document_verifications: recreate with explicit roles
DROP POLICY IF EXISTS "Authenticated can verify documents" ON public.document_verifications;
DROP POLICY IF EXISTS "Public can verify documents by code" ON public.document_verifications;

CREATE POLICY "Authenticated can view verifications"
ON public.document_verifications FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Anon verify by code"
ON public.document_verifications FOR SELECT
TO anon
USING (true);
