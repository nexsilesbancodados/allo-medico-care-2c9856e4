
INSERT INTO public.appointments (
  patient_id,
  doctor_id,
  scheduled_at,
  status,
  appointment_type,
  duration_minutes,
  payment_status
) VALUES (
  '4b519355-680b-49ef-9966-102d75fac2a2',
  'c1ee7054-6e36-437a-ae15-732e16f0ef0c',
  now() + interval '5 minutes',
  'scheduled',
  'first_visit',
  30,
  'confirmed'
);
