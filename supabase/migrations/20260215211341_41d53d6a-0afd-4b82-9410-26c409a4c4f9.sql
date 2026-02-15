
-- =============================================
-- 1. ENUM & BASE TABLES
-- =============================================

-- Role enum
CREATE TYPE public.app_role AS ENUM ('patient', 'doctor', 'clinic', 'admin');

-- Profiles table (all users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  first_name TEXT NOT NULL DEFAULT '',
  last_name TEXT NOT NULL DEFAULT '',
  cpf TEXT,
  phone TEXT,
  avatar_url TEXT,
  date_of_birth DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User roles table (separate from profiles!)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

-- Specialties
CREATE TABLE public.specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  icon TEXT,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Doctor profiles
CREATE TABLE public.doctor_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  crm TEXT NOT NULL,
  crm_state TEXT NOT NULL DEFAULT 'SP',
  bio TEXT,
  education TEXT,
  experience_years INTEGER DEFAULT 0,
  consultation_price DECIMAL(10,2) DEFAULT 89.00,
  is_approved BOOLEAN DEFAULT false,
  rating DECIMAL(3,2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Doctor specialties (many-to-many)
CREATE TABLE public.doctor_specialties (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  specialty_id UUID REFERENCES public.specialties(id) ON DELETE CASCADE NOT NULL,
  UNIQUE(doctor_id, specialty_id)
);

-- Clinic profiles
CREATE TABLE public.clinic_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  name TEXT NOT NULL,
  cnpj TEXT,
  address TEXT,
  phone TEXT,
  logo_url TEXT,
  is_approved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Clinic-doctor affiliations
CREATE TABLE public.clinic_affiliations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  clinic_id UUID REFERENCES public.clinic_profiles(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'inactive')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(clinic_id, doctor_id)
);

-- Doctor availability slots
CREATE TABLE public.availability_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  day_of_week INTEGER NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Appointments
CREATE TABLE public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  scheduled_at TIMESTAMPTZ NOT NULL,
  duration_minutes INTEGER DEFAULT 30,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show')),
  notes TEXT,
  video_room_url TEXT,
  cancelled_by UUID,
  cancel_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Prescriptions
CREATE TABLE public.prescriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  patient_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  medications JSONB NOT NULL DEFAULT '[]',
  diagnosis TEXT,
  observations TEXT,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Consultation notes (during video call)
CREATE TABLE public.consultation_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  appointment_id UUID REFERENCES public.appointments(id) ON DELETE CASCADE NOT NULL,
  doctor_id UUID REFERENCES public.doctor_profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Patient dependents
CREATE TABLE public.dependents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  cpf TEXT,
  date_of_birth DATE,
  relationship TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- 2. INDEXES
-- =============================================
CREATE INDEX idx_profiles_user_id ON public.profiles(user_id);
CREATE INDEX idx_user_roles_user_id ON public.user_roles(user_id);
CREATE INDEX idx_doctor_profiles_user_id ON public.doctor_profiles(user_id);
CREATE INDEX idx_clinic_profiles_user_id ON public.clinic_profiles(user_id);
CREATE INDEX idx_appointments_patient_id ON public.appointments(patient_id);
CREATE INDEX idx_appointments_doctor_id ON public.appointments(doctor_id);
CREATE INDEX idx_appointments_scheduled_at ON public.appointments(scheduled_at);
CREATE INDEX idx_prescriptions_patient_id ON public.prescriptions(patient_id);
CREATE INDEX idx_prescriptions_doctor_id ON public.prescriptions(doctor_id);
CREATE INDEX idx_availability_doctor_id ON public.availability_slots(doctor_id);

-- =============================================
-- 3. SECURITY DEFINER FUNCTIONS
-- =============================================

-- Check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid() AND role = 'admin'
  )
$$;

-- Get doctor_profile id for a user
CREATE OR REPLACE FUNCTION public.get_doctor_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.doctor_profiles WHERE user_id = _user_id LIMIT 1
$$;

-- Get clinic_profile id for a user
CREATE OR REPLACE FUNCTION public.get_clinic_profile_id(_user_id UUID)
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.clinic_profiles WHERE user_id = _user_id LIMIT 1
$$;

-- =============================================
-- 4. UPDATED_AT TRIGGER
-- =============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_doctor_profiles_updated_at BEFORE UPDATE ON public.doctor_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_clinic_profiles_updated_at BEFORE UPDATE ON public.clinic_profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_consultation_notes_updated_at BEFORE UPDATE ON public.consultation_notes FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- 5. AUTO-CREATE PROFILE ON SIGNUP
-- =============================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', '')
  );
  
  -- Default role: patient
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'patient');
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 6. ENABLE RLS ON ALL TABLES
-- =============================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.doctor_specialties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clinic_affiliations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.availability_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consultation_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dependents ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 7. RLS POLICIES
-- =============================================

-- PROFILES
CREATE POLICY "Users can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);

-- USER_ROLES
CREATE POLICY "Users can view own roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Only admins can insert roles" ON public.user_roles FOR INSERT TO authenticated WITH CHECK (public.is_admin());
CREATE POLICY "Only admins can delete roles" ON public.user_roles FOR DELETE TO authenticated USING (public.is_admin());

