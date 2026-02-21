
-- Schedule appointment reminders every 5 minutes
SELECT cron.schedule(
  'appointment-reminders-every-5min',
  '*/5 * * * *',
  $$
  SELECT
    net.http_post(
        url:='https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/appointment-reminders',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc"}'::jsonb,
        body:='{}'::jsonb
    ) as request_id;
  $$
);
