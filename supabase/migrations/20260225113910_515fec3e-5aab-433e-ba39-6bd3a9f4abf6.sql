
-- =============================================
-- TELELAUDO: Tabelas, Bucket e RLS
-- =============================================

-- 1. Tabela exam_requests (Solicitações de exame para laudo)
CREATE TABLE public.exam_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id uuid,
  requesting_doctor_id uuid NOT NULL REFERENCES public.doctor_profiles(id),
  exam_type text NOT NULL,
  clinical_info text,
  file_urls jsonb NOT NULL DEFAULT '[]'::jsonb,
  status text NOT NULL DEFAULT 'pending',
  priority text NOT NULL DEFAULT 'normal',
  assigned_to uuid REFERENCES public.doctor_profiles(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 2. Tabela exam_reports (Laudos)
CREATE TABLE public.exam_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  exam_request_id uuid NOT NULL REFERENCES public.exam_requests(id) ON DELETE CASCADE,
  reporter_id uuid NOT NULL REFERENCES public.doctor_profiles(id),
  content_text text NOT NULL DEFAULT '',
  template_id uuid,
  pdf_url text,
  document_hash text,
  verification_code text,
  signed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- 3. Tabela report_templates (Modelos de laudo)
CREATE TABLE public.report_templates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  exam_type text NOT NULL,
  body_text text NOT NULL DEFAULT '',
  created_by uuid NOT NULL,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 4. Bucket exam-files (privado)
INSERT INTO storage.buckets (id, name, public) VALUES ('exam-files', 'exam-files', false);

-- 5. Triggers de updated_at
CREATE TRIGGER update_exam_requests_updated_at
  BEFORE UPDATE ON public.exam_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_exam_reports_updated_at
  BEFORE UPDATE ON public.exam_reports
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- =============================================
-- RLS: exam_requests
-- =============================================
ALTER TABLE public.exam_requests ENABLE ROW LEVEL SECURITY;

-- Médico solicitante vê os próprios
CREATE POLICY "Requesting doctor can view own exam requests"
  ON public.exam_requests FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.id = exam_requests.requesting_doctor_id
        AND doctor_profiles.user_id = auth.uid()
    )
  );

-- Laudistas veem pendentes ou atribuídos a si
CREATE POLICY "Reporting doctors can view pending/assigned exams"
  ON public.exam_requests FOR SELECT
  TO authenticated
  USING (
    status IN ('pending', 'in_review')
    AND EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.user_id = auth.uid()
    )
  );

-- Admin vê tudo
CREATE POLICY "Admins can view all exam requests"
  ON public.exam_requests FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Médicos podem criar solicitações
CREATE POLICY "Doctors can create exam requests"
  ON public.exam_requests FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.id = exam_requests.requesting_doctor_id
        AND doctor_profiles.user_id = auth.uid()
    )
  );

-- Médicos podem atualizar (assumir, mudar status)
CREATE POLICY "Doctors can update exam requests"
  ON public.exam_requests FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.id = exam_requests.requesting_doctor_id
        AND doctor_profiles.user_id = auth.uid()
    )
    OR (
      assigned_to IS NOT NULL AND EXISTS (
        SELECT 1 FROM public.doctor_profiles
        WHERE doctor_profiles.id = exam_requests.assigned_to
          AND doctor_profiles.user_id = auth.uid()
      )
    )
    OR public.is_admin()
  );

-- Qualquer médico pode assumir um exame pendente (update assigned_to)
CREATE POLICY "Any doctor can claim pending exam requests"
  ON public.exam_requests FOR UPDATE
  TO authenticated
  USING (
    status = 'pending'
    AND EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.user_id = auth.uid()
    )
  );

-- =============================================
-- RLS: exam_reports
-- =============================================
ALTER TABLE public.exam_reports ENABLE ROW LEVEL SECURITY;

-- Laudista autor pode ver
CREATE POLICY "Reporter can view own reports"
  ON public.exam_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.id = exam_reports.reporter_id
        AND doctor_profiles.user_id = auth.uid()
    )
  );

-- Médico solicitante pode ver o laudo do seu exame
CREATE POLICY "Requesting doctor can view exam reports"
  ON public.exam_reports FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.exam_requests er
      JOIN public.doctor_profiles dp ON dp.id = er.requesting_doctor_id
      WHERE er.id = exam_reports.exam_request_id
        AND dp.user_id = auth.uid()
    )
  );

-- Admin vê tudo
CREATE POLICY "Admins can view all exam reports"
  ON public.exam_reports FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Laudista pode criar laudo
CREATE POLICY "Doctors can create exam reports"
  ON public.exam_reports FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.id = exam_reports.reporter_id
        AND doctor_profiles.user_id = auth.uid()
    )
  );

-- Laudista pode atualizar próprio laudo
CREATE POLICY "Reporter can update own reports"
  ON public.exam_reports FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.id = exam_reports.reporter_id
        AND doctor_profiles.user_id = auth.uid()
    )
    OR public.is_admin()
  );

-- =============================================
-- RLS: report_templates
-- =============================================
ALTER TABLE public.report_templates ENABLE ROW LEVEL SECURITY;

-- Qualquer médico pode ler templates ativos
CREATE POLICY "Doctors can view active report templates"
  ON public.report_templates FOR SELECT
  TO authenticated
  USING (
    is_active = true
    AND EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.user_id = auth.uid()
    )
  );

-- Admin vê todos (inclusive inativos)
CREATE POLICY "Admins can view all report templates"
  ON public.report_templates FOR SELECT
  TO authenticated
  USING (public.is_admin());

-- Médicos podem criar templates
CREATE POLICY "Doctors can create report templates"
  ON public.report_templates FOR INSERT
  TO authenticated
  WITH CHECK (
    created_by = auth.uid()
    AND EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.user_id = auth.uid()
    )
  );

-- Autor ou admin pode atualizar
CREATE POLICY "Template owner or admin can update"
  ON public.report_templates FOR UPDATE
  TO authenticated
  USING (created_by = auth.uid() OR public.is_admin());

-- Admin pode deletar
CREATE POLICY "Admins can delete report templates"
  ON public.report_templates FOR DELETE
  TO authenticated
  USING (public.is_admin() OR created_by = auth.uid());

-- =============================================
-- Storage RLS: exam-files bucket
-- =============================================

-- Médicos podem fazer upload
CREATE POLICY "Doctors can upload exam files"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'exam-files'
    AND EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.user_id = auth.uid()
    )
  );

-- Médicos podem visualizar arquivos de exames
CREATE POLICY "Doctors can view exam files"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'exam-files'
    AND EXISTS (
      SELECT 1 FROM public.doctor_profiles
      WHERE doctor_profiles.user_id = auth.uid()
    )
  );
