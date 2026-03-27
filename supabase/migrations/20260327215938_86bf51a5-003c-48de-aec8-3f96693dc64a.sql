
-- Tabela de logs de notificações
CREATE TABLE IF NOT EXISTS public.notification_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  tipo text NOT NULL,
  canal text DEFAULT 'whatsapp',
  status text NOT NULL,
  mensagem text,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.notification_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "usuario_ve_proprios" ON public.notification_logs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "admin_ve_tudo" ON public.notification_logs
  FOR SELECT USING (public.is_admin());

-- Coluna lembrete_enviado na tabela appointments
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS lembrete_enviado boolean DEFAULT false;
