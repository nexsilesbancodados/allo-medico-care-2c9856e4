
-- Schedule new automation cron jobs
SELECT cron.schedule('auto-no-show', '*/10 * * * *', 'SELECT public.fn_auto_no_show()');
SELECT cron.schedule('notify-subscription-expiry', '0 9 * * *', 'SELECT public.fn_notify_subscription_expiry()');
SELECT cron.schedule('notify-expiring-invites', '0 10 * * *', 'SELECT public.fn_notify_expiring_invites()');
SELECT cron.schedule('reengage-inactive-patients', '0 11 * * 1', 'SELECT public.fn_reengage_inactive_patients()');
