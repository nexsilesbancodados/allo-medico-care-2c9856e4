
-- FIX: ophthalmology_exams technician_id type mismatch
DROP POLICY IF EXISTS "Authenticated can insert ophthalmology exams" ON public.ophthalmology_exams;
DROP POLICY IF EXISTS "Clinics and admins can insert ophthalmology exams" ON public.ophthalmology_exams;
CREATE POLICY "Clinics techs and admins can insert ophthalmology exams"
  ON public.ophthalmology_exams FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'clinic'))
    OR technician_id = auth.uid()
  );

-- Remove overly permissive wallet_transactions INSERT
DROP POLICY IF EXISTS "Service role can insert transactions" ON public.wallet_transactions;
