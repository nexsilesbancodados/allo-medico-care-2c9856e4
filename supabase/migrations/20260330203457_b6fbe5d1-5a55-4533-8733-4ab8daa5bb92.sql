
-- Schedule fn_handle_doctor_no_show to run every 10 minutes
SELECT cron.schedule(
  'handle-doctor-no-show',
  '*/10 * * * *',
  $$SELECT public.fn_handle_doctor_no_show()$$
);
