-- Adjust existing table structure
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_sections' AND column_name = 'section_key') THEN
        ALTER TABLE public.site_sections RENAME COLUMN section_key TO key;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_sections' AND column_name = 'title') THEN
        ALTER TABLE public.site_sections RENAME COLUMN title TO display_name;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_sections' AND column_name = 'content') THEN
        ALTER TABLE public.site_sections RENAME COLUMN content TO config;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'site_sections' AND column_name = 'is_visible') THEN
        ALTER TABLE public.site_sections RENAME COLUMN is_visible TO is_enabled;
    END IF;
END $$;

ALTER TABLE public.site_sections ADD COLUMN IF NOT EXISTS schema JSONB NOT NULL DEFAULT '{}'::jsonb;

-- Clear and Seed
TRUNCATE public.site_sections;

INSERT INTO public.site_sections (key, display_name, display_order, config, schema)
VALUES 
(
    'header', 
    'Cabeçalho', 
    10, 
    '{
        "logo_url": "/pwa-192x192.png",
        "menu_items": [
            {"label": "Início", "url": "/"},
            {"label": "Especialidades", "url": "/especialidades"},
            {"label": "Para Médicos", "url": "/profissionais"},
            {"label": "Ajuda", "url": "/faq"}
        ]
    }',
    '{
        "fields": [
            {"key": "logo_url", "label": "URL do Logo", "type": "image"},
            {
                "key": "menu_items", 
                "label": "Itens do Menu", 
                "type": "array",
                "item_schema": {
                    "fields": [
                        {"key": "label", "label": "Rótulo", "type": "text"},
                        {"key": "url", "label": "Link", "type": "url"}
                    ]
                }
            }
        ]
    }'
),
(
    'hero', 
    'Hero (Banner Principal)', 
    20, 
    '{
        "title": "Cuidado médico de excelência",
        "subtitle": "Conecte-se a médicos especialistas verificados pelo CFM. Consultas por vídeo em HD, receitas digitais válidas e prontuário eletrônico completo.",
        "cta_text": "Agendar consulta",
        "cta_url": "/agendar",
        "badge_text": "Médicos disponíveis agora",
        "image_url": "https://cvbgrjauqjawrsyknhyj.supabase.co/storage/v1/object/public/files/uploads/0XILPRqqUbSOh99ow53X5OBDOCC3/1776788772275-bngbf-hero-doctor__4_-removebg-preview.png"
    }',
    '{
        "fields": [
            {"key": "title", "label": "Título", "type": "text"},
            {"key": "subtitle", "label": "Subtítulo", "type": "textarea"},
            {"key": "cta_text", "label": "Texto do Botão", "type": "text"},
            {"key": "cta_url", "label": "Link do Botão", "type": "url"},
            {"key": "badge_text", "label": "Texto do Selo", "type": "text"},
            {"key": "image_url", "label": "Imagem", "type": "image"}
        ]
    }'
),
(
    'testimonials', 
    'Depoimentos', 
    50, 
    '{
        "title": "O que nossos pacientes estão dizendo",
        "subtitle": "Depoimentos reais de quem já utilizou nossa plataforma",
        "reviews": [
            {"name": "Maria Fernanda", "city": "São Paulo, SP", "text": "Consultar pela AloClínica mudou minha vida. Recebi atendimento excelente do cardiologista sem sair de casa.", "specialty": "Cardiologia"},
            {"name": "João Carlos", "city": "Recife, PE", "text": "Moro no interior e finalmente consegui consultar com um dermatologista. A receita digital funcionou perfeitamente.", "specialty": "Dermatologia"},
            {"name": "Ana Beatriz", "city": "Belo Horizonte, MG", "text": "Atendimento rápido, médica muito atenciosa e a plataforma é super fácil de usar.", "specialty": "Clínico Geral"}
        ]
    }',
    '{
        "fields": [
            {"key": "title", "label": "Título", "type": "text"},
            {"key": "subtitle", "label": "Subtítulo", "type": "text"},
            {
                "key": "reviews", 
                "label": "Lista de Depoimentos", 
                "type": "array",
                "item_schema": {
                    "fields": [
                        {"key": "name", "label": "Nome", "type": "text"},
                        {"key": "city", "label": "Cidade/UF", "type": "text"},
                        {"key": "specialty", "label": "Especialidade", "type": "text"},
                        {"key": "text", "label": "Texto do Depoimento", "type": "textarea"}
                    ]
                }
            }
        ]
    }'
),
(
    'footer', 
    'Rodapé', 
    100, 
    '{
        "copyright": "© 2024 AloClínica. Todos os direitos reservados.",
        "social_links": [
            {"platform": "Instagram", "url": "https://instagram.com/aloclinica"},
            {"platform": "Facebook", "url": "https://facebook.com/aloclinica"}
        ]
    }',
    '{
        "fields": [
            {"key": "copyright", "label": "Texto de Copyright", "type": "text"},
            {
                "key": "social_links", 
                "label": "Redes Sociais", 
                "type": "array",
                "item_schema": {
                    "fields": [
                        {"key": "platform", "label": "Plataforma", "type": "text"},
                        {"key": "url", "label": "Link", "type": "url"}
                    ]
                }
            }
        ]
    }'
);
