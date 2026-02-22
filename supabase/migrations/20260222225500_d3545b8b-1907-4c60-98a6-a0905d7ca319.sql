INSERT INTO appointments (
  doctor_id, patient_id, scheduled_at, status, appointment_type, duration_minutes, payment_status
) VALUES (
  'c1ee7054-6e36-437a-ae15-732e16f0ef0c',
  'bc5ed973-4764-4229-a4e5-4d06435f0e70',
  now(),
  'in_progress',
  'first_visit',
  30,
  'confirmed'
) RETURNING id, jitsi_link;