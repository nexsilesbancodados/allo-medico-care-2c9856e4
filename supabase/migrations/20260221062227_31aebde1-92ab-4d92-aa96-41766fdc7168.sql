
-- =============================================
-- SEED DATA: Populate all panels for testing
-- =============================================

-- 1. Doctor profile
INSERT INTO doctor_profiles (user_id, crm, crm_state, crm_verified, is_approved, bio, consultation_price, experience_years, education, rating, total_reviews, available_now)
VALUES ('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 'CRM-12345', 'SP', true, true, 'Médico generalista com 15 anos de experiência em telemedicina.', 120.00, 15, 'USP - Faculdade de Medicina', 4.8, 42, true)
ON CONFLICT DO NOTHING;

-- 2. Doctor specialties
INSERT INTO doctor_specialties (doctor_id, specialty_id)
SELECT dp.id, s.id FROM doctor_profiles dp, specialties s
WHERE dp.user_id = 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353' AND s.name IN ('Clínico Geral', 'Cardiologia')
ON CONFLICT DO NOTHING;

-- 3. Availability slots
INSERT INTO availability_slots (doctor_id, day_of_week, start_time, end_time, is_active)
SELECT dp.id, d, '08:00', '18:00', true
FROM doctor_profiles dp, generate_series(1,5) AS d
WHERE dp.user_id = 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353'
ON CONFLICT DO NOTHING;

-- 4. Plans
INSERT INTO plans (name, description, price, interval, is_active, max_appointments, features) VALUES
('Gratuito', 'Plano básico gratuito', 0, 'monthly', true, 1, '["1 consulta/mês", "Chat com médico", "Histórico básico"]'),
('Essencial', 'Acompanhamento regular', 49.90, 'monthly', true, 5, '["5 consultas/mês", "Chat ilimitado", "Prescrição digital", "Histórico completo"]'),
('Premium', 'Acesso completo com prioridade', 99.90, 'monthly', true, null, '["Consultas ilimitadas", "Prioridade na fila", "Chat 24h", "Prescrição digital", "Exames e laudos"]'),
('Família', 'Plano completo para a família', 179.90, 'monthly', true, null, '["Até 5 dependentes", "Consultas ilimitadas", "Especialistas inclusos", "Emergência 24h"]')
ON CONFLICT DO NOTHING;

-- 5. Appointments (past - completed/cancelled)
INSERT INTO appointments (doctor_id, patient_id, scheduled_at, status, appointment_type, duration_minutes, payment_status, notes)
SELECT dp.id, '4b519355-680b-49ef-9966-102d75fac2a2',
  now() - (interval '1 day' * gs) + interval '9 hours',
  CASE WHEN gs <= 2 THEN 'completed' WHEN gs = 3 THEN 'cancelled' WHEN gs = 4 THEN 'no_show' ELSE 'completed' END,
  CASE WHEN gs % 3 = 0 THEN 'return' ELSE 'first_visit' END, 30,
  CASE WHEN gs <= 5 THEN 'paid' ELSE 'pending' END, 'Consulta de teste #' || gs
FROM doctor_profiles dp, generate_series(1, 12) AS gs
WHERE dp.user_id = 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353';

INSERT INTO appointments (doctor_id, patient_id, scheduled_at, status, appointment_type, duration_minutes, payment_status)
SELECT dp.id, '29343cb2-8133-4903-bda8-309b23390493',
  now() - (interval '1 day' * gs) + interval '14 hours',
  CASE WHEN gs <= 3 THEN 'completed' WHEN gs = 4 THEN 'scheduled' ELSE 'completed' END,
  'first_visit', 30, 'paid'
FROM doctor_profiles dp, generate_series(1, 8) AS gs
WHERE dp.user_id = 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353';

-- Future
INSERT INTO appointments (doctor_id, patient_id, scheduled_at, status, appointment_type, duration_minutes, payment_status)
SELECT dp.id, '4b519355-680b-49ef-9966-102d75fac2a2',
  now() + (interval '1 day' * gs) + interval '10 hours', 'scheduled', 'first_visit', 30, 'pending'
FROM doctor_profiles dp, generate_series(1, 5) AS gs
WHERE dp.user_id = 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353';

-- 6. Subscriptions
INSERT INTO subscriptions (user_id, plan_id, status, starts_at, current_period_end, payment_method)
SELECT '4b519355-680b-49ef-9966-102d75fac2a2', p.id, 'active', now() - interval '15 days', now() + interval '15 days', 'pix'
FROM plans p WHERE p.name = 'Premium';

INSERT INTO subscriptions (user_id, plan_id, status, starts_at, current_period_end, payment_method)
SELECT '29343cb2-8133-4903-bda8-309b23390493', p.id, 'active', now() - interval '20 days', now() + interval '10 days', 'credit_card'
FROM plans p WHERE p.name = 'Essencial';

INSERT INTO subscriptions (user_id, plan_id, status, starts_at, current_period_end, payment_method)
SELECT 'acdce72a-ee6f-4573-8760-2e7f24e2da97', p.id, 'cancelled', now() - interval '45 days', now() - interval '15 days', 'pix'
FROM plans p WHERE p.name = 'Gratuito';

-- 7. Satisfaction surveys
INSERT INTO satisfaction_surveys (appointment_id, patient_id, doctor_id, nps_score, quality_score, ease_score, would_recommend, comment)
SELECT a.id, a.patient_id, a.doctor_id,
  7 + (gs % 4), 3 + (gs % 3), 3 + (gs % 3), true,
  CASE gs % 5 WHEN 0 THEN 'Excelente!' WHEN 1 THEN 'Consulta rápida e eficiente.' WHEN 2 THEN 'Recomendo!' WHEN 3 THEN 'Ótima experiência.' ELSE 'Muito bom!' END
FROM (SELECT id, patient_id, doctor_id, row_number() OVER () AS gs FROM appointments WHERE status = 'completed' LIMIT 10) a;

-- 8. Notifications
INSERT INTO notifications (user_id, title, message, type, link) VALUES
('4b519355-680b-49ef-9966-102d75fac2a2', '🩺 Consulta Confirmada', 'Sua consulta foi confirmada para amanhã às 10:00.', 'appointment', '/dashboard/appointments'),
('4b519355-680b-49ef-9966-102d75fac2a2', '💊 Nova Prescrição', 'Uma prescrição foi emitida.', 'prescription', '/dashboard/prescriptions'),
('4b519355-680b-49ef-9966-102d75fac2a2', '⭐ Avalie sua consulta', 'Como foi sua última consulta?', 'survey', '/dashboard/rate'),
('29343cb2-8133-4903-bda8-309b23390493', '📅 Lembrete', 'Sua consulta é em 1 hora.', 'reminder', '/dashboard/appointments'),
('29343cb2-8133-4903-bda8-309b23390493', '💚 Bem-vindo!', 'Explore nossos médicos.', 'info', '/dashboard'),
('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', '🔔 Nova consulta', 'Paciente agendou para amanhã.', 'appointment', '/dashboard/appointments'),
('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', '📊 Relatório mensal', 'Relatório de fevereiro disponível.', 'report', '/dashboard/reports');

-- 9. Referrals
INSERT INTO referrals (referrer_id, referral_code, status, source, referred_user_id, converted_at, commission_percent) VALUES
('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 'REF-A5C1AC-TEST', 'converted', 'whatsapp', '4b519355-680b-49ef-9966-102d75fac2a2', now() - interval '10 days', 10),
('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 'REF-A5C1AC-WEB1', 'converted', 'website', '29343cb2-8133-4903-bda8-309b23390493', now() - interval '5 days', 10),
('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 'REF-A5C1AC-IG01', 'pending', 'instagram', null, null, 10),
('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 'REF-A5C1AC-FB01', 'expired', 'facebook', null, null, 10);

-- 10. Prescriptions
INSERT INTO prescriptions (appointment_id, doctor_id, patient_id, diagnosis, medications, observations)
SELECT a.id, a.doctor_id, a.patient_id,
  'Hipertensão arterial leve',
  '[{"name":"Losartana 50mg","dosage":"1 comp","frequency":"1x/dia","duration":"30 dias"},{"name":"Atenolol 25mg","dosage":"1 comp","frequency":"1x/dia","duration":"30 dias"}]'::jsonb,
  'Retorno em 30 dias.'
FROM appointments a WHERE a.status = 'completed' LIMIT 5;

-- 11. Medical records
INSERT INTO medical_records (patient_id, record_type, title, description, severity, is_active, cid_code) VALUES
('4b519355-680b-49ef-9966-102d75fac2a2', 'condition', 'Hipertensão Arterial', 'Hipertensão grau I', 'moderate', true, 'I10'),
('4b519355-680b-49ef-9966-102d75fac2a2', 'allergy', 'Alergia a Penicilina', 'Reação alérgica moderada', 'high', true, null),
('4b519355-680b-49ef-9966-102d75fac2a2', 'procedure', 'Hemograma Completo', 'Exame de sangue', 'low', true, null),
('29343cb2-8133-4903-bda8-309b23390493', 'condition', 'Diabetes Tipo 2', 'Controle com metformina', 'moderate', true, 'E11'),
('29343cb2-8133-4903-bda8-309b23390493', 'allergy', 'Intolerância à Lactose', 'Moderada', 'low', true, null);

-- 12. Health metrics
INSERT INTO health_metrics (patient_id, type, value, unit, measured_at, notes) VALUES
('4b519355-680b-49ef-9966-102d75fac2a2', 'blood_pressure_systolic', 130, 'mmHg', now() - interval '1 day', 'Repouso'),
('4b519355-680b-49ef-9966-102d75fac2a2', 'blood_pressure_systolic', 125, 'mmHg', now() - interval '7 days', null),
('4b519355-680b-49ef-9966-102d75fac2a2', 'blood_pressure_systolic', 135, 'mmHg', now() - interval '14 days', null),
('4b519355-680b-49ef-9966-102d75fac2a2', 'weight', 78.5, 'kg', now() - interval '1 day', null),
('4b519355-680b-49ef-9966-102d75fac2a2', 'weight', 79.2, 'kg', now() - interval '30 days', null),
('4b519355-680b-49ef-9966-102d75fac2a2', 'heart_rate', 72, 'bpm', now() - interval '1 day', null),
('4b519355-680b-49ef-9966-102d75fac2a2', 'glucose', 98, 'mg/dL', now() - interval '3 days', 'Jejum 8h'),
('29343cb2-8133-4903-bda8-309b23390493', 'glucose', 145, 'mg/dL', now() - interval '1 day', 'Pós-prandial'),
('29343cb2-8133-4903-bda8-309b23390493', 'weight', 85.0, 'kg', now() - interval '2 days', null),
('29343cb2-8133-4903-bda8-309b23390493', 'blood_pressure_systolic', 140, 'mmHg', now() - interval '2 days', null);

-- 13. Symptom diary
INSERT INTO symptom_diary (patient_id, entry_date, mood, symptoms, notes) VALUES
('4b519355-680b-49ef-9966-102d75fac2a2', now()::date - 1, 'good', ARRAY['dor de cabeça leve'], 'Tomei paracetamol.'),
('4b519355-680b-49ef-9966-102d75fac2a2', now()::date - 3, 'neutral', ARRAY['cansaço', 'insônia'], 'Dormindo mal.'),
('4b519355-680b-49ef-9966-102d75fac2a2', now()::date - 7, 'bad', ARRAY['tontura', 'náusea'], 'Após exercício.'),
('29343cb2-8133-4903-bda8-309b23390493', now()::date - 2, 'good', ARRAY['sede excessiva'], 'Controlando glicemia.');

-- 14. Clinic
INSERT INTO clinic_profiles (user_id, name, cnpj, phone, address, is_approved)
VALUES ('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 'Clínica Plena Saúde', '12.345.678/0001-90', '(95) 99999-0001', 'Av. Ville Roy, 1000, Boa Vista - RR', true)
ON CONFLICT DO NOTHING;

-- 15. Partner
INSERT INTO partner_profiles (user_id, business_name, partner_type, cnpj, phone, address, is_approved)
VALUES ('acdce72a-ee6f-4573-8760-2e7f24e2da97', 'Farmácia Saúde Total', 'pharmacy', '98.765.432/0001-10', '(95) 99999-0002', 'Rua Cecília Brasil, 500, Boa Vista - RR', true)
ON CONFLICT DO NOTHING;

-- 16. Roles
INSERT INTO user_roles (user_id, role) VALUES ('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 'affiliate') ON CONFLICT DO NOTHING;
INSERT INTO user_roles (user_id, role) VALUES ('acdce72a-ee6f-4573-8760-2e7f24e2da97', 'partner') ON CONFLICT DO NOTHING;

-- 17. Consultation notes
INSERT INTO consultation_notes (appointment_id, doctor_id, content)
SELECT a.id, a.doctor_id, 'Paciente com queixas de cefaleia. PA: 130/85. Orientado mudanças de estilo de vida.'
FROM appointments a WHERE a.status = 'completed' LIMIT 3;

-- 18. Activity logs (entity_id as UUID)
INSERT INTO activity_logs (action, entity_type, entity_id, user_id, details) VALUES
('login', 'user', 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353', '{"ip": "189.0.0.1", "device": "Chrome"}'),
('appointment_created', 'appointment', gen_random_uuid(), '4b519355-680b-49ef-9966-102d75fac2a2', '{"doctor": "Dr. Gustavo"}'),
('prescription_created', 'prescription', gen_random_uuid(), 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353', '{"patient": "Paciente"}'),
('user_approved', 'doctor', 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353', '{"crm": "CRM-12345"}'),
('payment_confirmed', 'appointment', gen_random_uuid(), 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353', '{"amount": 120.00}');

-- 19. Support tickets
INSERT INTO support_tickets (patient_id, subject, status, priority) VALUES
('4b519355-680b-49ef-9966-102d75fac2a2', 'Não consigo acessar minha prescrição', 'open', 'high'),
('29343cb2-8133-4903-bda8-309b23390493', 'Dúvida sobre plano Premium', 'open', 'medium'),
('4b519355-680b-49ef-9966-102d75fac2a2', 'Problema com vídeo', 'closed', 'high');

-- 20. Support messages
INSERT INTO support_messages (ticket_id, sender_id, sender_role, content)
SELECT st.id, st.patient_id, 'patient', 'Olá, preciso de ajuda urgente.'
FROM support_tickets st LIMIT 2;

-- 21. Dependents
INSERT INTO dependents (user_id, name, relationship, date_of_birth, cpf) VALUES
('4b519355-680b-49ef-9966-102d75fac2a2', 'Maria Silva', 'spouse', '1990-05-15', '123.456.789-00'),
('4b519355-680b-49ef-9966-102d75fac2a2', 'João Silva Jr', 'child', '2015-08-20', null);

-- 22. Coupons
INSERT INTO coupons (code, discount_percentage, is_active, max_uses, times_used, expires_at, created_by) VALUES
('BEMVINDO10', 10, true, 100, 5, now() + interval '90 days', 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353'),
('SAUDE20', 20, true, 50, 2, now() + interval '30 days', 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353'),
('PROMO50', 50, false, 10, 10, now() - interval '5 days', 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353');

-- 23. Credits
INSERT INTO user_credits (user_id, amount, reason) VALUES
('4b519355-680b-49ef-9966-102d75fac2a2', 25.00, 'Bônus de cadastro'),
('4b519355-680b-49ef-9966-102d75fac2a2', -10.00, 'Desconto em consulta'),
('29343cb2-8133-4903-bda8-309b23390493', 50.00, 'Indicação convertida');

-- 24. Withdrawals
INSERT INTO withdrawal_requests (user_id, amount, pix_key, status) VALUES
('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 350.00, 'plenasaudebv@gmail.com', 'pending'),
('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 500.00, 'plenasaudebv@gmail.com', 'approved');
