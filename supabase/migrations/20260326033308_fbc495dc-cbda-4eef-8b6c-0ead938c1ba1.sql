
-- =====================================================
-- COMPREHENSIVE SECURITY HARDENING: REVOKE anon WRITE
-- =====================================================

-- Step 1: Revoke ALL write permissions from anon on ALL tables
REVOKE INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public FROM anon;

-- Step 2: Enable RLS + FORCE on every actual TABLE (skip views)
DO $$
DECLARE
  tbl RECORD;
BEGIN
  FOR tbl IN
    SELECT tablename FROM pg_tables WHERE schemaname = 'public'
  LOOP
    EXECUTE format('ALTER TABLE public.%I ENABLE ROW LEVEL SECURITY', tbl.tablename);
    EXECUTE format('ALTER TABLE public.%I FORCE ROW LEVEL SECURITY', tbl.tablename);
  END LOOP;
END;
$$;

-- Step 3: Re-grant SELECT to anon ONLY on public-read tables/views
GRANT SELECT ON public.health_tips TO anon;
GRANT SELECT ON public.plans TO anon;
GRANT SELECT ON public.specialties TO anon;
GRANT SELECT ON public.doctor_profiles TO anon;
GRANT SELECT ON public.document_verifications TO anon;
GRANT SELECT ON public.clinic_profiles TO anon;
GRANT SELECT ON public.availability_slots TO anon;
GRANT SELECT ON public.doctor_specialties TO anon;
GRANT SELECT ON public.optical_frames TO anon;
GRANT SELECT ON public.optical_lens_types TO anon;
GRANT SELECT ON public.appointments TO anon;
GRANT SELECT ON public.doctor_profiles_public TO anon;
GRANT SELECT ON public.wallet_balances TO anon; -- view, anon gets nothing due to underlying RLS

-- Step 4: Re-grant INSERT to anon ONLY on legitimate public-insert tables
GRANT INSERT ON public.guest_patients TO anon;
GRANT INSERT ON public.appointments TO anon;
GRANT INSERT ON public.b2b_leads TO anon;
GRANT INSERT ON public.doctor_applications TO anon;
GRANT INSERT ON public.newsletter_subscribers TO anon;

-- Step 5: Lock down user_roles (CRITICAL - prevents privilege escalation)
DROP POLICY IF EXISTS "user_roles_public_insert" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_public_update" ON public.user_roles;
DROP POLICY IF EXISTS "user_roles_public_delete" ON public.user_roles;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Users can read own roles') THEN
    CREATE POLICY "Users can read own roles" ON public.user_roles FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_roles' AND policyname = 'Admins manage all roles') THEN
    CREATE POLICY "Admins manage all roles" ON public.user_roles FOR ALL TO authenticated USING (is_admin()) WITH CHECK (is_admin());
  END IF;
END;
$$;

-- Step 6: Lock down wallet_transactions
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'wallet_transactions' AND policyname = 'Users view own transactions') THEN
    CREATE POLICY "Users view own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
  END IF;
END;
$$;

-- Step 7: Immutable audit logs - no UPDATE/DELETE
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'No updates on audit logs') THEN
    CREATE POLICY "No updates on audit logs" ON public.activity_logs FOR UPDATE TO authenticated USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'activity_logs' AND policyname = 'No deletes on audit logs') THEN
    CREATE POLICY "No deletes on audit logs" ON public.activity_logs FOR DELETE TO authenticated USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clinical_evolution_audit' AND policyname = 'No updates on clinical audit') THEN
    CREATE POLICY "No updates on clinical audit" ON public.clinical_evolution_audit FOR UPDATE TO authenticated USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'clinical_evolution_audit' AND policyname = 'No deletes on clinical audit') THEN
    CREATE POLICY "No deletes on clinical audit" ON public.clinical_evolution_audit FOR DELETE TO authenticated USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medical_record_access_logs' AND policyname = 'No updates on access logs') THEN
    CREATE POLICY "No updates on access logs" ON public.medical_record_access_logs FOR UPDATE TO authenticated USING (false);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'medical_record_access_logs' AND policyname = 'No deletes on access logs') THEN
    CREATE POLICY "No deletes on access logs" ON public.medical_record_access_logs FOR DELETE TO authenticated USING (false);
  END IF;
END;
$$;

-- Step 8: Missing policies for tables without any
DO $$
BEGIN
  -- user_presence
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_presence' AND policyname = 'Users manage own presence') THEN
    CREATE POLICY "Users manage own presence" ON public.user_presence FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_presence' AND policyname = 'Authenticated view presence') THEN
    CREATE POLICY "Authenticated view presence" ON public.user_presence FOR SELECT TO authenticated USING (true);
  END IF;

  -- user_consents
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_consents' AND policyname = 'Users manage own consents') THEN
    CREATE POLICY "Users manage own consents" ON public.user_consents FOR ALL TO authenticated USING (user_id = auth.uid() OR is_admin()) WITH CHECK (user_id = auth.uid());
  END IF;

  -- user_credits
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_credits' AND policyname = 'Users view own credits') THEN
    CREATE POLICY "Users view own credits" ON public.user_credits FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
  END IF;

  -- video_presence_logs
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'video_presence_logs' AND policyname = 'Users manage own video logs') THEN
    CREATE POLICY "Users manage own video logs" ON public.video_presence_logs FOR ALL TO authenticated USING (user_id = auth.uid() OR is_admin()) WITH CHECK (user_id = auth.uid());
  END IF;

  -- withdrawal_requests
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'withdrawal_requests' AND policyname = 'Users view own withdrawals') THEN
    CREATE POLICY "Users view own withdrawals" ON public.withdrawal_requests FOR SELECT TO authenticated USING (user_id = auth.uid() OR is_admin());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'withdrawal_requests' AND policyname = 'Users create own withdrawals') THEN
    CREATE POLICY "Users create own withdrawals" ON public.withdrawal_requests FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'withdrawal_requests' AND policyname = 'Admin manages withdrawals') THEN
    CREATE POLICY "Admin manages withdrawals" ON public.withdrawal_requests FOR UPDATE TO authenticated USING (is_admin());
  END IF;

  -- app_settings - no DELETE
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'app_settings' AND policyname = 'Admin deletes app_settings') THEN
    CREATE POLICY "Admin deletes app_settings" ON public.app_settings FOR DELETE TO authenticated USING (is_admin());
  END IF;
END;
$$;

-- Step 9: Revoke wallet_balances anon SELECT (it's a view showing financial data)
REVOKE SELECT ON public.wallet_balances FROM anon;