-- SPECIALTIES (public read)
CREATE POLICY "Anyone can view specialties" ON public.specialties FOR SELECT USING (true);
CREATE POLICY "Only admins can manage specialties" ON public.specialties FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- DOCTOR_PROFILES
CREATE POLICY "Anyone can view approved doctors" ON public.doctor_profiles FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Doctors can insert own profile" ON public.doctor_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Doctors can update own profile" ON public.doctor_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- DOCTOR_SPECIALTIES
CREATE POLICY "Anyone can view doctor specialties" ON public.doctor_specialties FOR SELECT USING (true);
CREATE POLICY "Doctors can manage own specialties" ON public.doctor_specialties FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Doctors can delete own specialties" ON public.doctor_specialties FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR public.is_admin());

-- CLINIC_PROFILES
CREATE POLICY "Anyone can view approved clinics" ON public.clinic_profiles FOR SELECT USING (is_approved = true OR auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Clinics can insert own profile" ON public.clinic_profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Clinics can update own profile" ON public.clinic_profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id OR public.is_admin());

-- CLINIC_AFFILIATIONS
CREATE POLICY "Affiliated parties can view" ON public.clinic_affiliations FOR SELECT TO authenticated
  USING (
    public.is_admin() OR
    EXISTS (SELECT 1 FROM public.clinic_profiles WHERE id = clinic_id AND user_id = auth.uid()) OR
    EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid())
  );
CREATE POLICY "Clinics can manage affiliations" ON public.clinic_affiliations FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.clinic_profiles WHERE id = clinic_id AND user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Clinics can update affiliations" ON public.clinic_affiliations FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clinic_profiles WHERE id = clinic_id AND user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Clinics can delete affiliations" ON public.clinic_affiliations FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.clinic_profiles WHERE id = clinic_id AND user_id = auth.uid()) OR public.is_admin());

-- AVAILABILITY_SLOTS
CREATE POLICY "Anyone can view active slots" ON public.availability_slots FOR SELECT USING (is_active = true OR EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Doctors can manage own slots" ON public.availability_slots FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Doctors can update own slots" ON public.availability_slots FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Doctors can delete own slots" ON public.availability_slots FOR DELETE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR public.is_admin());

-- APPOINTMENTS
CREATE POLICY "Users can view own appointments" ON public.appointments FOR SELECT TO authenticated
  USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR
    public.is_admin()
  );
CREATE POLICY "Patients can create appointments" ON public.appointments FOR INSERT TO authenticated
  WITH CHECK (patient_id = auth.uid() OR public.is_admin());
CREATE POLICY "Parties can update appointments" ON public.appointments FOR UPDATE TO authenticated
  USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR
    public.is_admin()
  );

-- PRESCRIPTIONS
CREATE POLICY "Users can view own prescriptions" ON public.prescriptions FOR SELECT TO authenticated
  USING (
    patient_id = auth.uid() OR
    EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR
    public.is_admin()
  );
CREATE POLICY "Doctors can create prescriptions" ON public.prescriptions FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Doctors can update prescriptions" ON public.prescriptions FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR public.is_admin());

-- CONSULTATION_NOTES
CREATE POLICY "Doctors can view own notes" ON public.consultation_notes FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Doctors can create notes" ON public.consultation_notes FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR public.is_admin());
CREATE POLICY "Doctors can update notes" ON public.consultation_notes FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.doctor_profiles WHERE id = doctor_id AND user_id = auth.uid()) OR public.is_admin());

-- DEPENDENTS
CREATE POLICY "Users can view own dependents" ON public.dependents FOR SELECT TO authenticated USING (auth.uid() = user_id OR public.is_admin());
CREATE POLICY "Users can manage own dependents" ON public.dependents FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dependents" ON public.dependents FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own dependents" ON public.dependents FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- =============================================
-- 8. SEED SPECIALTIES
-- =============================================
INSERT INTO public.specialties (name, icon, description) VALUES
  ('Clínico Geral', 'stethoscope', 'Atendimento geral e preventivo'),
  ('Pediatria', 'baby', 'Saúde infantil e do adolescente'),
  ('Dermatologia', 'scan-face', 'Cuidados com a pele, cabelos e unhas'),
  ('Cardiologia', 'heart-pulse', 'Saúde do coração e sistema circulatório'),
  ('Ortopedia', 'bone', 'Sistema musculoesquelético'),
  ('Ginecologia', 'heart', 'Saúde da mulher'),
  ('Psiquiatria', 'brain', 'Saúde mental e transtornos psiquiátricos'),
  ('Endocrinologia', 'activity', 'Hormônios e metabolismo'),
  ('Oftalmologia', 'eye', 'Saúde dos olhos'),
  ('Neurologia', 'brain-circuit', 'Sistema nervoso'),
  ('Urologia', 'shield', 'Sistema urinário e reprodutor masculino'),
  ('Nutrição', 'apple', 'Alimentação e nutrição clínica'),
  ('Psicologia', 'smile', 'Saúde mental e terapia');
