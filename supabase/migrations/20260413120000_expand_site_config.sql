-- Expand site_config with landing CMS keys (hero, entry cards, how it works, pricing copy, doctors section, featured specialties).
-- Safe to re-run: uses ON CONFLICT DO NOTHING on (key).

INSERT INTO public.site_config (key, value, category, label, input_type)
VALUES
  -- Hero extras (title/subtitle already exist in category 'landing' in seed data; these are safe no-ops if already present)
  ('hero_cta_primary_text', 'Agendar consulta', 'landing', 'Hero — CTA primário (texto)', 'text'),
  ('hero_cta_primary_url',  '/paciente',        'landing', 'Hero — CTA primário (URL)',  'url'),
  ('hero_cta_secondary_text','Consulta avulsa', 'landing', 'Hero — CTA secundário (texto)', 'text'),
  ('hero_cta_secondary_url', '/paciente',       'landing', 'Hero — CTA secundário (URL)',   'url'),

  -- Entry cards: JSON array of {title, description, icon, href, color_from, color_to}
  ('entry_cards',
   '[{"title":"Consulta Médica Online","description":"Fale por vídeo com médicos de diversas especialidades.","icon":"Stethoscope","cta":"Agendar agora","href":"/dashboard/doctors?type=telemedicina","color_from":"from-primary/10","color_to":"to-primary/5"},{"title":"Consulta Oftalmológica","description":"Avaliação com oftalmologista e teste de visão online.","icon":"Eye","cta":"Ver oftalmologistas","href":"/dashboard/doctors?type=oftalmologia","color_from":"from-blue-500/10","color_to":"to-blue-500/5"},{"title":"Sou clínica e quero enviar exame para laudo","description":"Envie exames e receba laudos de médicos especialistas.","icon":"Building2","cta":"Enviar exame","href":"/clinica/enviar-exame","color_from":"from-emerald-500/10","color_to":"to-emerald-500/5","isClinic":true}]',
   'cards', 'Cards de entrada (JSON)', 'textarea'),

  -- How it works steps: JSON array of {step, title, desc}
  ('how_it_works_title', 'Como funciona', 'secoes', 'Como funciona — Título', 'text'),
  ('how_it_works_desc',  'Em 4 passos simples, acesse médicos especialistas sem sair de casa.', 'secoes', 'Como funciona — Descrição', 'textarea'),
  ('how_it_works_steps',
   '[{"step":1,"title":"Cadastre-se","desc":"Crie sua conta em menos de 2 minutos.","time":"2 min"},{"step":2,"title":"Encontre seu médico","desc":"Busque por especialidade ou disponibilidade.","time":"1 min"},{"step":3,"title":"Consulta por vídeo","desc":"Videochamada segura e em HD.","time":"15-30 min"},{"step":4,"title":"Receba sua receita","desc":"Receita digital válida na hora.","time":"Instantâneo"}]',
   'secoes', 'Como funciona — Passos (JSON)', 'textarea'),

  -- Pricing section copy (plans themselves live in public.plans)
  ('pricing_title',    'Cuidado médico ao alcance de todos', 'secoes', 'Planos — Título', 'text'),
  ('pricing_subtitle', 'Escolha o plano ideal para você. Sem carência, sem burocracia.', 'secoes', 'Planos — Subtítulo', 'textarea'),
  ('pricing_badge',    'Planos & Preços', 'secoes', 'Planos — Badge', 'text'),

  -- Doctors / featured specialties
  ('section_doctors_title', 'Médicos especialistas verificados', 'secoes', 'Médicos — Título', 'text'),
  ('section_doctors_desc',  'Conheça nossos profissionais regulamentados pelo CFM.', 'secoes', 'Médicos — Descrição', 'textarea'),
  ('featured_specialties',
   '["Cardiologia","Dermatologia","Endocrinologia","Neurologia","Oftalmologia","Ortopedia","Pediatria","Clínica Geral"]',
   'secoes', 'Especialidades em destaque (JSON array)', 'textarea')
ON CONFLICT (key) DO NOTHING;

-- Also ensure hero_title / hero_subtitle rows exist (if older seed missed them)
INSERT INTO public.site_config (key, value, category, label, input_type)
VALUES
  ('hero_title',    'Sua saúde na palma da mão', 'landing', 'Hero — Título',    'text'),
  ('hero_subtitle', 'Conecte-se a médicos especialistas verificados pelo CFM. Consultas por vídeo em HD, receitas digitais válidas e prontuário eletrônico completo.', 'landing', 'Hero — Subtítulo', 'textarea')
ON CONFLICT (key) DO NOTHING;
