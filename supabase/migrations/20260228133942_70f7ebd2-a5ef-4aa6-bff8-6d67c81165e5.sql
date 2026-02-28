
-- Add price_at_booking to appointments (issue #13)
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS price_at_booking numeric DEFAULT NULL;

-- Create cron-like function to expire subscriptions and discount cards (issues #6, #19)
CREATE OR REPLACE FUNCTION public.expire_subscriptions_and_cards()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Expire subscriptions
  UPDATE subscriptions 
  SET status = 'expired', updated_at = now()
  WHERE status = 'active' AND expires_at IS NOT NULL AND expires_at < now();

  -- Expire discount cards
  UPDATE discount_cards 
  SET status = 'expired'
  WHERE status = 'active' AND valid_until IS NOT NULL AND valid_until < now();
END;
$$;

-- Create function to auto-mark no-shows (issue #10)
CREATE OR REPLACE FUNCTION public.mark_no_shows()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE appointments
  SET status = 'no_show', updated_at = now()
  WHERE status = 'scheduled'
    AND scheduled_at < (now() - interval '30 minutes');
END;
$$;

-- Create function to notify waitlist when appointment cancelled (issue #11)
CREATE OR REPLACE FUNCTION public.notify_waitlist_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT 
      w.patient_id,
      '🔔 Vaga disponível!',
      'Uma vaga abriu com o médico que você estava aguardando para ' || to_char(w.desired_date, 'DD/MM/YYYY'),
      'waitlist',
      '/dashboard/schedule/' || NEW.doctor_id
    FROM appointment_waitlist w
    WHERE w.doctor_id = NEW.doctor_id
      AND w.desired_date = DATE(NEW.scheduled_at)
      AND w.notified = false;

    UPDATE appointment_waitlist
    SET notified = true
    WHERE doctor_id = NEW.doctor_id
      AND desired_date = DATE(NEW.scheduled_at)
      AND notified = false;
  END IF;
  RETURN NEW;
END;
$$;

-- Create trigger for waitlist notification
DROP TRIGGER IF EXISTS trg_notify_waitlist_on_cancel ON appointments;
CREATE TRIGGER trg_notify_waitlist_on_cancel
  AFTER UPDATE ON appointments
  FOR EACH ROW
  EXECUTE FUNCTION notify_waitlist_on_cancel();
