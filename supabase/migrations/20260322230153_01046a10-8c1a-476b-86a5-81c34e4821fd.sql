
-- FIX 1: document_verifications — restrict to code-based lookup only
DROP POLICY IF EXISTS "Anon verify by code" ON public.document_verifications;
DROP POLICY IF EXISTS "Authenticated can view verifications" ON public.document_verifications;
DROP POLICY IF EXISTS "Anyone can verify documents" ON public.document_verifications;
DROP POLICY IF EXISTS "Public can verify documents" ON public.document_verifications;
DROP POLICY IF EXISTS "Verify by code only" ON public.document_verifications;
-- No open SELECT policy — verification is done via edge function with service_role

-- FIX 2: doctor_invite_codes — remove enumeration vulnerability
DROP POLICY IF EXISTS "Authenticated can validate specific invite code" ON public.doctor_invite_codes;
DROP POLICY IF EXISTS "Authenticated users can use a code" ON public.doctor_invite_codes;
-- Invite code validation is handled by edge function assign-role with service_role_key

-- FIX 3: wallet_balances is a VIEW with auth.uid() filter, not a table — dismiss
-- Already secured via the view definition WITH user_id = auth.uid()
