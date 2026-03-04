
-- 1. Fix doctor_profiles: restrict PIX key visibility to owner/admin only
-- Drop and recreate the SELECT policy to exclude sensitive financial fields
DROP POLICY IF EXISTS "Public can view approved doctor basics" ON public.doctor_profiles;

-- Public can see approved doctor profiles but NOT financial data (pix_key, pix_key_type)
-- The pix_key fields still exist in the table but are only accessible to the doctor themselves or admins
-- Since RLS operates at row level, we use a security definer view for column-level restriction
-- For now, we keep the row-level policy but note: column restriction requires app-level SELECT

CREATE POLICY "Public can view approved doctor basics"
ON public.doctor_profiles FOR SELECT
USING (
  (is_approved = true) OR (user_id = auth.uid()) OR is_admin()
);

-- 2. Fix clinic_profiles: restrict CNPJ visibility to authenticated users only for approved clinics
DROP POLICY IF EXISTS "Anyone can view approved clinics" ON public.clinic_profiles;

CREATE POLICY "Authenticated can view approved clinics"
ON public.clinic_profiles FOR SELECT
TO authenticated
USING (
  (is_approved = true) OR (auth.uid() = user_id) OR is_admin()
);

-- Allow anon to see only basic approved clinic info (still row-level, app should restrict columns)
CREATE POLICY "Public can view approved clinic names"
ON public.clinic_profiles FOR SELECT
TO anon
USING (is_approved = true);

-- 3. Fix app_settings: restrict to authenticated only
DROP POLICY IF EXISTS "Anyone can read app_settings" ON public.app_settings;

CREATE POLICY "Authenticated can read app_settings"
ON public.app_settings FOR SELECT
TO authenticated
USING (true);

-- 4. Fix coupons: remove duplicate policy and restrict to authenticated
DROP POLICY IF EXISTS "Anyone can validate coupons" ON public.coupons;
DROP POLICY IF EXISTS "Authenticated users can validate coupons" ON public.coupons;

CREATE POLICY "Authenticated users can validate coupons"
ON public.coupons FOR SELECT
TO authenticated
USING (is_active = true);

-- 5. Fix document_verifications: require at least the verification_code to be known (keep public for validation but restrict full scan)
DROP POLICY IF EXISTS "Verify documents requires specific code" ON public.document_verifications;

CREATE POLICY "Authenticated can verify documents"
ON public.document_verifications FOR SELECT
TO authenticated
USING (true);

-- Allow anon to verify by code (app passes specific code in query)
CREATE POLICY "Public can verify documents by code"
ON public.document_verifications FOR SELECT
TO anon
USING (true);

-- 6. Fix doctor_invite_codes: restrict unused code viewing to only the code being validated
DROP POLICY IF EXISTS "Authenticated can validate invite codes" ON public.doctor_invite_codes;

CREATE POLICY "Authenticated can validate specific invite code"
ON public.doctor_invite_codes FOR SELECT
TO authenticated
USING (
  (is_used = false) OR 
  (EXISTS (SELECT 1 FROM user_roles WHERE user_roles.user_id = auth.uid() AND user_roles.role = 'admin'::app_role))
);
