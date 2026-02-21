
-- Add commission config to clinic_affiliations
ALTER TABLE public.clinic_affiliations 
ADD COLUMN IF NOT EXISTS commission_percent numeric NOT NULL DEFAULT 70;

-- Add online presence tracking table
CREATE TABLE IF NOT EXISTS public.user_presence (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  last_seen_at timestamp with time zone NOT NULL DEFAULT now(),
  current_page text DEFAULT '/',
  is_online boolean NOT NULL DEFAULT true
);

ALTER TABLE public.user_presence ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can insert/update their own presence
CREATE POLICY "Users can manage own presence"
ON public.user_presence FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Admin/support can view all presence
CREATE POLICY "Support can view all presence"
ON public.user_presence FOR SELECT
USING (is_admin() OR is_support());

-- Unique constraint on user_id
ALTER TABLE public.user_presence ADD CONSTRAINT user_presence_user_id_unique UNIQUE (user_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_presence;
