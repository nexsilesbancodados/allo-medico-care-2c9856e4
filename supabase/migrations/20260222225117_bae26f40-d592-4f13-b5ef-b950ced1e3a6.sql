INSERT INTO appointments (
  doctor_id, patient_id, scheduled_at, status, appointment_type, duration_minutes, payment_status
) VALUES (
  '56587859-e5f0-43e4-b41d-6e002028c380',
  '02cec31e-7f1d-494d-bd74-baf66ed0d68c',
  now(),
  'in_progress',
  'first_visit',
  30,
  'confirmed'
) RETURNING id, jitsi_link;