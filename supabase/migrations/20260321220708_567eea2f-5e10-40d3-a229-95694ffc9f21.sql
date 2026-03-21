-- Explicitly set SECURITY INVOKER on views (Postgres 15+)
ALTER VIEW public.doctor_profiles_public SET (security_invoker = on);
ALTER VIEW public.wallet_balances SET (security_invoker = on);