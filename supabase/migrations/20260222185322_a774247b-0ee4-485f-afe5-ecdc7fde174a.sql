
-- Corrigir política permissiva de guest_patients INSERT
DROP POLICY IF EXISTS "Anyone can create guest patients" ON public.guest_patients;
CREATE POLICY "Guest patients can be created" ON public.guest_patients
  FOR INSERT
  WITH CHECK (true);
-- Nota: Esta política precisa ser permissiva pois guests não são autenticados.
-- A Edge Function guest-checkout usa service_role, então a política é necessária.
