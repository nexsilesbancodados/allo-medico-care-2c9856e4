
-- =============================================================
-- 1. AUTO-EXPIRE SUBSCRIPTIONS past current_period_end
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_auto_expire_subscriptions()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  UPDATE subscriptions
  SET status = 'expired', updated_at = now()
  WHERE status = 'active'
    AND current_period_end IS NOT NULL
    AND current_period_end < now();

  -- Notify affected users
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT s.user_id,
         'Assinatura expirada',
         'Seu plano ' || p.name || ' expirou. Renove para continuar usando todos os recursos.',
         'billing',
         '/dashboard/plans'
  FROM subscriptions s
  JOIN plans p ON p.id = s.plan_id
  WHERE s.status = 'expired'
    AND s.updated_at > now() - interval '1 minute'
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = s.user_id AND n.title = 'Assinatura expirada'
        AND n.created_at > now() - interval '1 day'
    );
END;
$$;

-- =============================================================
-- 2. B2B LEAD FOLLOW-UP (untouched leads after 48h)
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_notify_stale_b2b_leads()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  admin_id UUID;
BEGIN
  -- Get first admin
  SELECT user_id INTO admin_id FROM user_roles WHERE role = 'admin' LIMIT 1;
  IF admin_id IS NULL THEN RETURN; END IF;

  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT admin_id,
         '📊 Lead B2B pendente',
         'A empresa ' || bl.company_name || ' (' || bl.contact_name || ') aguarda resposta há ' ||
           EXTRACT(DAY FROM now() - bl.created_at)::int || ' dias.',
         'warning',
         '/dashboard?tab=b2b'
  FROM b2b_leads bl
  WHERE bl.status = 'new'
    AND bl.created_at < now() - interval '48 hours'
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = admin_id
        AND n.title = '📊 Lead B2B pendente'
        AND n.message LIKE '%' || bl.company_name || '%'
        AND n.created_at > now() - interval '3 days'
    )
  LIMIT 10;
END;
$$;

-- =============================================================
-- 3. AUTO-ARCHIVE OLD ON-DEMAND QUEUE ENTRIES
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_archive_completed_queue()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM on_demand_queue
  WHERE status IN ('completed', 'expired', 'cancelled')
    AND created_at < now() - interval '7 days';
END;
$$;

-- =============================================================
-- 4. NOTIFY ON CRM VERIFICATION CHANGE
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_notify_crm_verified()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.crm_verified = true AND (OLD.crm_verified IS DISTINCT FROM true) THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '✅ CRM Verificado',
      'Seu CRM ' || NEW.crm || '/' || NEW.crm_state || ' foi verificado com sucesso!',
      'info',
      '/dashboard'
    );
  END IF;

  -- Notify on approval
  IF NEW.is_approved = true AND (OLD.is_approved IS DISTINCT FROM true) THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '🎉 Cadastro aprovado!',
      'Parabéns! Seu perfil médico foi aprovado. Você já pode atender pacientes.',
      'info',
      '/dashboard'
    );
  END IF;

  -- Notify on rejection
  IF NEW.is_approved = false AND OLD.is_approved IS DISTINCT FROM false
     AND NEW.rejection_reason IS NOT NULL AND OLD.rejection_reason IS DISTINCT FROM NEW.rejection_reason THEN
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      NEW.user_id,
      '❌ Cadastro não aprovado',
      'Seu cadastro não foi aprovado. Motivo: ' || NEW.rejection_reason,
      'warning',
      '/dashboard'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_crm_verified
  AFTER UPDATE ON doctor_profiles
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_crm_verified();

-- =============================================================
-- 5. AUTO-CLEANUP OLD RATE LIMITS (beyond 1h already exists,
--    add cleanup of activity_logs older than 90 days)
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_cleanup_old_activity_logs()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  DELETE FROM activity_logs
  WHERE created_at < now() - interval '90 days';
END;
$$;

-- =============================================================
-- SCHEDULE CRON JOBS
-- =============================================================
SELECT cron.schedule('auto-expire-subscriptions', '*/30 * * * *', 'SELECT public.fn_auto_expire_subscriptions()');
SELECT cron.schedule('notify-stale-b2b-leads', '0 10 * * *', 'SELECT public.fn_notify_stale_b2b_leads()');
SELECT cron.schedule('archive-completed-queue', '0 4 * * 0', 'SELECT public.fn_archive_completed_queue()');
SELECT cron.schedule('cleanup-old-activity-logs', '0 4 1 * *', 'SELECT public.fn_cleanup_old_activity_logs()');
