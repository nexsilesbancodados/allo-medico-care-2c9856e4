-- Content tables for full platform editability via AdminSiteConfig
-- Testimonials, FAQ items, and extra site_config entries

-- ── Testimonials ──────────────────────────────────────────────────────────────
create table if not exists public.testimonials (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  company text,
  avatar_url text,
  text text not null,
  rating smallint not null default 5 check (rating between 1 and 5),
  is_active boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.testimonials enable row level security;

create policy "testimonials_public_read"
  on public.testimonials for select using (true);

create policy "testimonials_admin_write"
  on public.testimonials for all
  using (exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ));

-- Seed sample testimonials
insert into public.testimonials (name, role, text, rating, order_index) values
  ('Ana Souza',   'Paciente',   'Atendimento incrível! Consulta rápida e médico muito atencioso.', 5, 1),
  ('João Mendes', 'Paciente',   'Muito prático poder consultar pelo celular. Recomendo!',           5, 2),
  ('Carla Lima',  'Paciente',   'A plataforma é fácil de usar e os médicos são excelentes.',         5, 3)
on conflict do nothing;

-- ── FAQ Items ─────────────────────────────────────────────────────────────────
create table if not exists public.faq_items (
  id uuid primary key default gen_random_uuid(),
  question text not null,
  answer text not null,
  category text default 'geral',
  is_active boolean not null default true,
  order_index integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.faq_items enable row level security;

create policy "faq_public_read"
  on public.faq_items for select using (true);

create policy "faq_admin_write"
  on public.faq_items for all
  using (exists (
    select 1 from public.user_roles
    where user_id = auth.uid() and role = 'admin'
  ));

-- Seed sample FAQ
insert into public.faq_items (question, answer, category, order_index) values
  ('Como funciona a telemedicina?',  'Você agenda uma consulta online, aguarda o horário e entra na videochamada com o médico diretamente pela plataforma.', 'geral', 1),
  ('Quanto tempo dura a consulta?',  'A duração padrão é de 30 minutos, podendo variar conforme o médico e a especialidade.', 'geral', 2),
  ('Como é feito o pagamento?',      'Aceitamos PIX, cartão de crédito e boleto bancário. O pagamento é feito antes da consulta.', 'pagamento', 3),
  ('Posso cancelar uma consulta?',   'Sim, consultas podem ser canceladas com até 2 horas de antecedência sem cobrança.', 'cancelamento', 4),
  ('O médico pode emitir receita?',  'Sim, o médico pode emitir receita digital com validade legal durante a consulta.', 'receita', 5)
on conflict do nothing;

-- ── Extra site_config keys ────────────────────────────────────────────────────
insert into public.site_config (key, value, category, label, input_type) values
  -- Social media
  ('social_instagram',  '',  'geral', 'Instagram (URL)',        'url'),
  ('social_facebook',   '',  'geral', 'Facebook (URL)',         'url'),
  ('social_twitter',    '',  'geral', 'Twitter/X (URL)',        'url'),
  ('social_linkedin',   '',  'geral', 'LinkedIn (URL)',         'url'),
  ('social_youtube',    '',  'geral', 'YouTube (URL)',          'url'),

  -- Landing stats
  ('stat_1_value', '10k+',       'landing', 'Estatística 1 — Número',  'text'),
  ('stat_1_label', 'Pacientes',  'landing', 'Estatística 1 — Rótulo',  'text'),
  ('stat_2_value', '500+',       'landing', 'Estatística 2 — Número',  'text'),
  ('stat_2_label', 'Médicos',    'landing', 'Estatística 2 — Rótulo',  'text'),
  ('stat_3_value', '4.9',        'landing', 'Estatística 3 — Número',  'text'),
  ('stat_3_label', 'Avaliação',  'landing', 'Estatística 3 — Rótulo',  'text'),
  ('stat_4_value', '24h',        'landing', 'Estatística 4 — Número',  'text'),
  ('stat_4_label', 'Disponível', 'landing', 'Estatística 4 — Rótulo',  'text'),

  -- Footer
  ('footer_text',     '© 2026 AlôMédico. Todos os direitos reservados.', 'geral', 'Texto do rodapé',  'text'),
  ('footer_tagline',  'Saúde ao alcance de todos.',                       'geral', 'Tagline do rodapé','text'),

  -- Extra landing
  ('landing_badge_text',   'Telemedicina',  'landing', 'Badge sobre o título',     'text'),
  ('landing_second_cta',   'Saiba mais',    'landing', 'Texto do 2.º botão CTA',   'text')

on conflict (key) do nothing;
