
-- Plans table
CREATE TABLE public.plans (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  price NUMERIC NOT NULL DEFAULT 0,
  interval TEXT NOT NULL DEFAULT 'monthly', -- monthly, yearly, single
  max_appointments INTEGER, -- null = unlimited
  is_active BOOLEAN NOT NULL DEFAULT true,
  features JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active plans" ON public.plans
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Only admins can manage plans" ON public.plans
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER update_plans_updated_at
  BEFORE UPDATE ON public.plans
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Subscriptions table
CREATE TABLE public.subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  plan_id UUID NOT NULL REFERENCES public.plans(id),
  status TEXT NOT NULL DEFAULT 'active', -- active, cancelled, expired, paused
  starts_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  expires_at TIMESTAMP WITH TIME ZONE,
  cancelled_at TIMESTAMP WITH TIME ZONE,
  payment_method TEXT,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own subscriptions" ON public.subscriptions
  FOR SELECT USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Only admins can manage subscriptions" ON public.subscriptions
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE TRIGGER update_subscriptions_updated_at
  BEFORE UPDATE ON public.subscriptions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Activity logs table
CREATE TABLE public.activity_logs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  action TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- patient, doctor, clinic, appointment, plan, subscription
  entity_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  performed_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Only admins can view logs" ON public.activity_logs
  FOR SELECT USING (is_admin());

CREATE POLICY "Only admins can insert logs" ON public.activity_logs
  FOR INSERT WITH CHECK (is_admin());
