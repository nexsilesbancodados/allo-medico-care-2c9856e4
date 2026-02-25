
-- ====================================================
-- 1. REFERRAL COMMISSION AUTOMATION
-- Auto-mark referral as converted when referred user subscribes
-- ====================================================
CREATE OR REPLACE FUNCTION public.auto_convert_referral()
RETURNS TRIGGER AS $$
BEGIN
  -- When a new subscription is created, check if the user was referred
  UPDATE public.referrals
  SET status = 'converted',
      converted_at = now(),
      referred_user_id = NEW.user_id
  WHERE referral_code = (
    SELECT referral_code FROM public.referrals
    WHERE referred_user_id = NEW.user_id
    AND status = 'pending'
    LIMIT 1
  )
  AND status = 'pending';

  -- Also check via profiles.referred_by
  UPDATE public.referrals
  SET status = 'converted',
      converted_at = now(),
      referred_user_id = NEW.user_id,
      commission_paid = false
  WHERE referral_code IN (
    SELECT r.referral_code FROM public.referrals r
    JOIN public.profiles p ON p.referred_by = r.referral_code
    WHERE p.user_id = NEW.user_id
    AND r.status = 'pending'
  )
  AND status = 'pending';

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_convert_referral ON public.subscriptions;
CREATE TRIGGER trg_auto_convert_referral
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_convert_referral();

-- ====================================================
-- 2. MEDICAL RECORD ACCESS LOGGING (CFM compliance)
-- ====================================================
CREATE TABLE IF NOT EXISTS public.medical_record_access_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  record_id UUID REFERENCES public.medical_records(id) ON DELETE SET NULL,
  patient_id UUID NOT NULL,
  accessed_by UUID NOT NULL,
  access_type TEXT NOT NULL DEFAULT 'view',
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.medical_record_access_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all access logs"
  ON public.medical_record_access_logs FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Doctors can view logs for their patients"
  ON public.medical_record_access_logs FOR SELECT
  USING (accessed_by = auth.uid());

CREATE POLICY "Users can insert access logs"
  ON public.medical_record_access_logs FOR INSERT
  WITH CHECK (accessed_by = auth.uid());

CREATE INDEX idx_med_access_patient ON public.medical_record_access_logs(patient_id);
CREATE INDEX idx_med_access_by ON public.medical_record_access_logs(accessed_by);
CREATE INDEX idx_med_access_created ON public.medical_record_access_logs(created_at);

-- ====================================================
-- 3. TERMS RE-CONSENT: app_settings table for current version
-- ====================================================
CREATE TABLE IF NOT EXISTS public.app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read app_settings"
  ON public.app_settings FOR SELECT
  USING (true);

CREATE POLICY "Only admins can update app_settings"
  ON public.app_settings FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Only admins can insert app_settings"
  ON public.app_settings FOR INSERT
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
  );

INSERT INTO public.app_settings (key, value) VALUES ('terms_version', '1.0.0')
ON CONFLICT (key) DO NOTHING;

-- ====================================================
-- 4. POST-CONSULTATION SURVEY AUTO-TRIGGER
-- When appointment status changes to 'completed', create notification
-- ====================================================
CREATE OR REPLACE FUNCTION public.auto_trigger_post_consultation_survey()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS NULL OR OLD.status <> 'completed') THEN
    -- Send in-app notification to patient
    IF NEW.patient_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.patient_id,
        '⭐ Avalie sua consulta',
        'Como foi sua experiência? Sua avaliação nos ajuda a melhorar!',
        'survey',
        '/dashboard/rate/' || NEW.id || '?role=patient'
      );
    END IF;

    -- Fire edge function for email/whatsapp survey
    PERFORM net.http_post(
      url := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/post-consultation-survey',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc'
      ),
      body := jsonb_build_object('appointment_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_post_consultation_survey ON public.appointments;
CREATE TRIGGER trg_post_consultation_survey
  AFTER UPDATE ON public.appointments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_trigger_post_consultation_survey();
