
-- 1. Tabela health_metrics
CREATE TABLE IF NOT EXISTS public.health_metrics (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  type TEXT NOT NULL,
  value NUMERIC NOT NULL,
  unit TEXT NOT NULL,
  measured_at TIMESTAMPTZ DEFAULT now(),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.health_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patient manages own metrics" ON public.health_metrics
  FOR ALL USING (patient_id = auth.uid() OR is_admin())
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Doctors can view patient metrics" ON public.health_metrics
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM doctor_profiles dp
      JOIN appointments a ON a.doctor_id = dp.id
      WHERE dp.user_id = auth.uid() AND a.patient_id = health_metrics.patient_id
    )
  );

-- 2. Colunas faltantes
ALTER TABLE public.plans ADD COLUMN IF NOT EXISTS stripe_price_id TEXT;
ALTER TABLE public.doctor_profiles ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ;

-- 3. Storage buckets
INSERT INTO storage.buckets (id, name, public) VALUES
  ('prescriptions', 'prescriptions', true),
  ('certificates', 'certificates', true),
  ('exams', 'exams', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for prescriptions bucket
CREATE POLICY "Doctors can upload prescriptions" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'prescriptions' AND
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'doctor')
  );

CREATE POLICY "Anyone authenticated can view prescriptions" ON storage.objects
  FOR SELECT USING (bucket_id = 'prescriptions' AND auth.role() = 'authenticated');

-- Storage policies for certificates bucket
CREATE POLICY "Doctors can upload certificates" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'certificates' AND
    EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'doctor')
  );

CREATE POLICY "Anyone authenticated can view certificates" ON storage.objects
  FOR SELECT USING (bucket_id = 'certificates' AND auth.role() = 'authenticated');

-- Storage policies for exams bucket
CREATE POLICY "Users can upload exams" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exams' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own exams" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exams' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 4. Índices de performance
CREATE INDEX IF NOT EXISTS idx_appointments_patient_id ON appointments(patient_id);
CREATE INDEX IF NOT EXISTS idx_appointments_doctor_id ON appointments(doctor_id);
CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);
CREATE INDEX IF NOT EXISTS idx_appointments_scheduled_at ON appointments(scheduled_at);
CREATE INDEX IF NOT EXISTS idx_health_metrics_patient_id ON health_metrics(patient_id);
CREATE INDEX IF NOT EXISTS idx_health_metrics_type ON health_metrics(type);
