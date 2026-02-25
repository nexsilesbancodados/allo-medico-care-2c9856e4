
-- ====================================================
-- AUTO-GENERATE REFERRAL CODE ON PROFILE CREATION
-- ====================================================

CREATE OR REPLACE FUNCTION public.fn_auto_referral_code()
RETURNS TRIGGER AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  IF NEW.referral_code IS NULL THEN
    LOOP
      new_code := upper(substr(md5(random()::text || NEW.user_id::text), 1, 6));
      SELECT EXISTS(SELECT 1 FROM public.profiles WHERE referral_code = new_code) INTO code_exists;
      EXIT WHEN NOT code_exists;
    END LOOP;
    NEW.referral_code := new_code;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_referral_code ON public.profiles;
CREATE TRIGGER trg_auto_referral_code
  BEFORE INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_referral_code();

-- Backfill existing profiles without referral codes
UPDATE public.profiles
SET referral_code = upper(substr(md5(random()::text || user_id::text), 1, 6))
WHERE referral_code IS NULL;

-- ====================================================
-- AUTO SET return_deadline ON COMPLETED APPOINTMENTS
-- 30-day return window after consultation completion
-- ====================================================

CREATE OR REPLACE FUNCTION public.fn_set_return_deadline()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.return_deadline IS NULL THEN
    NEW.return_deadline := now() + interval '30 days';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_set_return_deadline ON public.appointments;
CREATE TRIGGER trg_set_return_deadline
  BEFORE UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_set_return_deadline();

-- ====================================================
-- APPOINTMENT CONFIRMED → NOTIFICATION TRIGGER
-- Notifies patient + doctor when appointment is confirmed
-- ====================================================

CREATE OR REPLACE FUNCTION public.fn_appointment_confirmed_notification()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    -- Notify patient
    IF NEW.patient_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.patient_id,
        'Consulta confirmada!',
        'Sua consulta foi confirmada. Prepare-se para o atendimento.',
        'appointment',
        '/dashboard/appointments'
      );
    END IF;
    
    -- Notify doctor
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT dp.user_id, 'Nova consulta confirmada', 
           'Uma consulta foi confirmada para ' || to_char(NEW.scheduled_at, 'DD/MM às HH24:MI'),
           'appointment', '/dashboard/appointments'
    FROM public.doctor_profiles dp WHERE dp.id = NEW.doctor_id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_appointment_confirmed_notification ON public.appointments;
CREATE TRIGGER trg_appointment_confirmed_notification
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_appointment_confirmed_notification();

-- ====================================================
-- AUTO-POSITION ON-DEMAND QUEUE ENTRIES
-- ====================================================

CREATE OR REPLACE FUNCTION public.fn_auto_queue_position()
RETURNS TRIGGER AS $$
DECLARE
  max_pos INTEGER;
BEGIN
  IF NEW.position IS NULL THEN
    SELECT COALESCE(MAX(position), 0) + 1 INTO max_pos
    FROM public.on_demand_queue
    WHERE status = 'waiting';
    NEW.position := max_pos;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_queue_position ON public.on_demand_queue;
CREATE TRIGGER trg_auto_queue_position
  BEFORE INSERT ON public.on_demand_queue
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_queue_position();
