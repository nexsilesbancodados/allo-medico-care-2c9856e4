
-- =============================================
-- 1. Cron: Appointment reminders (1h before) via Edge Function
-- =============================================
SELECT cron.schedule(
  'appointment-reminders-hourly',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/appointment-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);

-- =============================================
-- 2. Cron: Cart abandonment recovery (every 30min)
-- =============================================
SELECT cron.schedule(
  'cart-abandonment-recovery',
  '*/30 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/cart-abandonment',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);

-- =============================================
-- 3. Cron: Post-consultation survey (2h after completion)
-- =============================================
SELECT cron.schedule(
  'post-consultation-survey',
  '*/20 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/post-consultation-survey',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc"}'::jsonb,
    body := concat('{"time": "', now(), '"}')::jsonb
  ) AS request_id;
  $$
);

-- =============================================
-- 4. Auto-expire on_demand_queue entries after 1h waiting
-- =============================================
CREATE OR REPLACE FUNCTION public.fn_expire_queue_entries()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE on_demand_queue
  SET status = 'expired'
  WHERE status = 'waiting'
    AND created_at < now() - interval '1 hour';
END;
$$;

SELECT cron.schedule(
  'expire-queue-entries',
  '*/10 * * * *',
  $$SELECT public.fn_expire_queue_entries()$$
);

-- =============================================
-- 5. Trigger: Auto-create notification on prescription created
-- =============================================
CREATE OR REPLACE FUNCTION public.fn_notify_prescription_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link)
  VALUES (
    NEW.patient_id,
    'Nova receita disponível',
    'Sua receita médica está pronta para visualização.',
    'prescription',
    '/dashboard/paciente/prescriptions'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_prescription_created ON prescriptions;
CREATE TRIGGER trg_notify_prescription_created
  AFTER INSERT ON prescriptions
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_prescription_created();

-- =============================================
-- 6. Trigger: Notify patient when exam report is signed
-- =============================================
CREATE OR REPLACE FUNCTION public.fn_notify_exam_report_signed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.signed_at IS NOT NULL AND OLD.signed_at IS NULL THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT er.patient_id,
           'Laudo pronto',
           'O laudo do seu exame de ' || er.exam_type || ' está disponível.',
           'exam',
           '/dashboard/paciente/health'
    FROM exam_requests er
    WHERE er.id = NEW.exam_request_id
      AND er.patient_id IS NOT NULL;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_exam_report_signed ON exam_reports;
CREATE TRIGGER trg_notify_exam_report_signed
  AFTER UPDATE ON exam_reports
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_exam_report_signed();
