
-- =============================================
-- 1. TABELA DE REEMBOLSOS (item #4 - cancelamento médico)
-- =============================================
CREATE TABLE IF NOT EXISTS public.refunds (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  appointment_id uuid NOT NULL REFERENCES public.appointments(id),
  patient_id uuid NOT NULL,
  amount numeric NOT NULL,
  reason text NOT NULL DEFAULT 'doctor_cancelled',
  payment_id text, -- ID do pagamento no Asaas
  refund_external_id text, -- ID do reembolso no Asaas
  status text NOT NULL DEFAULT 'pending', -- pending, processing, completed, failed
  requested_by uuid,
  processed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.refunds ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own refunds" ON public.refunds
  FOR SELECT USING (patient_id = auth.uid() OR public.is_admin());

CREATE POLICY "Admins manage refunds" ON public.refunds
  FOR ALL USING (public.is_admin()) WITH CHECK (public.is_admin());

CREATE POLICY "System can insert refunds" ON public.refunds
  FOR INSERT WITH CHECK (
    public.is_admin() OR 
    EXISTS (SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid())
  );

CREATE TRIGGER update_refunds_updated_at
  BEFORE UPDATE ON public.refunds
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 2. VALIDAÇÃO MÍNIMA DE SAQUE (item #8)
-- =============================================
ALTER TABLE public.withdrawal_requests 
  ADD COLUMN IF NOT EXISTS min_amount_validated boolean DEFAULT true;

-- Trigger para validar valor mínimo de saque (R$50)
CREATE OR REPLACE FUNCTION public.fn_validate_withdrawal_min()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount < 50 THEN
    RAISE EXCEPTION 'Valor mínimo de saque é R$50,00';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_validate_withdrawal_min ON public.withdrawal_requests;
CREATE TRIGGER trg_validate_withdrawal_min
  BEFORE INSERT ON public.withdrawal_requests
  FOR EACH ROW EXECUTE FUNCTION public.fn_validate_withdrawal_min();

-- =============================================
-- 3. TRIGGER: Reembolso automático quando médico cancela (item #4)
-- =============================================
CREATE OR REPLACE FUNCTION public.fn_auto_refund_doctor_cancel()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled'
     AND NEW.cancelled_by IS NOT NULL
     AND EXISTS (SELECT 1 FROM doctor_profiles WHERE user_id = NEW.cancelled_by)
     AND OLD.payment_status IN ('approved', 'confirmed', 'received')
  THEN
    INSERT INTO public.refunds (appointment_id, patient_id, amount, reason, requested_by, payment_id)
    VALUES (
      NEW.id,
      NEW.patient_id,
      COALESCE(NEW.price_at_booking, 89),
      'doctor_cancelled',
      NEW.cancelled_by,
      NEW.payment_status
    );

    INSERT INTO public.notifications (user_id, title, message, type, link)
    VALUES (
      NEW.patient_id,
      '💰 Reembolso em processamento',
      'O médico cancelou sua consulta. Seu reembolso integral está sendo processado.',
      'payment',
      '/dashboard/payments'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_refund_doctor_cancel ON public.appointments;
CREATE TRIGGER trg_auto_refund_doctor_cancel
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.fn_auto_refund_doctor_cancel();

-- =============================================
-- 4. NOTIFICAÇÃO ao médico SOMENTE após pagamento confirmado (item #3)
-- =============================================
CREATE OR REPLACE FUNCTION public.fn_notify_doctor_payment_confirmed()
RETURNS TRIGGER AS $$
DECLARE
  v_doctor_user_id uuid;
  v_patient_name text;
BEGIN
  IF NEW.payment_status IN ('approved', 'confirmed', 'received')
     AND OLD.payment_status NOT IN ('approved', 'confirmed', 'received')
  THEN
    SELECT dp.user_id INTO v_doctor_user_id
    FROM doctor_profiles dp WHERE dp.id = NEW.doctor_id;

    SELECT CONCAT(p.first_name, ' ', p.last_name) INTO v_patient_name
    FROM profiles p WHERE p.user_id = NEW.patient_id;

    IF v_doctor_user_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        v_doctor_user_id,
        '✅ Nova consulta confirmada',
        CONCAT('Pagamento de ', COALESCE(v_patient_name, 'paciente'), ' confirmado para ', to_char(NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM às HH24:MI')),
        'appointment',
        '/dashboard/appointments'
      );
    END IF;

    -- Notificar paciente também
    IF NEW.patient_id IS NOT NULL THEN
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        NEW.patient_id,
        '✅ Pagamento confirmado!',
        CONCAT('Sua consulta em ', to_char(NEW.scheduled_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM às HH24:MI'), ' está confirmada.'),
        'payment',
        '/dashboard/appointments'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_notify_doctor_payment_confirmed ON public.appointments;
CREATE TRIGGER trg_notify_doctor_payment_confirmed
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.fn_notify_doctor_payment_confirmed();

-- =============================================
-- 5. Adicionar campo pix_key obrigatório ao doctor_profiles (item #8)
-- =============================================
ALTER TABLE public.doctor_profiles
  ADD COLUMN IF NOT EXISTS pix_key text,
  ADD COLUMN IF NOT EXISTS pix_key_type text; -- cpf, cnpj, email, phone, random

-- =============================================
-- 6. ÍNDICES de performance faltantes
-- =============================================
CREATE INDEX IF NOT EXISTS idx_appointments_payment_status ON public.appointments(payment_status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_status ON public.appointments(scheduled_at, status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_expires_status ON public.subscriptions(expires_at, status);
CREATE INDEX IF NOT EXISTS idx_discount_cards_expires_status ON public.discount_cards(valid_until, status);
CREATE INDEX IF NOT EXISTS idx_refunds_appointment ON public.refunds(appointment_id);
CREATE INDEX IF NOT EXISTS idx_refunds_patient ON public.refunds(patient_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_requests_user ON public.withdrawal_requests(user_id);
