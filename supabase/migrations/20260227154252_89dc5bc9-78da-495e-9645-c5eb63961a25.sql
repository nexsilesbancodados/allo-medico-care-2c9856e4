
-- Create exames table for the telelaudo workspace
CREATE TABLE IF NOT EXISTS public.exames (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  paciente_nome TEXT NOT NULL,
  study_uid TEXT,
  status TEXT NOT NULL DEFAULT 'pendente',
  laudo_texto TEXT DEFAULT '',
  arquivo_url TEXT,
  laudista_id UUID,
  assinado_em TIMESTAMPTZ,
  pdf_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.exames ENABLE ROW LEVEL SECURITY;

-- RLS policies - doctors, admin, laudistas can access
CREATE POLICY "Authenticated users can view exames"
  ON public.exames FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert exames"
  ON public.exames FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update exames"
  ON public.exames FOR UPDATE
  USING (auth.uid() IS NOT NULL);

-- Trigger for updated_at
CREATE TRIGGER update_exames_updated_at
  BEFORE UPDATE ON public.exames
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create dicom-bucket for DICOM file storage
INSERT INTO storage.buckets (id, name, public)
VALUES ('dicom-bucket', 'dicom-bucket', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for dicom-bucket
CREATE POLICY "Auth users can read dicom files"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'dicom-bucket' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can upload dicom files"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'dicom-bucket' AND auth.uid() IS NOT NULL);

CREATE POLICY "Auth users can update dicom files"
  ON storage.objects FOR UPDATE
  USING (bucket_id = 'dicom-bucket' AND auth.uid() IS NOT NULL);
