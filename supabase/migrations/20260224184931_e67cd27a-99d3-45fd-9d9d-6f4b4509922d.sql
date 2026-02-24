
-- 1. Fix rate_limits: add policies for service role usage (edge functions)
-- Rate limits are managed by edge functions using service_role, so we allow that
-- and let admins view them
CREATE POLICY "Service role manages rate limits"
ON public.rate_limits
FOR ALL
USING (true)
WITH CHECK (true);

-- Note: rate_limits is only accessed by edge functions with service_role key,
-- so the anon/authenticated users won't hit this table directly.
-- However, we restrict to admin for SELECT from authenticated users:
DROP POLICY IF EXISTS "Service role manages rate limits" ON public.rate_limits;

CREATE POLICY "Admins can view rate limits"
ON public.rate_limits
FOR SELECT
USING (is_admin());

CREATE POLICY "Admins can manage rate limits"
ON public.rate_limits
FOR ALL
USING (is_admin())
WITH CHECK (is_admin());

-- 2. Fix guest_patients INSERT policy - restrict to anon key with required fields
DROP POLICY IF EXISTS "Guest patients can be created" ON public.guest_patients;

CREATE POLICY "Guest patients can be created with valid data"
ON public.guest_patients
FOR INSERT
WITH CHECK (
  full_name IS NOT NULL 
  AND cpf IS NOT NULL 
  AND email IS NOT NULL 
  AND phone IS NOT NULL
);
