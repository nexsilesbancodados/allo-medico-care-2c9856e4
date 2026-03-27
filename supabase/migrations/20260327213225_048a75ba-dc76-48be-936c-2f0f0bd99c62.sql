-- Create storage buckets for signed documents
INSERT INTO storage.buckets (id, name, public) VALUES ('laudos-assinados', 'laudos-assinados', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('receitas-assinadas', 'receitas-assinadas', true) ON CONFLICT (id) DO NOTHING;

-- RLS policies for laudos-assinados bucket
CREATE POLICY "Authenticated users can upload signed laudos" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'laudos-assinados');

CREATE POLICY "Anyone can view signed laudos" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'laudos-assinados');

-- RLS policies for receitas-assinadas bucket
CREATE POLICY "Authenticated users can upload signed prescriptions" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'receitas-assinadas');

CREATE POLICY "Anyone can view signed prescriptions" ON storage.objects
  FOR SELECT TO public
  USING (bucket_id = 'receitas-assinadas');