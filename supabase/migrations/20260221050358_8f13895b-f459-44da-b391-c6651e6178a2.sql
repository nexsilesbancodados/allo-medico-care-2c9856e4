-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Cron 1: Cart abandonment check every 10 minutes
SELECT cron.schedule(
  'cart-abandonment-check',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/cart-abandonment',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Cron 2: Appointment reminders every 10 minutes
SELECT cron.schedule(
  'appointment-reminders-check',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/appointment-reminders',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);

-- Cron 3: Post-consultation survey every 10 minutes
SELECT cron.schedule(
  'post-consultation-survey-check',
  '*/10 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/post-consultation-survey',
    headers := '{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc"}'::jsonb,
    body := '{}'::jsonb
  ) AS request_id;
  $$
);