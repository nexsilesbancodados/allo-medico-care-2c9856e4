
CREATE TABLE public.kyc_verificacoes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  status TEXT NOT NULL DEFAULT 'pendente' CHECK (status IN ('pendente', 'aprovado', 'reprovado')),
  similarity REAL,
  tipo TEXT NOT NULL DEFAULT 'paciente' CHECK (tipo IN ('medico', 'paciente')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.kyc_verificacoes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own KYC records"
  ON public.kyc_verificacoes FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own KYC records"
  ON public.kyc_verificacoes FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own KYC records"
  ON public.kyc_verificacoes FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
