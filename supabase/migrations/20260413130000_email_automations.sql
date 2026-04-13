-- =====================================================================
-- EMAIL AUTOMATIONS: pg_cron jobs + DB triggers that invoke send-email
-- Project REF: oaixgmuocuwhsabidpei
-- =====================================================================

-- 1. Required extensions (pg_cron, pg_net) are already installed on this project.
-- Ensure they exist idempotently into their expected schemas.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    CREATE EXTENSION pg_cron;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_net') THEN
    CREATE EXTENSION pg_net;
  END IF;
END $$;

-- ---------------------------------------------------------------------
-- 2. Helper: shared anon-key & base URL (constants inside the helper)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.fn_trigger_edge_email(
  p_type TEXT,
  p_to   TEXT,
  p_data JSONB
) RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_url  TEXT := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/send-email';
  v_auth TEXT := 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc';
BEGIN
  IF p_to IS NULL OR p_to = '' THEN
    RETURN;
  END IF;
  PERFORM net.http_post(
    url     := v_url,
    headers := jsonb_build_object('Content-Type','application/json','Authorization', v_auth),
    body    := jsonb_build_object('type', p_type, 'to', p_to, 'data', COALESCE(p_data, '{}'::jsonb))
  );
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'fn_trigger_edge_email failed (non-blocking): %', SQLERRM;
END;
$$;

-- =====================================================================
-- 3. CRON JOBS
-- =====================================================================

-- Appointment reminders — every 5 minutes (canonical)
DO $$ BEGIN
  PERFORM cron.unschedule('appointment-reminders-every-5min');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'appointment-reminders-every-5min',
  '*/5 * * * *',
  $cron$
  SELECT net.http_post(
    url     := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/appointment-reminders',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc"}'::jsonb,
    body    := '{}'::jsonb
  );
  $cron$
);

-- Scheduled tasks — every 15 minutes
DO $$ BEGIN
  PERFORM cron.unschedule('scheduled-tasks-every-15min');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'scheduled-tasks-every-15min',
  '*/15 * * * *',
  $cron$
  SELECT net.http_post(
    url     := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/scheduled-tasks',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc"}'::jsonb,
    body    := '{}'::jsonb
  );
  $cron$
);

