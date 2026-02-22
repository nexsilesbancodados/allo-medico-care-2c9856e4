
-- The previous migration partially succeeded (affiliate_profiles created).
-- Just add the missing withdrawal policies that don't exist yet.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own withdrawals' AND tablename = 'withdrawal_requests') THEN
    CREATE POLICY "Users can view own withdrawals" ON public.withdrawal_requests FOR SELECT USING (user_id = auth.uid() OR is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can update withdrawals' AND tablename = 'withdrawal_requests') THEN
    CREATE POLICY "Admins can update withdrawals" ON public.withdrawal_requests FOR UPDATE USING (is_admin());
  END IF;
END $$;
