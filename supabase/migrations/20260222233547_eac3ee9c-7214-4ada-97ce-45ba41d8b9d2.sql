
-- Criar slots de disponibilidade para todos os dias (0=domingo a 6=sábado)
-- Horários das 08:00 às 20:00
INSERT INTO public.availability_slots (doctor_id, day_of_week, start_time, end_time, is_active)
VALUES
  ('c1ee7054-6e36-437a-ae15-732e16f0ef0c', 0, '08:00', '20:00', true),
  ('c1ee7054-6e36-437a-ae15-732e16f0ef0c', 1, '08:00', '20:00', true),
  ('c1ee7054-6e36-437a-ae15-732e16f0ef0c', 2, '08:00', '20:00', true),
  ('c1ee7054-6e36-437a-ae15-732e16f0ef0c', 3, '08:00', '20:00', true),
  ('c1ee7054-6e36-437a-ae15-732e16f0ef0c', 4, '08:00', '20:00', true),
  ('c1ee7054-6e36-437a-ae15-732e16f0ef0c', 5, '08:00', '20:00', true),
  ('c1ee7054-6e36-437a-ae15-732e16f0ef0c', 6, '08:00', '20:00', true);

-- Marcar médico como disponível agora
UPDATE public.doctor_profiles 
SET available_now = true, available_now_since = now()
WHERE id = 'c1ee7054-6e36-437a-ae15-732e16f0ef0c';
