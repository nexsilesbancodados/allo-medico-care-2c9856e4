-- Remove duplicate cron jobs for appointment-reminders.
-- The function already deduplicates notifications internally.
-- Keep only 'appointment-reminders-every-5min' (every 5 min) as the single canonical job.

SELECT cron.unschedule('appointment-reminders-check')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'appointment-reminders-check');

SELECT cron.unschedule('appointment-reminders-every-5-min')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'appointment-reminders-every-5-min');

SELECT cron.unschedule('appointment-reminders-hourly')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'appointment-reminders-hourly');

-- Also remove the duplicate cart-abandonment-check (kept cart-abandonment-recovery which runs every 30min)
SELECT cron.unschedule('cart-abandonment-check')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'cart-abandonment-check');

-- Remove the duplicate post-consultation-survey-check (kept post-consultation-survey at */20)
SELECT cron.unschedule('post-consultation-survey-check')
WHERE EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'post-consultation-survey-check');
