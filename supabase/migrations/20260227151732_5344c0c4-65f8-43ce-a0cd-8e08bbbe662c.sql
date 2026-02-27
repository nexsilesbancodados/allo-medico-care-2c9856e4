
-- Allow patients to view exam reports for their own exams
CREATE POLICY "Patients can view own exam reports"
ON public.exam_reports
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM exam_requests er
    WHERE er.id = exam_reports.exam_request_id
    AND er.patient_id = auth.uid()
  )
);

-- Allow patients to view their own exam requests
CREATE POLICY "Patients can view own exam requests"
ON public.exam_requests
FOR SELECT
USING (patient_id = auth.uid());
