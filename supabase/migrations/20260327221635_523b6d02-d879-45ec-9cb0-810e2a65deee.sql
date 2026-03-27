
-- Add missing columns to exames table for clinic exam upload flow
ALTER TABLE public.exames ADD COLUMN IF NOT EXISTS clinica_id uuid;
ALTER TABLE public.exames ADD COLUMN IF NOT EXISTS paciente_id uuid;
ALTER TABLE public.exames ADD COLUMN IF NOT EXISTS tipo_exame text NOT NULL DEFAULT 'Outro';
ALTER TABLE public.exames ADD COLUMN IF NOT EXISTS origem text NOT NULL DEFAULT 'upload';
ALTER TABLE public.exames ADD COLUMN IF NOT EXISTS orthanc_study_uid text;
ALTER TABLE public.exames ADD COLUMN IF NOT EXISTS observacoes text;
ALTER TABLE public.exames ADD COLUMN IF NOT EXISTS lembrete_enviado boolean DEFAULT false;

-- Create storage bucket for exam files
INSERT INTO storage.buckets (id, name, public)
VALUES ('exames', 'exames', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS policies for exames bucket
CREATE POLICY "Authenticated users can upload exams"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'exames');

CREATE POLICY "Authenticated users can view exams"
ON storage.objects FOR SELECT TO authenticated
USING (bucket_id = 'exames');

-- RLS policies for exames table (additional for clinic flow)
CREATE POLICY "clinica_ve_proprios_exames" ON public.exames
FOR SELECT TO authenticated
USING (auth.uid() = clinica_id);

CREATE POLICY "clinica_insere_exames" ON public.exames
FOR INSERT TO authenticated
WITH CHECK (auth.uid() = clinica_id);

CREATE POLICY "laudista_ve_exames" ON public.exames
FOR SELECT TO authenticated
USING (auth.uid() = laudista_id);

CREATE POLICY "laudista_atualiza_exames" ON public.exames
FOR UPDATE TO authenticated
USING (auth.uid() = laudista_id);

CREATE POLICY "admin_ve_todos_exames" ON public.exames
FOR ALL TO authenticated
USING (public.is_admin());
