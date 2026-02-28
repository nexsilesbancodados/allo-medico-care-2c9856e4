
ALTER TABLE public.appointments DROP CONSTRAINT appointments_status_check;

ALTER TABLE public.appointments ADD CONSTRAINT appointments_status_check 
CHECK (status = ANY (ARRAY['scheduled', 'waiting', 'in_progress', 'completed', 'cancelled', 'no_show', 'confirmed']));
