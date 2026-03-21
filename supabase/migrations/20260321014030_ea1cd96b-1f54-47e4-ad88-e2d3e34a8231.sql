
-- 1. WALLET TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'withdrawal', 'refund')),
  amount NUMERIC(10,2) NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  reference_type TEXT,
  reference_id UUID,
  balance_after NUMERIC(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wallet_transactions' AND policyname='Users can view own transactions') THEN
    CREATE POLICY "Users can view own transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wallet_transactions' AND policyname='System can insert transactions') THEN
    CREATE POLICY "System can insert transactions" ON public.wallet_transactions FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='wallet_transactions' AND policyname='Admin can view all transactions') THEN
    CREATE POLICY "Admin can view all transactions" ON public.wallet_transactions FOR SELECT TO authenticated USING (public.is_admin());
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON public.wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_ref ON public.wallet_transactions(reference_type, reference_id);

-- 2. Add missing columns to withdrawal_requests if needed
ALTER TABLE public.withdrawal_requests ADD COLUMN IF NOT EXISTS pix_key_type TEXT DEFAULT 'cpf';
ALTER TABLE public.withdrawal_requests ADD COLUMN IF NOT EXISTS admin_notes TEXT;
ALTER TABLE public.withdrawal_requests ADD COLUMN IF NOT EXISTS processed_at TIMESTAMPTZ;
ALTER TABLE public.withdrawal_requests ADD COLUMN IF NOT EXISTS processed_by UUID;

-- 3. WALLET BALANCES VIEW
CREATE OR REPLACE VIEW public.wallet_balances AS
SELECT 
  user_id,
  COALESCE(SUM(CASE WHEN type IN ('credit', 'refund') THEN amount ELSE 0 END), 0) as total_earned,
  COALESCE(SUM(CASE WHEN type = 'withdrawal' THEN amount ELSE 0 END), 0) as total_withdrawn,
  COALESCE(SUM(CASE WHEN type IN ('credit', 'refund') THEN amount ELSE -amount END), 0) as available_balance,
  COUNT(*) FILTER (WHERE type = 'credit') as total_transactions
FROM public.wallet_transactions
GROUP BY user_id;

-- 4. Credit doctor on consultation completion
CREATE OR REPLACE FUNCTION public.fn_credit_doctor_on_completion()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_doctor_user_id UUID; v_price NUMERIC; v_doctor_percent NUMERIC; v_doctor_amount NUMERIC; v_current_balance NUMERIC;
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' AND NEW.payment_status IN ('approved', 'confirmed', 'received') THEN
    SELECT dp.user_id INTO v_doctor_user_id FROM doctor_profiles dp WHERE dp.id = NEW.doctor_id;
    IF v_doctor_user_id IS NULL THEN RETURN NEW; END IF;
    IF EXISTS (SELECT 1 FROM wallet_transactions WHERE reference_type = 'appointment' AND reference_id = NEW.id AND type = 'credit') THEN RETURN NEW; END IF;
    v_price := COALESCE(NEW.price_at_booking, 89);
    SELECT COALESCE(ca.commission_percent, 50) INTO v_doctor_percent FROM clinic_affiliations ca WHERE ca.doctor_id = NEW.doctor_id AND ca.status = 'active' LIMIT 1;
    IF v_doctor_percent IS NULL THEN v_doctor_percent := 50; END IF;
    v_doctor_amount := ROUND(v_price * (v_doctor_percent / 100), 2);
    SELECT COALESCE(SUM(CASE WHEN type IN ('credit', 'refund') THEN amount ELSE -amount END), 0) INTO v_current_balance FROM wallet_transactions WHERE user_id = v_doctor_user_id;
    INSERT INTO wallet_transactions (user_id, type, amount, description, reference_type, reference_id, balance_after)
    VALUES (v_doctor_user_id, 'credit', v_doctor_amount, 'Consulta concluída — ' || v_doctor_percent || '% de R$' || v_price, 'appointment', NEW.id, v_current_balance + v_doctor_amount);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_doctor_on_completion ON public.appointments;
CREATE TRIGGER trg_credit_doctor_on_completion AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.fn_credit_doctor_on_completion();

-- 5. Credit laudista on exam report signing
CREATE OR REPLACE FUNCTION public.fn_credit_laudista_on_sign()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_laudista_user_id UUID; v_exam_price NUMERIC := 80; v_laudista_amount NUMERIC; v_current_balance NUMERIC;
BEGIN
  IF NEW.signed_at IS NOT NULL AND OLD.signed_at IS NULL THEN
    SELECT dp.user_id INTO v_laudista_user_id FROM doctor_profiles dp WHERE dp.id = NEW.reporter_id;
    IF v_laudista_user_id IS NULL THEN RETURN NEW; END IF;
    IF EXISTS (SELECT 1 FROM wallet_transactions WHERE reference_type = 'exam_report' AND reference_id = NEW.id AND type = 'credit') THEN RETURN NEW; END IF;
    v_laudista_amount := ROUND(v_exam_price * 0.50, 2);
    SELECT COALESCE(SUM(CASE WHEN type IN ('credit', 'refund') THEN amount ELSE -amount END), 0) INTO v_current_balance FROM wallet_transactions WHERE user_id = v_laudista_user_id;
    INSERT INTO wallet_transactions (user_id, type, amount, description, reference_type, reference_id, balance_after)
    VALUES (v_laudista_user_id, 'credit', v_laudista_amount, 'Laudo assinado — 50% de R$' || v_exam_price, 'exam_report', NEW.id, v_current_balance + v_laudista_amount);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_laudista_on_sign ON public.exam_reports;
