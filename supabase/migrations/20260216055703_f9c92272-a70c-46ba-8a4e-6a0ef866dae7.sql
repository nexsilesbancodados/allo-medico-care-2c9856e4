-- Helper functions for new roles
CREATE OR REPLACE FUNCTION public.is_receptionist()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'receptionist'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_support()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'support'
  )
$$;

CREATE OR REPLACE FUNCTION public.is_partner()
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'partner'
  )
$$;

-- Referrals table
CREATE TABLE public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_user_id uuid,
  referral_code text NOT NULL UNIQUE,
  source text,
  status text NOT NULL DEFAULT 'pending',
  commission_percent numeric DEFAULT 10,
  commission_paid boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Affiliates can view own referrals" ON public.referrals FOR SELECT
USING (referrer_id = auth.uid() OR is_admin());

CREATE POLICY "Anyone can create referrals" ON public.referrals FOR INSERT
WITH CHECK (referrer_id = auth.uid() OR is_admin());

CREATE POLICY "Admins can update referrals" ON public.referrals FOR UPDATE
USING (is_admin());

-- Partner profiles
CREATE TABLE public.partner_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  partner_type text NOT NULL DEFAULT 'pharmacy',
  business_name text NOT NULL,
  cnpj text,
  address text,
  phone text,
  is_approved boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.partner_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners can view own profile" ON public.partner_profiles FOR SELECT
USING (user_id = auth.uid() OR is_admin() OR is_receptionist());

CREATE POLICY "Partners can insert own profile" ON public.partner_profiles FOR INSERT
WITH CHECK (user_id = auth.uid());

CREATE POLICY "Partners can update own profile" ON public.partner_profiles FOR UPDATE
USING (user_id = auth.uid() OR is_admin());

-- Prescription validations
CREATE TABLE public.prescription_validations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  prescription_id uuid NOT NULL REFERENCES public.prescriptions(id),
  validated_by uuid NOT NULL,
  partner_id uuid REFERENCES public.partner_profiles(id),
  status text NOT NULL DEFAULT 'validated',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.prescription_validations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Partners and admins can view validations" ON public.prescription_validations FOR SELECT
USING (validated_by = auth.uid() OR is_admin() OR is_partner());

CREATE POLICY "Partners can create validations" ON public.prescription_validations FOR INSERT
WITH CHECK (validated_by = auth.uid());

-- Receptionist access to appointments
CREATE POLICY "Receptionists can view all appointments" ON public.appointments FOR SELECT
USING (is_receptionist());

CREATE POLICY "Receptionists can update appointments" ON public.appointments FOR UPDATE
USING (is_receptionist());

-- Support access to logs
CREATE POLICY "Support can view logs" ON public.activity_logs FOR SELECT
USING (is_support());

CREATE POLICY "Support can insert logs" ON public.activity_logs FOR INSERT
WITH CHECK (is_support());

-- Trigger
CREATE TRIGGER update_partner_profiles_updated_at
BEFORE UPDATE ON public.partner_profiles
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
