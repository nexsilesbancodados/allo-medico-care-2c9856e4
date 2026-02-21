
-- Assign all roles to existing users for testing
-- Admin (plenasaudebv@gmail.com) - already has: admin, patient, doctor, clinic, affiliate
INSERT INTO user_roles (user_id, role) VALUES
('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 'receptionist'),
('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 'support'),
('a5c1ac9a-5368-4429-83a0-85e2b3d4a353', 'partner')
ON CONFLICT DO NOTHING;

-- lopesgustavo4377@gmail.com - patient + doctor + affiliate
INSERT INTO user_roles (user_id, role) VALUES
('29343cb2-8133-4903-bda8-309b23390493', 'doctor'),
('29343cb2-8133-4903-bda8-309b23390493', 'affiliate')
ON CONFLICT DO NOTHING;

-- Create doctor profile for second user
INSERT INTO doctor_profiles (user_id, crm, crm_state, crm_verified, is_approved, bio, consultation_price, experience_years, education, rating, total_reviews, available_now)
VALUES ('29343cb2-8133-4903-bda8-309b23390493', 'CRM-67890', 'RR', true, true, 'Pediatra com 8 anos de experiência.', 100.00, 8, 'UFRR - Medicina', 4.5, 18, true)
ON CONFLICT DO NOTHING;

-- Doctor specialties for second doctor
INSERT INTO doctor_specialties (doctor_id, specialty_id)
SELECT dp.id, s.id FROM doctor_profiles dp, specialties s
WHERE dp.user_id = '29343cb2-8133-4903-bda8-309b23390493' AND s.name IN ('Pediatria', 'Clínico Geral')
ON CONFLICT DO NOTHING;

-- plenasaudebv22@gmail.com already has partner role
INSERT INTO user_roles (user_id, role) VALUES
('acdce72a-ee6f-4573-8760-2e7f24e2da97', 'support'),
('acdce72a-ee6f-4573-8760-2e7f24e2da97', 'receptionist')
ON CONFLICT DO NOTHING;
