
-- FIX wallet_balances: Drop and recreate with auth.uid() filter
DROP VIEW IF EXISTS public.wallet_balances;

CREATE VIEW public.wallet_balances AS
SELECT user_id,
    COALESCE(sum(CASE WHEN type = ANY (ARRAY['credit','refund']) THEN amount ELSE 0 END), 0) AS total_earned,
    COALESCE(sum(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) AS total_withdrawn,
    COALESCE(sum(CASE WHEN type = ANY (ARRAY['credit','refund']) THEN amount ELSE -amount END), 0) AS available_balance,
    count(*) FILTER (WHERE type = 'credit') AS total_transactions
FROM wallet_transactions
WHERE user_id = auth.uid()
GROUP BY user_id;

-- Add is_admin() helper
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin') $$;

-- Rate limits index
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON public.rate_limits (identifier, endpoint, window_start);
