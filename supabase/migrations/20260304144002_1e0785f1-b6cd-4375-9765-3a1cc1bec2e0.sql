
-- Deactivate old plans instead of deleting
UPDATE plans SET is_active = false;

-- Insert the correct plans
INSERT INTO plans (name, price, interval, description, features, is_active, max_appointments) VALUES
  ('Solitário', 37.90, 'monthly', 'Plano completo para uso individual.', '["Telemedicina 24h ilimitada", "Clube de Vantagens", "Assistência Funeral Nacional", "30% de desconto em serviços avulsos", "Prontuário digital completo"]', true, null),
  ('Mini Família', 47.90, 'monthly', 'Telemedicina 24h para toda a família.', '["Telemedicina 24h ilimitada", "Clube de Vantagens", "30% de desconto em serviços avulsos", "Receitas digitais ilimitadas", "Dependentes inclusos"]', true, null),
  ('King Família', 77.90, 'monthly', 'Cobertura completa para a família.', '["Tudo do Solitário", "Dependentes inclusos", "Prioridade no agendamento", "Chat ilimitado com médicos", "30% de desconto em serviços"]', true, null),
  ('Prime Família', 157.90, 'monthly', 'O plano mais completo da plataforma.', '["Tudo do King Família", "Assistência Funeral Nacional", "Suporte prioritário 24h", "Consultas de retorno ilimitadas", "Prontuário familiar unificado"]', true, null);
