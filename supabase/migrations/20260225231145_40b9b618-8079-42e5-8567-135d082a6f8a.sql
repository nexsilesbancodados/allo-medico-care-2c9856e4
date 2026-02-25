
-- =============================================
-- 1. Auto-cancel unpaid appointments after 30min
-- =============================================
CREATE OR REPLACE FUNCTION public.fn_auto_cancel_unpaid()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE appointments
  SET status = 'cancelled',
      cancel_reason = 'Pagamento não confirmado em 30 minutos',
      updated_at = now()
  WHERE status = 'scheduled'
    AND payment_status = 'pending'
    AND created_at < now() - interval '30 minutes'
    AND payment_confirmed_at IS NULL;
END;
$$;

-- Schedule via pg_cron every 5 minutes
SELECT cron.schedule(
  'auto-cancel-unpaid',
  '*/5 * * * *',
  $$SELECT public.fn_auto_cancel_unpaid()$$
);

-- =============================================
-- 2. Auto-complete consultations after 2 hours
-- =============================================
CREATE OR REPLACE FUNCTION public.fn_auto_complete_stale_consultations()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE appointments
  SET status = 'completed',
      updated_at = now()
  WHERE status = 'in_progress'
    AND scheduled_at < now() - interval '2 hours';
END;
$$;

SELECT cron.schedule(
  'auto-complete-stale',
  '*/15 * * * *',
  $$SELECT public.fn_auto_complete_stale_consultations()$$
);

-- =============================================
-- 3. Auto-deactivate expired discount cards
-- =============================================
CREATE OR REPLACE FUNCTION public.fn_expire_discount_cards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE discount_cards
  SET status = 'expired'
  WHERE status = 'active'
    AND valid_until IS NOT NULL
    AND valid_until < now();
END;
$$;

SELECT cron.schedule(
  'expire-discount-cards',
  '0 */6 * * *',
  $$SELECT public.fn_expire_discount_cards()$$
);

-- =============================================
-- 4. Auto-close resolved support tickets after 48h
-- =============================================
CREATE OR REPLACE FUNCTION public.fn_auto_close_resolved_tickets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE support_tickets
  SET status = 'closed',
      closed_at = now(),
      updated_at = now()
  WHERE status = 'resolved'
    AND updated_at < now() - interval '48 hours';
END;
$$;

SELECT cron.schedule(
  'auto-close-resolved-tickets',
  '0 */4 * * *',
  $$SELECT public.fn_auto_close_resolved_tickets()$$
);

-- =============================================
-- 5. Trigger: auto-expire invite codes after 7 days
-- =============================================
CREATE OR REPLACE FUNCTION public.fn_expire_invite_codes()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE doctor_invite_codes
  SET is_used = true
  WHERE is_used = false
    AND expires_at IS NOT NULL
    AND expires_at < now();
END;
$$;

SELECT cron.schedule(
  'expire-invite-codes',
  '0 0 * * *',
  $$SELECT public.fn_expire_invite_codes()$$
);

-- =============================================
-- 6. Trigger: notify doctor when exam is assigned
-- =============================================
CREATE OR REPLACE FUNCTION public.fn_notify_exam_assigned()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.assigned_to IS NOT NULL AND (OLD.assigned_to IS NULL OR OLD.assigned_to <> NEW.assigned_to) THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT dp.user_id,
           'Novo exame atribuído',
           'Um exame de ' || NEW.exam_type || ' foi atribuído para você laudar.',
           'exam',
           '/dashboard/laudista/queue'
    FROM doctor_profiles dp
    WHERE dp.id = NEW.assigned_to;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_exam_assigned ON exam_requests;
CREATE TRIGGER trg_notify_exam_assigned
  AFTER UPDATE ON exam_requests
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_exam_assigned();
