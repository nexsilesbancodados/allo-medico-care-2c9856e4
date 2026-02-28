
-- Table for doctor pre-registration applications
CREATE TABLE public.doctor_applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  crm TEXT NOT NULL,
  crm_state TEXT NOT NULL DEFAULT 'SP',
  specialty TEXT,
  bio TEXT,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  admin_notes TEXT,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  invite_code_id UUID REFERENCES public.doctor_invite_codes(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_applications ENABLE ROW LEVEL SECURITY;

-- Anyone can submit an application (no auth required)
CREATE POLICY "Anyone can submit doctor application"
  ON public.doctor_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

-- Only admins can view/update applications
CREATE POLICY "Admins can view all applications"
  ON public.doctor_applications FOR SELECT
  TO authenticated
  USING (public.is_admin());

CREATE POLICY "Admins can update applications"
  ON public.doctor_applications FOR UPDATE
  TO authenticated
  USING (public.is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_doctor_applications_updated_at
  BEFORE UPDATE ON public.doctor_applications
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
