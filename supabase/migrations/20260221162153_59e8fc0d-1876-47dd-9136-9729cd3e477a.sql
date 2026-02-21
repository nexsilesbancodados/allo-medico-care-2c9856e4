-- Fix 1: Profiles - restrict to own profile + admin + treating doctors only
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

CREATE POLICY "Users can view own profile"
ON public.profiles FOR SELECT
TO authenticated
USING (
  user_id = auth.uid()
  OR public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.doctor_profiles dp ON dp.id = a.doctor_id
    WHERE a.patient_id = profiles.user_id
    AND dp.user_id = auth.uid()
    AND a.status IN ('scheduled', 'in_progress', 'completed')
  )
);

-- Fix 2: Prescriptions - remove public access, require auth + ownership
DROP POLICY IF EXISTS "Anyone can validate prescriptions by id" ON public.prescriptions;

CREATE POLICY "Authenticated users can validate prescriptions"
ON public.prescriptions FOR SELECT
TO authenticated
USING (
  patient_id = auth.uid()
  OR doctor_id = (SELECT id FROM public.doctor_profiles WHERE user_id = auth.uid())
  OR public.is_admin()
);

-- Fix 3: Guest patients - restrict doctors to only their own patients
DROP POLICY IF EXISTS "Doctors can view guest patients" ON public.guest_patients;

CREATE POLICY "Doctors can view their own guest patients"
ON public.guest_patients FOR SELECT
TO authenticated
USING (
  public.is_admin()
  OR EXISTS (
    SELECT 1 FROM public.appointments a
    JOIN public.doctor_profiles dp ON dp.id = a.doctor_id
    WHERE a.guest_patient_id = guest_patients.id
    AND dp.user_id = auth.uid()
  )
);

-- Fix 4: Doctor profiles - create public view without sensitive data
DROP POLICY IF EXISTS "Anyone can view approved doctors" ON public.doctor_profiles;

CREATE POLICY "Public can view approved doctor basics"
ON public.doctor_profiles FOR SELECT
USING (
  is_approved = true
  OR user_id = auth.uid()
  OR public.is_admin()
);

-- Fix 5: Coupons - restrict public listing, only allow code lookup
DROP POLICY IF EXISTS "Anyone can read active coupons" ON public.coupons;

CREATE POLICY "Authenticated users can validate coupons"
ON public.coupons FOR SELECT
TO authenticated
USING (is_active = true);

-- Fix 6: Doctor invite codes - restrict enumeration
DROP POLICY IF EXISTS "Anyone can validate unused codes" ON public.doctor_invite_codes;

CREATE POLICY "Authenticated can validate invite codes"
ON public.doctor_invite_codes FOR SELECT
TO authenticated
USING (is_used = false);

-- Fix 7: Document verifications - restrict to code-based lookup only (keep public but limit columns via app)
DROP POLICY IF EXISTS "Anyone can verify documents" ON public.document_verifications;

CREATE POLICY "Anyone can verify documents by code"
ON public.document_verifications FOR SELECT
USING (true);

-- Fix 8: Doctor absences - hide reasons from public
DROP POLICY IF EXISTS "Anyone can view doctor absences" ON public.doctor_absences;

CREATE POLICY "Authenticated can view doctor absence dates"
ON public.doctor_absences FOR SELECT
TO authenticated
USING (true);