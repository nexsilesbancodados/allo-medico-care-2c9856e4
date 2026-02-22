
-- Recriar especialidade
INSERT INTO public.specialties (id, name, description, icon, consultation_price)
VALUES ('a1b2c3d4-0001-4000-8000-000000000001', 'Clínico Geral', 'Medicina geral e familiar', '🩺', 89.00);

-- Recriar perfil do médico Carlos
INSERT INTO public.doctor_profiles (id, user_id, crm, crm_state, crm_verified, is_approved, bio, consultation_price, rating, total_reviews, experience_years)
VALUES (
  'c1ee7054-6e36-437a-ae15-732e16f0ef0c',
  '38dae434-500c-43db-b0c1-a1f4d0a4ad67',
  '123456',
  'SP',
  true,
  true,
  'Médico clínico geral com 10 anos de experiência.',
  89.00,
  4.8,
  12,
  10
);

-- Vincular especialidade
INSERT INTO public.doctor_specialties (doctor_id, specialty_id)
VALUES ('c1ee7054-6e36-437a-ae15-732e16f0ef0c', 'a1b2c3d4-0001-4000-8000-000000000001');

-- Criar consulta em andamento
INSERT INTO public.appointments (
  patient_id, doctor_id, scheduled_at, status, appointment_type, duration_minutes, payment_status
) VALUES (
  '4b519355-680b-49ef-9966-102d75fac2a2',
  'c1ee7054-6e36-437a-ae15-732e16f0ef0c',
  now(),
  'in_progress',
  'first_visit',
  30,
  'confirmed'
);
