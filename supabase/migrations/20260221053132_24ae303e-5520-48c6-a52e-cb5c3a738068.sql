
-- 1. Create coupons table
CREATE TABLE public.coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_percentage numeric NOT NULL DEFAULT 0 CHECK (discount_percentage >= 0 AND discount_percentage <= 100),
  max_uses integer DEFAULT NULL,
  times_used integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  created_by uuid DEFAULT NULL
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can validate coupons" ON public.coupons
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage coupons" ON public.coupons
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 2. Create audit trigger on appointments status changes
CREATE OR REPLACE FUNCTION public.audit_appointment_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.activity_logs (action, entity_type, entity_id, user_id, details)
    VALUES (
      'appointment_status_change',
      'appointment',
      NEW.id,
      auth.uid(),
      jsonb_build_object(
        'old_status', OLD.status,
        'new_status', NEW.status,
        'doctor_id', NEW.doctor_id,
        'patient_id', NEW.patient_id,
        'scheduled_at', NEW.scheduled_at
      )
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_appointment_status
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_appointment_status();

-- Also log new appointments
CREATE OR REPLACE FUNCTION public.audit_appointment_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.activity_logs (action, entity_type, entity_id, user_id, details)
  VALUES (
    'appointment_created',
    'appointment',
    NEW.id,
    COALESCE(auth.uid(), NEW.patient_id),
    jsonb_build_object(
      'status', NEW.status,
      'doctor_id', NEW.doctor_id,
      'patient_id', NEW.patient_id,
      'scheduled_at', NEW.scheduled_at
    )
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_audit_appointment_created
  AFTER INSERT ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.audit_appointment_created();
