
-- 1. Waitlist table for "Me Avise" feature
CREATE TABLE public.appointment_waitlist (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  doctor_id UUID NOT NULL REFERENCES public.doctor_profiles(id),
  desired_date DATE NOT NULL,
  desired_time TEXT,
  notified BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.appointment_waitlist ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own waitlist" ON public.appointment_waitlist
  FOR ALL USING (patient_id = auth.uid()) WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Admins manage waitlist" ON public.appointment_waitlist
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 2. Health tips table for educational waiting room
CREATE TABLE public.health_tips (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  icon TEXT DEFAULT '💡',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.health_tips ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active tips" ON public.health_tips
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins manage tips" ON public.health_tips
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

-- 3. Insert starter health tips
INSERT INTO public.health_tips (title, content, category, icon) VALUES
  ('Hidratação', 'Beber pelo menos 2 litros de água por dia ajuda no funcionamento dos rins e na saúde da pele.', 'general', '💧'),
  ('Sono Reparador', 'Adultos devem dormir entre 7 e 9 horas por noite. O sono é essencial para a recuperação do corpo.', 'general', '😴'),
  ('Atividade Física', 'Apenas 30 minutos de caminhada por dia já reduz o risco de doenças cardiovasculares em até 30%.', 'exercise', '🏃'),
  ('Alimentação Saudável', 'Inclua frutas, verduras e legumes em todas as refeições. Prefira alimentos naturais.', 'nutrition', '🥗'),
  ('Saúde Mental', 'Reserve momentos do dia para relaxar. Meditação e respiração profunda ajudam a reduzir o estresse.', 'mental', '🧘'),
  ('Check-up Anual', 'Realize exames de rotina pelo menos uma vez ao ano, mesmo que você se sinta bem.', 'prevention', '🩺'),
  ('Pressão Arterial', 'A hipertensão é silenciosa. Meça sua pressão regularmente, especialmente após os 40 anos.', 'prevention', '❤️'),
  ('Proteção Solar', 'Use protetor solar FPS 30+ diariamente, mesmo em dias nublados. A pele tem memória!', 'dermatology', '☀️'),
  ('Postura Correta', 'Ao trabalhar no computador, mantenha a tela na altura dos olhos e faça pausas a cada 50 minutos.', 'ergonomics', '🪑'),
  ('Lavagem das Mãos', 'Lavar as mãos corretamente por 20 segundos previne até 80% das doenças infecciosas.', 'hygiene', '🧼');

-- 4. Trigger to notify waitlist when appointment is cancelled
CREATE OR REPLACE FUNCTION public.notify_waitlist_on_cancel()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.status = 'cancelled' AND OLD.status IS DISTINCT FROM 'cancelled' THEN
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT w.patient_id,
           '🔔 Vaga Disponível!',
           'Um horário com seu médico ficou disponível em ' || to_char(NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY "às" HH24:MI') || '. Corra para agendar!',
           'waitlist',
           '/dashboard/schedule/' || NEW.doctor_id::text
    FROM public.appointment_waitlist w
    WHERE w.doctor_id = NEW.doctor_id
      AND w.desired_date = (NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::date
      AND w.notified = false;

    UPDATE public.appointment_waitlist
    SET notified = true
    WHERE doctor_id = NEW.doctor_id
      AND desired_date = (NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo')::date
      AND notified = false;
  END IF;
  RETURN NEW;
END;
$function$;

CREATE TRIGGER trigger_notify_waitlist_on_cancel
AFTER UPDATE ON public.appointments
FOR EACH ROW
EXECUTE FUNCTION public.notify_waitlist_on_cancel();
