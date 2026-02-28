
-- Drop the problematic trigger that uses extensions.http_post (function doesn't exist)
-- WhatsApp notifications are already handled by the asaas-webhook edge function
DROP TRIGGER IF EXISTS trg_whatsapp_on_confirmed ON public.appointments;

-- Update the function to use net.http_post instead of extensions.http_post
CREATE OR REPLACE FUNCTION public.notify_whatsapp_on_confirmed()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  patient_phone text;
  patient_name text;
  scheduled_date text;
  jitsi text;
  msg text;
BEGIN
  -- Only fire when status changes TO 'confirmed'
  IF (TG_OP = 'UPDATE' AND NEW.status = 'confirmed' AND OLD.status IS DISTINCT FROM 'confirmed') 
     OR (TG_OP = 'INSERT' AND NEW.status = 'confirmed') THEN
    
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

      PERFORM net.http_post(
        url := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/send-whatsapp',
        headers := jsonb_build_object(
          'Content-Type', 'application/json',
          'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc'
        ),
        body := jsonb_build_object('phone', patient_phone, 'message', msg)
      );
    END IF;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Recreate trigger
CREATE TRIGGER trg_whatsapp_on_confirmed
AFTER INSERT OR UPDATE OF status ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION notify_whatsapp_on_confirmed();
