
-- 1. ON DEMAND QUEUE (Plantão 24h)
CREATE TABLE public.on_demand_queue (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  shift TEXT NOT NULL DEFAULT 'day',
  price NUMERIC NOT NULL DEFAULT 75,
  payment_id TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  assigned_doctor_id UUID REFERENCES public.doctor_profiles(id),
  position INTEGER,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  assigned_at TIMESTAMP WITH TIME ZONE,
  started_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  appointment_id UUID REFERENCES public.appointments(id)
);

ALTER TABLE public.on_demand_queue ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients view own queue entries"
  ON public.on_demand_queue FOR SELECT
  USING (patient_id = auth.uid() OR is_admin());

CREATE POLICY "Doctors view waiting queue"
  ON public.on_demand_queue FOR SELECT
  USING (status = 'waiting' AND EXISTS (
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'doctor'
  ));

CREATE POLICY "Doctors view assigned to them"
  ON public.on_demand_queue FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.doctor_profiles WHERE id = on_demand_queue.assigned_doctor_id AND user_id = auth.uid()
  ));

CREATE POLICY "Patients can insert queue entry"
  ON public.on_demand_queue FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Doctors can update queue"
  ON public.on_demand_queue FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'doctor')
    OR patient_id = auth.uid()
    OR is_admin()
  );

-- 2. PRESCRIPTION RENEWALS
CREATE TABLE public.prescription_renewals (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID NOT NULL,
  original_prescription_url TEXT,
  health_questionnaire JSONB NOT NULL DEFAULT '{}'::jsonb,
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_doctor_id UUID REFERENCES public.doctor_profiles(id),
  new_prescription_id UUID REFERENCES public.prescriptions(id),
  payment_id TEXT,
  paid_at TIMESTAMP WITH TIME ZONE,
  reviewed_at TIMESTAMP WITH TIME ZONE,
  rejection_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.prescription_renewals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Patients manage own renewals"
  ON public.prescription_renewals FOR SELECT
  USING (patient_id = auth.uid());

CREATE POLICY "Patients insert own renewals"
  ON public.prescription_renewals FOR INSERT
  WITH CHECK (patient_id = auth.uid());

CREATE POLICY "Doctors view pending/assigned renewals"
  ON public.prescription_renewals FOR SELECT
  USING (
    status IN ('pending', 'in_review')
    AND EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'doctor')
  );

CREATE POLICY "Doctors view own assigned renewals"
  ON public.prescription_renewals FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.doctor_profiles WHERE id = prescription_renewals.assigned_doctor_id AND user_id = auth.uid()
  ));

CREATE POLICY "Doctors update renewals"
  ON public.prescription_renewals FOR UPDATE
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'doctor')
    OR is_admin()
  );

CREATE POLICY "Admins manage all renewals"
  ON public.prescription_renewals FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

CREATE TRIGGER update_prescription_renewals_updated_at
  BEFORE UPDATE ON public.prescription_renewals
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 3. DISCOUNT CARDS
CREATE TABLE public.discount_cards (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_type TEXT NOT NULL DEFAULT 'individual',
  discount_percent NUMERIC NOT NULL DEFAULT 30,
  price_monthly NUMERIC NOT NULL DEFAULT 24.90,
  status TEXT NOT NULL DEFAULT 'active',
  valid_until TIMESTAMP WITH TIME ZONE,
  payment_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  cancelled_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.discount_cards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own discount card"
  ON public.discount_cards FOR SELECT
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Users insert own discount card"
  ON public.discount_cards FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users update own discount card"
  ON public.discount_cards FOR UPDATE
  USING (user_id = auth.uid() OR is_admin());

CREATE POLICY "Admins manage all discount cards"
  ON public.discount_cards FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- 4. B2B LEADS
CREATE TABLE public.b2b_leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  company_name TEXT NOT NULL,
  cnpj TEXT,
  contact_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  company_type TEXT NOT NULL DEFAULT 'clinic',
  services_interested JSONB NOT NULL DEFAULT '[]'::jsonb,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'new',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.b2b_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit b2b lead"
  ON public.b2b_leads FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins manage b2b leads"
  ON public.b2b_leads FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- 5. ADD CATEGORY TO PATIENT_DOCUMENTS
ALTER TABLE public.patient_documents ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'exam';
