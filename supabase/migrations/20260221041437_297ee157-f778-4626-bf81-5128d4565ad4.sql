
-- 1. Add jitsi_link column to appointments
ALTER TABLE public.appointments 
ADD COLUMN IF NOT EXISTS jitsi_link text;

-- 2. Enable pg_net for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- 3. Function to auto-generate jitsi_link on insert
CREATE OR REPLACE FUNCTION public.generate_jitsi_link()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = 'public'
AS $$
BEGIN
  IF NEW.jitsi_link IS NULL THEN
    NEW.jitsi_link := 'https://meet.jit.si/allo-medico-' || NEW.id::text;
  END IF;
  -- Also set video_room_url if empty
  IF NEW.video_room_url IS NULL THEN
    NEW.video_room_url := NEW.jitsi_link;
  END IF;
  RETURN NEW;
END;
$$;

-- 4. Trigger to auto-generate jitsi link before insert
CREATE TRIGGER trg_generate_jitsi_link
BEFORE INSERT ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.generate_jitsi_link();

-- 5. Function to send WhatsApp when status changes to 'confirmed'
CREATE OR REPLACE FUNCTION public.notify_whatsapp_on_confirmed()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  patient_phone text;
  patient_name text;
  scheduled_date text;
  jitsi text;
  msg text;
  edge_url text;
  service_key text;
BEGIN
  -- Only fire when status changes TO 'confirmed'
  IF (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed') 
     OR (TG_OP = 'INSERT' AND NEW.status = 'confirmed') THEN
    
    -- Get patient phone
    IF NEW.patient_id IS NOT NULL THEN
      SELECT p.phone, p.first_name INTO patient_phone, patient_name
      FROM profiles p WHERE p.user_id = NEW.patient_id;
    ELSIF NEW.guest_patient_id IS NOT NULL THEN
      SELECT gp.phone, gp.full_name INTO patient_phone, patient_name
      FROM guest_patients gp WHERE gp.id = NEW.guest_patient_id;
    END IF;

    IF patient_phone IS NOT NULL AND patient_phone <> '' THEN
      jitsi := COALESCE(NEW.jitsi_link, 'https://meet.jit.si/allo-medico-' || NEW.id::text);
      scheduled_date := to_char(NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI');
      
      msg := '🩺 *Allo Médico* - Consulta Confirmada!' || chr(10) || chr(10) ||
             'Olá, ' || COALESCE(patient_name, '') || '!' || chr(10) ||
             'Sua consulta foi agendada para *' || scheduled_date || '*.' || chr(10) || chr(10) ||
             '📹 Link de acesso:' || chr(10) || jitsi || chr(10) || chr(10) ||
             'Acesse o link no horário marcado. Até lá! 💚';

      edge_url := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/send-whatsapp';
      service_key := current_setting('app.settings.service_role_key', true);
      
      -- Use pg_net to call edge function async
      PERFORM extensions.http_post(
        url := edge_url,
        body := json_build_object('phone', patient_phone, 'message', msg)::text,
        headers := json_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer ' || COALESCE(service_key, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc')
        )::text
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- 6. Trigger on appointments for confirmed status
CREATE TRIGGER trg_whatsapp_on_confirmed
AFTER INSERT OR UPDATE OF status ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_whatsapp_on_confirmed();

-- 7. Backfill jitsi_link for existing appointments
UPDATE public.appointments 
SET jitsi_link = 'https://meet.jit.si/allo-medico-' || id::text
WHERE jitsi_link IS NULL;
