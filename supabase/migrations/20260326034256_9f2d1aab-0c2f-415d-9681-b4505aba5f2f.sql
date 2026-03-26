
-- Fix the overly permissive WITH CHECK on "Doctors claim pending exams"
DROP POLICY IF EXISTS "Doctors claim pending exams" ON public.exam_requests;

CREATE POLICY "Doctors claim pending exams"
  ON public.exam_requests FOR UPDATE TO authenticated
  USING (
    assigned_to IS NULL AND status = 'pending'
  )
  WITH CHECK (
    assigned_to = public.get_my_doctor_id()
  );
