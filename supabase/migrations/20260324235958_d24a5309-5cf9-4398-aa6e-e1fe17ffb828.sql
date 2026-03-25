-- Add public verification lookup for document_verifications (for /validar/:id page)
CREATE POLICY "Anyone can verify documents by code"
  ON public.document_verifications FOR SELECT
  TO anon, authenticated
  USING (true);