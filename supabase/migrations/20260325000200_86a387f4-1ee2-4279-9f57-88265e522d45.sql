-- Tighten intentionally-public INSERT policies to validate required fields
-- instead of using WITH CHECK (true)

-- b2b_leads: require essential fields
DROP POLICY "Anyone can submit b2b lead" ON public.b2b_leads;
CREATE POLICY "Anyone can submit b2b lead"
  ON public.b2b_leads FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    company_name IS NOT NULL AND company_name <> '' AND
    contact_name IS NOT NULL AND contact_name <> '' AND
    email IS NOT NULL AND email <> ''
  );

-- doctor_applications: require essential fields
DROP POLICY "Anyone can submit doctor application" ON public.doctor_applications;
CREATE POLICY "Anyone can submit doctor application"
  ON public.doctor_applications FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    full_name IS NOT NULL AND full_name <> '' AND
    email IS NOT NULL AND email <> '' AND
    crm IS NOT NULL AND crm <> ''
  );

-- newsletter_subscribers: require email
DROP POLICY "Anyone can subscribe to newsletter" ON public.newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
  ON public.newsletter_subscribers FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    email IS NOT NULL AND email <> ''
  );