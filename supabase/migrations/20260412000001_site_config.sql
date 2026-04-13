-- Site configuration table for full platform customization
-- Admins can edit all site settings without code changes

create table if not exists public.site_config (
  id uuid primary key default gen_random_uuid(),
  key text not null unique,
  value text,
  category text not null default 'geral',
  label text not null,
  input_type text not null default 'text',  -- text | textarea | color | boolean | url | number
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id)
);

-- Default seed values
insert into public.site_config (key, value, category, label, input_type) values
  -- Geral
  ('site_name',            'AlôMédico',                        'geral',      'Nome do site',            'text'),
  ('site_description',     'Plataforma de telemedicina',        'geral',      'Descrição',               'textarea'),
  ('contact_email',        'contato@alomedico.com',             'geral',      'E-mail de contato',       'text'),
  ('contact_phone',        '',                                  'geral',      'Telefone de contato',     'text'),
  ('whatsapp_number',      '',                                  'geral',      'WhatsApp',                'text'),
  ('logo_url',             '',                                  'geral',      'URL do logotipo',         'url'),
  ('favicon_url',          '',                                  'geral',      'URL do favicon',          'url'),

  -- Landing Page
  ('hero_title',           'Saúde ao alcance de todos',         'landing',    'Título principal (hero)', 'text'),
  ('hero_subtitle',        'Consulte um médico online agora',   'landing',    'Subtítulo hero',          'textarea'),
  ('hero_cta_text',        'Consultar agora',                   'landing',    'Texto do botão CTA',      'text'),
  ('hero_image_url',       '',                                  'landing',    'Imagem do hero (URL)',    'url'),
  ('hero_video_url',       '',                                  'landing',    'Vídeo de fundo (URL)',    'url'),

  -- Seções (visibility toggles)
  ('section_features',     'true',                              'secoes',     'Seção de funcionalidades','boolean'),
  ('section_testimonials', 'true',                              'secoes',     'Seção de depoimentos',    'boolean'),
  ('section_pricing',      'true',                              'secoes',     'Seção de preços/planos',  'boolean'),
  ('section_stats',        'true',                              'secoes',     'Seção de estatísticas',   'boolean'),
  ('section_faq',          'true',                              'secoes',     'Seção de FAQ',            'boolean'),
  ('section_cta_banner',   'true',                              'secoes',     'Banner CTA inferior',     'boolean'),

  -- Aparência
  ('color_primary',        '#0ea5e9',                           'aparencia',  'Cor primária',            'color'),
  ('color_secondary',      '#6366f1',                           'aparencia',  'Cor secundária',          'color'),
  ('color_accent',         '#10b981',                           'aparencia',  'Cor de destaque',         'color'),
  ('border_radius',        '12',                                'aparencia',  'Arredondamento (px)',     'number'),

  -- SEO
  ('seo_title',            'AlôMédico - Telemedicina',          'seo',        'Meta title',              'text'),
  ('seo_description',      'Consulte médicos online com facilidade', 'seo',   'Meta description',        'textarea'),
  ('seo_og_image_url',     '',                                  'seo',        'OG Image (URL)',          'url'),
  ('seo_keywords',         'telemedicina, médico online',       'seo',        'Keywords (separadas por vírgula)', 'text'),

  -- Integrações / Feature Flags
  ('feature_memed',        'true',                              'integracoes','Prescrição MeMed habilitada', 'boolean'),
  ('feature_whatsapp',     'false',                             'integracoes','WhatsApp habilitado',     'boolean'),
  ('feature_face_id',      'false',                             'integracoes','Reconhecimento facial',   'boolean'),
  ('maintenance_mode',     'false',                             'integracoes','Modo manutenção',         'boolean'),
  ('maintenance_message',  'Sistema em manutenção. Voltamos em breve.', 'integracoes', 'Mensagem manutenção', 'textarea')

on conflict (key) do nothing;

-- RLS
alter table public.site_config enable row level security;

-- Public read
create policy "site_config_public_read"
  on public.site_config for select
  using (true);

-- Admin write only
create policy "site_config_admin_write"
  on public.site_config for all
  using (
    exists (
      select 1 from public.user_roles
      where user_id = auth.uid() and role = 'admin'
    )
  );

-- Update timestamp trigger
create or replace function public.update_site_config_timestamp()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  new.updated_by = auth.uid();
  return new;
end;
$$;

create trigger site_config_updated
  before update on public.site_config
  for each row execute function public.update_site_config_timestamp();