CREATE TRIGGER trg_credit_laudista_on_sign AFTER UPDATE ON public.exam_reports FOR EACH ROW EXECUTE FUNCTION public.fn_credit_laudista_on_sign();

-- 6. Debit wallet on withdrawal approval
CREATE OR REPLACE FUNCTION public.fn_debit_on_withdrawal_approved()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_current_balance NUMERIC;
BEGIN
  IF NEW.status = 'approved' AND OLD.status != 'approved' THEN
    SELECT COALESCE(SUM(CASE WHEN type IN ('credit', 'refund') THEN amount ELSE -amount END), 0) INTO v_current_balance FROM wallet_transactions WHERE user_id = NEW.user_id;
    IF v_current_balance < NEW.amount THEN RAISE EXCEPTION 'Saldo insuficiente para saque'; END IF;
    INSERT INTO wallet_transactions (user_id, type, amount, description, reference_type, reference_id, balance_after)
    VALUES (NEW.user_id, 'withdrawal', NEW.amount, 'Saque aprovado — PIX: ' || NEW.pix_key, 'withdrawal', NEW.id, v_current_balance - NEW.amount);
    NEW.processed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_debit_on_withdrawal_approved ON public.withdrawal_requests;
CREATE TRIGGER trg_debit_on_withdrawal_approved BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.fn_debit_on_withdrawal_approved();

-- 7. Validate withdrawal on insert
CREATE OR REPLACE FUNCTION public.fn_validate_withdrawal()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE v_balance NUMERIC;
BEGIN
  IF NEW.amount < 50 THEN RAISE EXCEPTION 'Valor mínimo de saque é R$ 50,00'; END IF;
  SELECT COALESCE(SUM(CASE WHEN type IN ('credit', 'refund') THEN amount ELSE -amount END), 0) INTO v_balance FROM wallet_transactions WHERE user_id = NEW.user_id;
  IF v_balance < NEW.amount THEN RAISE EXCEPTION 'Saldo insuficiente. Disponível: R$ %', ROUND(v_balance, 2); END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validate_withdrawal ON public.withdrawal_requests;
CREATE TRIGGER trg_validate_withdrawal BEFORE INSERT ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.fn_validate_withdrawal();

-- 8. Credit doctor on delayed payment confirmation
CREATE OR REPLACE FUNCTION public.fn_credit_doctor_on_payment_confirmed()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public'
AS $$
DECLARE
  v_doctor_user_id UUID; v_price NUMERIC; v_doctor_percent NUMERIC; v_doctor_amount NUMERIC; v_current_balance NUMERIC;
BEGIN
  IF NEW.payment_status IN ('approved', 'confirmed', 'received') AND OLD.payment_status NOT IN ('approved', 'confirmed', 'received') AND NEW.status = 'completed' THEN
    SELECT dp.user_id INTO v_doctor_user_id FROM doctor_profiles dp WHERE dp.id = NEW.doctor_id;
    IF v_doctor_user_id IS NULL THEN RETURN NEW; END IF;
    IF EXISTS (SELECT 1 FROM wallet_transactions WHERE reference_type = 'appointment' AND reference_id = NEW.id AND type = 'credit') THEN RETURN NEW; END IF;
    v_price := COALESCE(NEW.price_at_booking, 89);
    SELECT COALESCE(ca.commission_percent, 50) INTO v_doctor_percent FROM clinic_affiliations ca WHERE ca.doctor_id = NEW.doctor_id AND ca.status = 'active' LIMIT 1;
    IF v_doctor_percent IS NULL THEN v_doctor_percent := 50; END IF;
    v_doctor_amount := ROUND(v_price * (v_doctor_percent / 100), 2);
    SELECT COALESCE(SUM(CASE WHEN type IN ('credit', 'refund') THEN amount ELSE -amount END), 0) INTO v_current_balance FROM wallet_transactions WHERE user_id = v_doctor_user_id;
    INSERT INTO wallet_transactions (user_id, type, amount, description, reference_type, reference_id, balance_after)
    VALUES (v_doctor_user_id, 'credit', v_doctor_amount, 'Pagamento confirmado — ' || v_doctor_percent || '% de R$' || v_price, 'appointment', NEW.id, v_current_balance + v_doctor_amount);
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_credit_doctor_on_payment_confirmed ON public.appointments;
CREATE TRIGGER trg_credit_doctor_on_payment_confirmed AFTER UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.fn_credit_doctor_on_payment_confirmed();

-- 9. Auto-update updated_at
DROP TRIGGER IF EXISTS trg_withdrawal_requests_updated_at ON public.withdrawal_requests;
CREATE TRIGGER trg_withdrawal_requests_updated_at BEFORE UPDATE ON public.withdrawal_requests FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
