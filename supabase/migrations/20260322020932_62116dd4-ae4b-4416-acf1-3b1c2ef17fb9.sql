
-- Sequência para número do pedido
CREATE SEQUENCE IF NOT EXISTS optical_order_seq START 1;

-- Catálogo de armações
CREATE TABLE public.optical_frames (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  brand TEXT NOT NULL DEFAULT '',
  model TEXT NOT NULL DEFAULT '',
  color TEXT NOT NULL DEFAULT '',
  material TEXT NOT NULL DEFAULT 'acetato',
  gender TEXT NOT NULL DEFAULT 'unissex',
  shape TEXT NOT NULL DEFAULT 'retangular',
  bridge_size NUMERIC,
  lens_width NUMERIC,
  temple_length NUMERIC,
  price NUMERIC NOT NULL DEFAULT 0,
  discount_price NUMERIC,
  image_urls JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_active BOOLEAN NOT NULL DEFAULT true,
  stock_qty INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.optical_frames ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active frames" ON public.optical_frames FOR SELECT USING (is_active = true);
CREATE POLICY "Opticians and admins manage frames" ON public.optical_frames FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'optician')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'optician')));

-- Tipos de lente
CREATE TABLE public.optical_lens_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  lens_type TEXT NOT NULL DEFAULT 'monofocal',
  material TEXT NOT NULL DEFAULT 'resina',
  coatings TEXT[] NOT NULL DEFAULT '{}',
  price NUMERIC NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.optical_lens_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public can view active lenses" ON public.optical_lens_types FOR SELECT USING (is_active = true);
CREATE POLICY "Opticians and admins manage lenses" ON public.optical_lens_types FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'optician')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'optician')));

-- Pedidos
CREATE TABLE public.optical_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number TEXT NOT NULL DEFAULT 'OPT-' || LPAD(nextval('optical_order_seq'::regclass)::text, 6, '0'),
  patient_id UUID NOT NULL,
  prescription_id UUID,
  frame_id UUID REFERENCES public.optical_frames(id),
  lens_type_id UUID REFERENCES public.optical_lens_types(id),
  od_spherical NUMERIC, od_cylindrical NUMERIC, od_axis INTEGER,
  oe_spherical NUMERIC, oe_cylindrical NUMERIC, oe_axis INTEGER,
  od_addition NUMERIC, oe_addition NUMERIC,
  interpupillary_distance NUMERIC,
  frame_price NUMERIC NOT NULL DEFAULT 0,
  lens_price NUMERIC NOT NULL DEFAULT 0,
  discount_amount NUMERIC NOT NULL DEFAULT 0,
  total_price NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending',
  payment_status TEXT NOT NULL DEFAULT 'pending',
  payment_id TEXT,
  tracking_code TEXT,
  shipping_address JSONB,
  notes TEXT,
  internal_notes TEXT,
  paid_at TIMESTAMPTZ,
  shipped_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.optical_orders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Patients view own orders" ON public.optical_orders FOR SELECT TO authenticated USING (patient_id = auth.uid());
CREATE POLICY "Patients create orders" ON public.optical_orders FOR INSERT TO authenticated WITH CHECK (patient_id = auth.uid());
CREATE POLICY "Opticians admins manage orders" ON public.optical_orders FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'optician')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'optician')));

-- Produção
CREATE TABLE public.optical_production (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES public.optical_orders(id) ON DELETE CASCADE,
  stage TEXT NOT NULL DEFAULT 'queued',
  assigned_to UUID,
  notes TEXT,
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.optical_production ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Opticians admins manage production" ON public.optical_production FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'optician')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'optician')));

-- Movimentações de estoque
CREATE TABLE public.optical_stock_movements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  frame_id UUID NOT NULL REFERENCES public.optical_frames(id),
  movement_type TEXT NOT NULL DEFAULT 'entry',
  quantity INTEGER NOT NULL,
  reason TEXT,
  order_id UUID REFERENCES public.optical_orders(id),
  performed_by UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.optical_stock_movements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Opticians admins manage stock" ON public.optical_stock_movements FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'optician')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'optician')));

-- Financeiro
CREATE TABLE public.optical_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.optical_orders(id),
  type TEXT NOT NULL DEFAULT 'sale',
  amount NUMERIC NOT NULL DEFAULT 0,
  description TEXT,
  payment_method TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.optical_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Opticians admins view transactions" ON public.optical_transactions FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'optician')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role IN ('admin', 'optician')));

-- Triggers
CREATE OR REPLACE FUNCTION public.fn_optical_stock_on_order()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' AND NEW.frame_id IS NOT NULL THEN
    UPDATE optical_frames SET stock_qty = stock_qty - 1, updated_at = now() WHERE id = NEW.frame_id AND stock_qty > 0;
    INSERT INTO optical_stock_movements (frame_id, movement_type, quantity, reason, order_id, performed_by)
    VALUES (NEW.frame_id, 'exit', 1, 'Pedido confirmado #' || NEW.order_number, NEW.id, auth.uid());
  END IF;
  IF NEW.status = 'cancelled' AND OLD.status != 'cancelled' AND NEW.frame_id IS NOT NULL THEN
    UPDATE optical_frames SET stock_qty = stock_qty + 1, updated_at = now() WHERE id = NEW.frame_id;
    INSERT INTO optical_stock_movements (frame_id, movement_type, quantity, reason, order_id, performed_by)
    VALUES (NEW.frame_id, 'entry', 1, 'Pedido cancelado #' || NEW.order_number, NEW.id, auth.uid());
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_optical_stock_on_order BEFORE UPDATE ON public.optical_orders FOR EACH ROW EXECUTE FUNCTION public.fn_optical_stock_on_order();

CREATE OR REPLACE FUNCTION public.fn_optical_create_production()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status != 'confirmed' THEN
    INSERT INTO optical_production (order_id, stage) VALUES (NEW.id, 'queued');
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_optical_create_production AFTER UPDATE ON public.optical_orders FOR EACH ROW EXECUTE FUNCTION public.fn_optical_create_production();

CREATE OR REPLACE FUNCTION public.fn_optical_record_transaction()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.payment_status IN ('approved', 'confirmed') AND OLD.payment_status NOT IN ('approved', 'confirmed') THEN
    INSERT INTO optical_transactions (order_id, type, amount, description, payment_method)
    VALUES (NEW.id, 'sale', NEW.total_price, 'Pedido #' || NEW.order_number, 'online');
  END IF;
  IF NEW.status = 'refunded' AND OLD.status != 'refunded' THEN
    INSERT INTO optical_transactions (order_id, type, amount, description)
    VALUES (NEW.id, 'refund', -NEW.total_price, 'Estorno pedido #' || NEW.order_number);
  END IF;
  RETURN NEW;
END; $$;

CREATE TRIGGER trg_optical_record_transaction AFTER UPDATE ON public.optical_orders FOR EACH ROW EXECUTE FUNCTION public.fn_optical_record_transaction();

-- Índices
CREATE INDEX idx_optical_orders_patient ON public.optical_orders(patient_id);
CREATE INDEX idx_optical_orders_status ON public.optical_orders(status);
CREATE INDEX idx_optical_production_order ON public.optical_production(order_id);
CREATE INDEX idx_optical_stock_frame ON public.optical_stock_movements(frame_id);
CREATE INDEX idx_optical_frames_active ON public.optical_frames(is_active) WHERE is_active = true;
