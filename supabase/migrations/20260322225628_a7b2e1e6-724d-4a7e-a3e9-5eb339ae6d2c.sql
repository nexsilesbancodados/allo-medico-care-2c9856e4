
-- Fix wallet_balances to use SECURITY INVOKER (the default, safer option)
-- The view already filters by auth.uid() so this is safe
ALTER VIEW public.wallet_balances SET (security_invoker = true);
