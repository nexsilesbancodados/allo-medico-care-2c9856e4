
-- Fix rate_limits: restringir INSERT e corrigir WITH CHECK (true)
DROP POLICY IF EXISTS "Authenticated can insert rate limits" ON public.rate_limits;
CREATE POLICY "System insert rate limits"
  ON public.rate_limits FOR INSERT TO authenticated
  WITH CHECK (identifier IS NOT NULL AND endpoint IS NOT NULL);