-- Cleanup orphan files — daily at 03:00 (only if the edge function is wired later;
-- the HTTP call simply 404s silently if the function doesn't exist yet).
DO $$ BEGIN
  PERFORM cron.unschedule('cleanup-orphan-files-daily');
EXCEPTION WHEN OTHERS THEN NULL; END $$;

SELECT cron.schedule(
  'cleanup-orphan-files-daily',
  '0 3 * * *',
  $cron$
  SELECT net.http_post(
    url     := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/cleanup-orphan-files',
    headers := '{"Content-Type":"application/json","Authorization":"Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc"}'::jsonb,
    body    := '{}'::jsonb
  );
  $cron$
);

-- =====================================================================
-- 4. DB TRIGGERS
-- =====================================================================

-- --- A. doctor_profiles insert (laudista / oftalmologia) --------------
CREATE OR REPLACE FUNCTION public.tg_welcome_doctor_by_type()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name  TEXT;
  v_type  TEXT;
BEGIN
  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  SELECT COALESCE(first_name || ' ' || last_name, '') INTO v_name
    FROM public.profiles WHERE user_id = NEW.user_id;

  IF NEW.doctor_type = 'laudista' THEN
    v_type := 'welcome_laudista';
  ELSIF NEW.doctor_type = 'oftalmologia' THEN
    v_type := 'welcome_ophthalmologist';
  ELSE
    RETURN NEW;
  END IF;

  PERFORM public.fn_trigger_edge_email(
    v_type, v_email,
    jsonb_build_object('name', v_name, 'crm', COALESCE(NEW.crm, ''))
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'tg_welcome_doctor_by_type failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_welcome_doctor_by_type ON public.doctor_profiles;
CREATE TRIGGER trg_welcome_doctor_by_type
AFTER INSERT ON public.doctor_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_welcome_doctor_by_type();

-- --- B. exam_requests.assigned_to NULL -> NOT NULL --------------------
CREATE OR REPLACE FUNCTION public.tg_exam_assigned_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_email   TEXT;
  v_name    TEXT;
BEGIN
  IF NEW.assigned_to IS NULL OR (TG_OP = 'UPDATE' AND OLD.assigned_to IS NOT NULL) THEN
    RETURN NEW;
  END IF;

  SELECT user_id INTO v_user_id FROM public.doctor_profiles WHERE id = NEW.assigned_to;
  IF v_user_id IS NULL THEN RETURN NEW; END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = v_user_id;
  SELECT COALESCE(first_name || ' ' || last_name, '') INTO v_name
    FROM public.profiles WHERE user_id = v_user_id;

  PERFORM public.fn_trigger_edge_email(
    'exam_assigned', v_email,
    jsonb_build_object(
      'name',          v_name,
      'exam_type',     COALESCE(NEW.exam_type, ''),
      'priority',      COALESCE(NEW.priority, 'normal'),
      'clinical_info', COALESCE(NEW.clinical_info, '')
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'tg_exam_assigned_email failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_exam_assigned_email ON public.exam_requests;
CREATE TRIGGER trg_exam_assigned_email
AFTER INSERT OR UPDATE OF assigned_to ON public.exam_requests
FOR EACH ROW EXECUTE FUNCTION public.tg_exam_assigned_email();

-- --- C. exam_reports inserted -> notify requesting clinic -------------
CREATE OR REPLACE FUNCTION public.tg_clinic_exam_report_ready()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_clinic_id    UUID;
  v_clinic_uid   UUID;
  v_email        TEXT;
  v_clinic_name  TEXT;
  v_exam_type    TEXT;
  v_reporter_uid UUID;
  v_reporter_nm  TEXT;
BEGIN
  SELECT er.requesting_clinic_id, er.exam_type
    INTO v_clinic_id, v_exam_type
    FROM public.exam_requests er
   WHERE er.id = NEW.exam_request_id;

  IF v_clinic_id IS NULL THEN RETURN NEW; END IF;

  SELECT cp.user_id, cp.name
    INTO v_clinic_uid, v_clinic_name
    FROM public.clinic_profiles cp
   WHERE cp.id = v_clinic_id;

  IF v_clinic_uid IS NULL THEN RETURN NEW; END IF;
  SELECT email INTO v_email FROM auth.users WHERE id = v_clinic_uid;

  SELECT dp.user_id INTO v_reporter_uid FROM public.doctor_profiles dp WHERE dp.id = NEW.reporter_id;
  IF v_reporter_uid IS NOT NULL THEN
    SELECT 'Dr(a). ' || COALESCE(first_name || ' ' || last_name, '') INTO v_reporter_nm
      FROM public.profiles WHERE user_id = v_reporter_uid;
  END IF;

  PERFORM public.fn_trigger_edge_email(
    'clinic_exam_report_ready', v_email,
    jsonb_build_object(
      'name',          COALESCE(v_clinic_name, 'Clínica'),
      'exam_type',     COALESCE(v_exam_type, ''),
      'reporter_name', COALESCE(v_reporter_nm, '')
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'tg_clinic_exam_report_ready failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_clinic_exam_report_ready ON public.exam_reports;
CREATE TRIGGER trg_clinic_exam_report_ready
AFTER INSERT ON public.exam_reports
FOR EACH ROW EXECUTE FUNCTION public.tg_clinic_exam_report_ready();

-- --- D. KYC status change on doctor_profiles -> approved/rejected ----
CREATE OR REPLACE FUNCTION public.tg_kyc_status_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_email TEXT;
  v_name  TEXT;
  v_type  TEXT;
BEGIN
  IF NEW.kyc_status IS NOT DISTINCT FROM OLD.kyc_status THEN
    RETURN NEW;
  END IF;

  IF NEW.kyc_status IN ('approved', 'verified') THEN
    v_type := 'kyc_approved';
  ELSIF NEW.kyc_status IN ('rejected', 'failed') THEN
    v_type := 'kyc_rejected';
  ELSE
    RETURN NEW;
  END IF;

  SELECT email INTO v_email FROM auth.users WHERE id = NEW.user_id;
  SELECT COALESCE(first_name || ' ' || last_name, '') INTO v_name
    FROM public.profiles WHERE user_id = NEW.user_id;

  PERFORM public.fn_trigger_edge_email(
    v_type, v_email,
    jsonb_build_object(
      'name',   v_name,
      'reason', COALESCE(NEW.rejection_reason, '')
    )
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'tg_kyc_status_email failed: %', SQLERRM;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_kyc_status_email ON public.doctor_profiles;
CREATE TRIGGER trg_kyc_status_email
AFTER UPDATE OF kyc_status ON public.doctor_profiles
FOR EACH ROW EXECUTE FUNCTION public.tg_kyc_status_email();

-- --- E. newsletter_subscribers welcome (if table exists) -------------
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'newsletter_subscribers') THEN
    CREATE OR REPLACE FUNCTION public.tg_newsletter_welcome()
    RETURNS TRIGGER
    LANGUAGE plpgsql
    SECURITY DEFINER
    SET search_path = public
    AS $body$
    BEGIN
      PERFORM public.fn_trigger_edge_email(
        'newsletter_welcome', NEW.email,
        jsonb_build_object('email', NEW.email)
      );
      RETURN NEW;
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'tg_newsletter_welcome failed: %', SQLERRM;
      RETURN NEW;
    END;
    $body$;

    DROP TRIGGER IF EXISTS trg_newsletter_welcome ON public.newsletter_subscribers;
    CREATE TRIGGER trg_newsletter_welcome
    AFTER INSERT ON public.newsletter_subscribers
    FOR EACH ROW EXECUTE FUNCTION public.tg_newsletter_welcome();
  END IF;
END $$;
