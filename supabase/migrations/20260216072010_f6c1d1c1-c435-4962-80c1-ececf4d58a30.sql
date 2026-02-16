
-- Table for support chat messages persistence
CREATE TABLE public.support_chat_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  role text NOT NULL DEFAULT 'user',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Support users can view all chat messages"
ON public.support_chat_messages FOR SELECT
USING (is_support() OR is_admin());

CREATE POLICY "Support users can insert chat messages"
ON public.support_chat_messages FOR INSERT
WITH CHECK (is_support() OR is_admin());

CREATE POLICY "Users can view own chat messages"
ON public.support_chat_messages FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chat messages"
ON public.support_chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_support_chat_user ON public.support_chat_messages(user_id, created_at DESC);
