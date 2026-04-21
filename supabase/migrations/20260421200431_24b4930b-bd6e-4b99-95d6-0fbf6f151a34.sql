-- Update Hero schema to include secondary CTA
UPDATE public.site_sections 
SET schema = '{
    "fields": [
        {"key": "title", "label": "Título", "type": "text"},
        {"key": "subtitle", "label": "Subtítulo", "type": "textarea"},
        {"key": "cta_text", "label": "Texto do Botão Primário", "type": "text"},
        {"key": "cta_url", "label": "Link do Botão Primário", "type": "url"},
        {"key": "cta_secondary_text", "label": "Texto do Botão Secundário", "type": "text"},
        {"key": "cta_secondary_url", "label": "Link do Botão Secundário", "type": "url"},
        {"key": "badge_text", "label": "Texto do Selo", "type": "text"},
        {"key": "image_url", "label": "Imagem", "type": "image"}
    ]
}'
WHERE key = 'hero';

-- Insert Specialties section
INSERT INTO public.site_sections (key, display_name, display_order, config, schema)
VALUES 
(
    'specialties', 
    'Especialidades', 
    40, 
    '{
        "title": "Especialidades mais buscadas",
        "subtitle": "Selecione a especialidade para ver os profissionais disponíveis para agendamento."
    }',
    '{
        "fields": [
            {"key": "title", "label": "Título", "type": "text"},
            {"key": "subtitle", "label": "Subtítulo", "type": "textarea"}
        ]
    }'
) ON CONFLICT (key) DO UPDATE SET schema = EXCLUDED.schema, display_order = EXCLUDED.display_order;

-- Insert Technology section
INSERT INTO public.site_sections (key, display_name, display_order, config, schema)
VALUES 
(
    'technology', 
    'Tecnologia', 
    30, 
    '{
        "title": "Tecnologia de ponta a seu favor",
        "subtitle": "Utilizamos as melhores ferramentas do mercado para garantir a segurança e agilidade no seu atendimento."
    }',
    '{
        "fields": [
            {"key": "title", "label": "Título", "type": "text"},
            {"key": "subtitle", "label": "Subtítulo", "type": "textarea"}
        ]
    }'
) ON CONFLICT (key) DO UPDATE SET schema = EXCLUDED.schema, display_order = EXCLUDED.display_order;
