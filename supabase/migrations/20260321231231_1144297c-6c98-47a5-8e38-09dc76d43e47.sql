
-- Ophthalmology exam readings uploaded by technicians
CREATE TABLE public.ophthalmology_exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_name TEXT NOT NULL,
  patient_cpf TEXT,
  patient_birth_date DATE,
  exam_type TEXT NOT NULL DEFAULT 'refração',
  od_spherical NUMERIC, od_cylindrical NUMERIC, od_axis INTEGER,
  oe_spherical NUMERIC, oe_cylindrical NUMERIC, oe_axis INTEGER,
  od_acuity TEXT, oe_acuity TEXT,
  intraocular_pressure_od NUMERIC, intraocular_pressure_oe NUMERIC,
  notes TEXT,
  file_urls JSONB DEFAULT '[]'::jsonb,
  technician_id UUID REFERENCES auth.users(id),
  clinic_id UUID REFERENCES public.clinic_profiles(id),
  status TEXT NOT NULL DEFAULT 'pending',
  assigned_doctor_id UUID REFERENCES public.doctor_profiles(id),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Glasses prescriptions created by ophthalmologists
CREATE TABLE public.ophthalmology_prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  exam_id UUID REFERENCES public.ophthalmology_exams(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctor_profiles(id) NOT NULL,
  patient_name TEXT NOT NULL,
  patient_cpf TEXT,
  od_spherical NUMERIC, od_cylindrical NUMERIC, od_axis INTEGER,
  od_addition NUMERIC, od_prism NUMERIC, od_prism_base TEXT,
  oe_spherical NUMERIC, oe_cylindrical NUMERIC, oe_axis INTEGER,
  oe_addition NUMERIC, oe_prism NUMERIC, oe_prism_base TEXT,
  interpupillary_distance NUMERIC,
  lens_type TEXT,
  lens_material TEXT,
  lens_treatment TEXT,
  observations TEXT,
  pdf_url TEXT,
  verification_code TEXT,
  signed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ophthalmology_exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ophthalmology_prescriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can view ophthalmology exams"
  ON public.ophthalmology_exams FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin'))
    OR technician_id = auth.uid()
  );

CREATE POLICY "Authenticated can insert ophthalmology exams"
  ON public.ophthalmology_exams FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Authenticated can update ophthalmology exams"
  ON public.ophthalmology_exams FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin'))
    OR technician_id = auth.uid()
  );

CREATE POLICY "Doctors can view ophthalmology prescriptions"
  ON public.ophthalmology_prescriptions FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin'))
  );

CREATE POLICY "Doctors can insert ophthalmology prescriptions"
  ON public.ophthalmology_prescriptions FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin'))
  );

CREATE POLICY "Doctors can update ophthalmology prescriptions"
  ON public.ophthalmology_prescriptions FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('doctor', 'admin'))
  );
