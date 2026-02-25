
-- ====================================================
-- WAITLIST NOTIFICATION TRIGGER
-- When an appointment is cancelled or rescheduled, 
-- notify waitlisted patients for that doctor/date
-- ====================================================

CREATE OR REPLACE FUNCTION public.fn_notify_waitlist()
RETURNS TRIGGER AS $$
DECLARE
  wl RECORD;
  cancelled_date TEXT;
BEGIN
  -- Only fire on cancellation
  IF NEW.status IN ('cancelled', 'no_show') AND OLD.status NOT IN ('cancelled', 'no_show') THEN
    cancelled_date := to_char(NEW.scheduled_at, 'YYYY-MM-DD');
    
    FOR wl IN
      SELECT id, patient_id
      FROM public.appointment_waitlist
      WHERE doctor_id = NEW.doctor_id
        AND desired_date = cancelled_date
        AND notified = false
      LIMIT 5
    LOOP
      -- Create notification for patient
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        wl.patient_id,
        'Vaga disponível!',
        'Uma vaga abriu para a data que você solicitou. Agende agora!',
        'waitlist',
        '/dashboard/book?doctor=' || NEW.doctor_id || '&date=' || cancelled_date
      );
      
      -- Mark as notified
      UPDATE public.appointment_waitlist SET notified = true WHERE id = wl.id;
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_waitlist ON public.appointments;
CREATE TRIGGER trg_notify_waitlist
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_notify_waitlist();

-- ====================================================
-- AUTO-ASSIGN ON-DEMAND QUEUE TO AVAILABLE DOCTOR
-- When a doctor marks available_now = true, assign 
-- first waiting patient from on_demand_queue
-- ====================================================

CREATE OR REPLACE FUNCTION public.fn_auto_assign_on_demand()
RETURNS TRIGGER AS $$
DECLARE
  queue_item RECORD;
BEGIN
  IF NEW.available_now = true AND (OLD.available_now IS DISTINCT FROM true) THEN
    SELECT * INTO queue_item
    FROM public.on_demand_queue
    WHERE status = 'waiting' AND assigned_doctor_id IS NULL
    ORDER BY position ASC, created_at ASC
    LIMIT 1;
    
    IF FOUND THEN
      UPDATE public.on_demand_queue
      SET assigned_doctor_id = NEW.id,
          assigned_at = now(),
          status = 'assigned'
      WHERE id = queue_item.id;
      
      -- Notify patient
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        queue_item.patient_id,
        'Médico disponível!',
        'Um médico está pronto para sua consulta. Entre agora!',
        'urgent',
        '/dashboard/consultation'
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_assign_on_demand ON public.doctor_profiles;
CREATE TRIGGER trg_auto_assign_on_demand
  AFTER UPDATE ON public.doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_assign_on_demand();

-- ====================================================
-- AUTO-EXPIRE AVAILABLE_NOW AFTER 4 HOURS
-- ====================================================

CREATE OR REPLACE FUNCTION public.fn_expire_available_now()
RETURNS void AS $$
BEGIN
  UPDATE public.doctor_profiles
  SET available_now = false, available_now_since = null
  WHERE available_now = true
    AND available_now_since < now() - interval '4 hours';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Schedule via pg_cron (every 15 min)
SELECT cron.schedule(
  'expire-available-now',
  '*/15 * * * *',
  $$SELECT public.fn_expire_available_now()$$
);
