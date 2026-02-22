
-- Recriar triggers essenciais que existem como funções mas não estão ativos

-- 1. Trigger para criar perfil e role ao signup
CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. Trigger para atribuir admin ao email específico
CREATE OR REPLACE TRIGGER on_auth_assign_admin
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.assign_admin_on_signup();

-- 3. Trigger para gerar link Jitsi ao criar agendamento
CREATE OR REPLACE TRIGGER on_appointment_generate_jitsi
  BEFORE INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.generate_jitsi_link();

-- 4. Trigger para auditar criação de agendamento
CREATE OR REPLACE TRIGGER on_appointment_created_audit
  AFTER INSERT ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.audit_appointment_created();

-- 5. Trigger para auditar mudança de status
CREATE OR REPLACE TRIGGER on_appointment_status_audit
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.audit_appointment_status();

-- 6. Trigger para notificar waitlist em cancelamento
CREATE OR REPLACE TRIGGER on_appointment_cancel_waitlist
  AFTER UPDATE ON public.appointments
  FOR EACH ROW EXECUTE FUNCTION public.notify_waitlist_on_cancel();

-- 7. Trigger para updated_at automático
CREATE OR REPLACE TRIGGER set_updated_at_profiles
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_doctor_profiles
  BEFORE UPDATE ON public.doctor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_clinic_profiles
  BEFORE UPDATE ON public.clinic_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_subscriptions
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE OR REPLACE TRIGGER set_updated_at_partner_profiles
  BEFORE UPDATE ON public.partner_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 8. Tornar buckets de prescriptions e certificates privados
UPDATE storage.buckets SET public = false WHERE id IN ('prescriptions', 'certificates');

-- 9. Adicionar políticas de storage para prescriptions (privado)
DO $$
BEGIN
  -- Drop existing policies if any
  DROP POLICY IF EXISTS "Doctors upload prescriptions" ON storage.objects;
  DROP POLICY IF EXISTS "Authorized view prescriptions" ON storage.objects;
  
  CREATE POLICY "Doctors upload prescriptions" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'prescriptions' AND EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin')
    ));

  CREATE POLICY "Authorized view prescriptions" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'prescriptions' AND (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin'))
      OR auth.uid()::text = (storage.foldername(name))[1]
    ));

  -- Policies for certificates
  DROP POLICY IF EXISTS "Doctors upload certificates" ON storage.objects;
  DROP POLICY IF EXISTS "Authorized view certificates" ON storage.objects;

  CREATE POLICY "Doctors upload certificates" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'certificates' AND EXISTS (
      SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin')
    ));

  CREATE POLICY "Authorized view certificates" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'certificates' AND (
      EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin'))
      OR auth.uid()::text = (storage.foldername(name))[1]
    ));
END $$;
