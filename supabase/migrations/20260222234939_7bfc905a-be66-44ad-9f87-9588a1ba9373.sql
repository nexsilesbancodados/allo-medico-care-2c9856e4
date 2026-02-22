
INSERT INTO public.appointments (
  patient_id, doctor_id, scheduled_at, status, appointment_type, duration_minutes, payment_status
) VALUES (
  'bc5ed973-4764-4229-a4e5-4d06435f0e70',
  'c1ee7054-6e36-437a-ae15-732e16f0ef0c',
  now(),
  'in_progress',
  'first_visit',
  30,
  'confirmed'
);
