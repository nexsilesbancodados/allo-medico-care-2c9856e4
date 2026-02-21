
-- Table for doctor day-off / absence management
CREATE TABLE public.doctor_absences (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  doctor_id uuid NOT NULL REFERENCES public.doctor_profiles(id) ON DELETE CASCADE,
  absence_date date NOT NULL,
  reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.doctor_absences ENABLE ROW LEVEL SECURITY;

-- Doctors can manage their own absences
CREATE POLICY "Doctors can manage own absences"
ON public.doctor_absences FOR ALL
USING (
  EXISTS (SELECT 1 FROM doctor_profiles WHERE doctor_profiles.id = doctor_absences.doctor_id AND doctor_profiles.user_id = auth.uid())
  OR is_admin()
)
WITH CHECK (
  EXISTS (SELECT 1 FROM doctor_profiles WHERE doctor_profiles.id = doctor_absences.doctor_id AND doctor_profiles.user_id = auth.uid())
  OR is_admin()
);

-- Anyone can view absences (needed for booking availability check)
CREATE POLICY "Anyone can view doctor absences"
ON public.doctor_absences FOR SELECT
USING (true);

-- Unique constraint to prevent duplicate entries
CREATE UNIQUE INDEX idx_doctor_absences_unique ON public.doctor_absences(doctor_id, absence_date);
