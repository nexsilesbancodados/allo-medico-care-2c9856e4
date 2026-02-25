
-- Seed: Plans (with valid UUIDs)
INSERT INTO plans (id, name, description, price, interval, is_active, max_appointments, features) VALUES
  ('a1b2c3d4-1001-4000-8000-000000000001', 'Consulta Avulsa', 'Ideal para quem precisa de atendimento pontual', 89, 'one_time', true, 1, '["1 consulta por videochamada","Receita digital inclusa","Chat pós-consulta (48h)","Escolha de especialidade"]'),
  ('a1b2c3d4-1002-4000-8000-000000000002', 'Plano Mensal', 'Acesso ilimitado para cuidar da saúde da família', 149, 'monthly', true, null, '["Consultas ilimitadas","Receitas digitais ilimitadas","Chat ilimitado com médicos","Prioridade no agendamento","Prontuário digital completo","Acesso para até 4 dependentes"]'),
  ('a1b2c3d4-1003-4000-8000-000000000003', 'Plano Família+', 'Cobertura completa para toda a família', 249, 'monthly', true, null, '["Tudo do Plano Mensal","Até 6 dependentes","Plantão 24h com desconto","Renovação de receita com desconto","Prioridade máxima no agendamento","Suporte prioritário"]')
ON CONFLICT (id) DO NOTHING;

-- Seed: Health Tips
INSERT INTO health_tips (title, content, category, icon, is_active) VALUES
  ('Hidratação é Essencial', 'Beba pelo menos 2 litros de água por dia. A hidratação adequada melhora a concentração, disposição e funcionamento dos rins.', 'general', '💧', true),
  ('Durma Bem', 'Adultos precisam de 7 a 9 horas de sono por noite. Uma boa noite de sono fortalece o sistema imunológico e melhora a memória.', 'general', '😴', true),
  ('Exercício Regular', 'Pelo menos 150 minutos de atividade física moderada por semana reduzem o risco de doenças cardíacas em até 30%.', 'fitness', '🏃', true),
  ('Alimentação Balanceada', 'Inclua frutas, legumes e verduras em todas as refeições. Uma dieta rica em fibras ajuda na digestão e no controle do colesterol.', 'nutrition', '🥗', true),
  ('Saúde Mental Importa', 'Tire momentos do dia para respirar fundo e relaxar. A meditação de 10 minutos por dia pode reduzir significativamente a ansiedade.', 'mental_health', '🧘', true),
  ('Proteção Solar', 'Use protetor solar FPS 30 ou superior diariamente, mesmo em dias nublados. A radiação UV é a principal causa de câncer de pele.', 'dermatology', '☀️', true),
  ('Check-up Anual', 'Realizar exames de rotina anualmente permite detectar doenças precocemente, quando o tratamento é mais eficaz.', 'general', '🩺', true),
  ('Lave as Mãos', 'Lavar as mãos com água e sabão por 20 segundos elimina até 99% das bactérias e previne infecções.', 'hygiene', '🧼', true),
  ('Pressão Arterial', 'Meça sua pressão arterial regularmente. A hipertensão é silenciosa e afeta 1 em cada 4 adultos brasileiros.', 'cardiology', '❤️', true),
  ('Vacinação em Dia', 'Mantenha seu calendário de vacinação atualizado. Vacinas protegem você e toda a comunidade contra doenças graves.', 'general', '💉', true);
