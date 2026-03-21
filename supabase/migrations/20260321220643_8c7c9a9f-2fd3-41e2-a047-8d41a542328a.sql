-- Fix security definer view: doctor_profiles_public
-- Recreate as SECURITY INVOKER (default, respects caller's RLS)
DROP VIEW IF EXISTS public.doctor_profiles_public;
CREATE VIEW public.doctor_profiles_public AS
SELECT id, user_id, crm, crm_state, crm_verified, bio, consultation_price,
       rating, total_reviews, experience_years, education, is_approved,
       available_now, available_now_since, created_at, updated_at
FROM public.doctor_profiles
WHERE is_approved = true;

-- Grant select to public (anon + authenticated)
GRANT SELECT ON public.doctor_profiles_public TO anon, authenticated;

-- Fix wallet_balances view if it's also security definer
DROP VIEW IF EXISTS public.wallet_balances;
CREATE VIEW public.wallet_balances AS
SELECT user_id,
  COALESCE(sum(CASE WHEN type IN ('credit','refund') THEN amount ELSE 0 END), 0) AS total_earned,
  COALESCE(sum(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) AS total_withdrawn,
  COALESCE(sum(CASE WHEN type IN ('credit','refund') THEN amount ELSE -amount END), 0) AS available_balance,
  count(*) FILTER (WHERE type = 'credit') AS total_transactions
FROM public.wallet_transactions
GROUP BY user_id;

GRANT SELECT ON public.wallet_balances TO authenticated;