
-- =============================================================
-- 1. AUTO-EXPIRE COUPONS past their expiration date
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_auto_expire_coupons()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  UPDATE coupons
  SET is_active = false
  WHERE is_active = true
    AND expires_at IS NOT NULL
    AND expires_at < now();
    
  -- Also deactivate coupons that hit max_uses
  UPDATE coupons
  SET is_active = false
  WHERE is_active = true
    AND max_uses IS NOT NULL
    AND times_used >= max_uses;
END;
$$;

-- =============================================================
-- 2. CLEANUP OLD READ NOTIFICATIONS (30+ days)
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_cleanup_old_notifications()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM notifications
  WHERE is_read = true
    AND created_at < now() - interval '30 days';
END;
$$;

-- =============================================================
-- 3. AUTO-CLEANUP PAST WAITLIST ENTRIES
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_cleanup_past_waitlist()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM appointment_waitlist
  WHERE desired_date < CURRENT_DATE - interval '1 day';
END;
$$;

-- =============================================================
-- 4. FOLLOW-UP REMINDER near return_deadline (5 days before)
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_notify_return_deadline()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  appt RECORD;
BEGIN
  FOR appt IN
    SELECT a.id, a.patient_id, a.return_deadline, a.doctor_id,
           p.first_name as patient_name
    FROM appointments a
    JOIN profiles p ON p.user_id = a.patient_id
    WHERE a.status = 'completed'
      AND a.return_deadline IS NOT NULL
      AND a.return_deadline BETWEEN now() AND now() + interval '5 days'
      AND a.patient_id IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = a.patient_id
          AND n.title = 'Retorno se aproximando'
          AND n.created_at > now() - interval '5 days'
      )
      AND NOT EXISTS (
        SELECT 1 FROM appointments a2
        WHERE a2.patient_id = a.patient_id
          AND a2.doctor_id = a.doctor_id
          AND a2.status IN ('scheduled', 'confirmed')
          AND a2.scheduled_at > now()
      )
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      appt.patient_id,
      'Retorno se aproximando',
      'Olá ' || COALESCE(appt.patient_name, '') || '! Seu prazo de retorno vence em ' ||
        to_char(appt.return_deadline AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY') ||
        '. Agende seu retorno! 🩺',
      'appointment',
      '/dashboard/book?doctor=' || appt.doctor_id
    );
  END LOOP;
END;
$$;

-- =============================================================
-- 5. AUTO TURN OFF available_now AT MIDNIGHT
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_reset_available_now_midnight()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  UPDATE doctor_profiles
  SET available_now = false, available_now_since = null
  WHERE available_now = true;
END;
$$;

-- =============================================================
-- SCHEDULE ALL NEW CRON JOBS
-- =============================================================
SELECT cron.schedule('auto-expire-coupons', '0 */6 * * *', 'SELECT public.fn_auto_expire_coupons()');
SELECT cron.schedule('cleanup-old-notifications', '0 3 * * 0', 'SELECT public.fn_cleanup_old_notifications()');
SELECT cron.schedule('cleanup-past-waitlist', '0 2 * * *', 'SELECT public.fn_cleanup_past_waitlist()');
SELECT cron.schedule('notify-return-deadline', '0 9 * * *', 'SELECT public.fn_notify_return_deadline()');
SELECT cron.schedule('reset-available-midnight', '0 3 * * *', 'SELECT public.fn_reset_available_now_midnight()');
