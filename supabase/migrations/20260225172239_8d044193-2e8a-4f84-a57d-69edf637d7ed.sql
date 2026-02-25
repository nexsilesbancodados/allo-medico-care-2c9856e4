-- Allow clinic users to create exam requests (using an affiliated doctor as requesting_doctor_id)
CREATE POLICY "Clinics can create exam requests via affiliated doctors"
ON public.exam_requests
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM clinic_affiliations ca
    JOIN clinic_profiles cp ON cp.id = ca.clinic_id
    WHERE ca.doctor_id = exam_requests.requesting_doctor_id
      AND cp.user_id = auth.uid()
      AND ca.status = 'active'
  )
  OR is_admin()
);

-- Allow clinic users to view their exam requests
CREATE POLICY "Clinics can view exam requests via affiliated doctors"
ON public.exam_requests
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM clinic_affiliations ca
    JOIN clinic_profiles cp ON cp.id = ca.clinic_id
    WHERE ca.doctor_id = exam_requests.requesting_doctor_id
      AND cp.user_id = auth.uid()
      AND ca.status = 'active'
  )
);

-- Allow receptionist users to create exam requests
CREATE POLICY "Receptionists can create exam requests"
ON public.exam_requests
FOR INSERT
TO authenticated
WITH CHECK (is_receptionist());

-- Allow receptionist users to view exam requests
CREATE POLICY "Receptionists can view exam requests"
ON public.exam_requests
FOR SELECT
TO authenticated
USING (is_receptionist());

-- Allow clinic/receptionist to upload to exam-files bucket
CREATE POLICY "Clinic users can upload exam files"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'exam-files'
  AND (
    EXISTS (SELECT 1 FROM clinic_profiles WHERE user_id = auth.uid())
    OR is_receptionist()
    OR EXISTS (SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid())
    OR is_admin()
  )
);

-- Allow reading exam files for authorized users
CREATE POLICY "Authorized users can read exam files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'exam-files'
  AND (
    EXISTS (SELECT 1 FROM doctor_profiles WHERE user_id = auth.uid())
    OR EXISTS (SELECT 1 FROM clinic_profiles WHERE user_id = auth.uid())
    OR is_receptionist()
    OR is_admin()
  )
);