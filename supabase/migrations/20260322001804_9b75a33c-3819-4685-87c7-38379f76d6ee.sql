-- 1. Create 'reports' storage bucket for PDF uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('reports', 'reports', false)
ON CONFLICT (id) DO NOTHING;

-- 2. Storage policies for reports bucket
CREATE POLICY "Authenticated users can upload reports"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'reports');

CREATE POLICY "Authenticated users can read reports"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'reports');

CREATE POLICY "Report owners can update"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'reports');

-- 3. Fix wallet_transactions INSERT policy to allow trigger (SECURITY DEFINER functions)
-- The trigger fn_credit_laudista_on_sign is SECURITY DEFINER so it bypasses RLS.
-- But let's ensure the policy is correct for service role inserts too.
CREATE POLICY "Service role can insert transactions"
ON public.wallet_transactions FOR INSERT
TO service_role
WITH CHECK (true);

-- 4. Re-run the credit for already-signed reports that were missed
-- This inserts credit transactions for signed exam_reports that don't have corresponding wallet entries
DO $$
DECLARE
  rec RECORD;
  v_laudista_user_id UUID;
  v_exam_price NUMERIC := 80;
  v_laudista_amount NUMERIC;
  v_current_balance NUMERIC;
BEGIN
  FOR rec IN
    SELECT er.id, er.reporter_id, er.signed_at
    FROM exam_reports er
    WHERE er.signed_at IS NOT NULL
      AND NOT EXISTS (
        SELECT 1 FROM wallet_transactions wt
        WHERE wt.reference_type = 'exam_report'
          AND wt.reference_id = er.id
          AND wt.type = 'credit'
      )
  LOOP
    SELECT dp.user_id INTO v_laudista_user_id
    FROM doctor_profiles dp WHERE dp.id = rec.reporter_id;
    
    IF v_laudista_user_id IS NOT NULL THEN
      v_laudista_amount := ROUND(v_exam_price * 0.50, 2);
      
      SELECT COALESCE(SUM(CASE WHEN type IN ('credit', 'refund') THEN amount ELSE -amount END), 0)
      INTO v_current_balance
      FROM wallet_transactions WHERE user_id = v_laudista_user_id;
      
      INSERT INTO wallet_transactions (user_id, type, amount, description, reference_type, reference_id, balance_after)
      VALUES (
        v_laudista_user_id, 'credit', v_laudista_amount,
        'Laudo assinado — 50% de R$' || v_exam_price,
        'exam_report', rec.id,
        v_current_balance + v_laudista_amount
      );
      
      v_current_balance := v_current_balance + v_laudista_amount;
    END IF;
  END LOOP;
END $$;