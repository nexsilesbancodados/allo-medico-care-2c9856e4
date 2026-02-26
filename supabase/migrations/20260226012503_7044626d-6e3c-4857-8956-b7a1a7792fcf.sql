
-- =============================================================
-- 1. AUTO-CANCEL EXPIRED PRESCRIPTION RENEWALS (7+ days unpaid)
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_auto_cancel_expired_renewals()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  UPDATE prescription_renewals
  SET status = 'cancelled', updated_at = now()
  WHERE status = 'pending_payment'
    AND paid_at IS NULL
    AND created_at < now() - interval '7 days';
END;
$$;

-- =============================================================
-- 2. NOTIFY DOCTOR LOW RATING (below 3.0 after 5+ reviews)
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_notify_low_rating_doctors()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT dp.user_id,
         '⚠️ Atenção: avaliação baixa',
         'Sua avaliação está em ' || dp.rating || '/5 com ' || dp.total_reviews || ' avaliações. Considere melhorar a experiência dos pacientes.',
         'warning',
         '/dashboard/reviews'
  FROM doctor_profiles dp
  WHERE dp.is_approved = true
    AND dp.rating IS NOT NULL
    AND dp.rating < 3.0
    AND dp.total_reviews >= 5
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = dp.user_id
        AND n.title = '⚠️ Atenção: avaliação baixa'
        AND n.created_at > now() - interval '14 days'
    );
END;
$$;

-- =============================================================
-- 3. AUTO-CLOSE STALE SUPPORT TICKETS (no activity 7+ days)
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_auto_close_stale_tickets()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  -- Notify patient before closing
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT st.patient_id,
         'Ticket de suporte fechado',
         'Seu ticket "' || st.subject || '" foi fechado por inatividade.',
         'support',
         '/dashboard/support'
  FROM support_tickets st
  WHERE st.status = 'in_progress'
    AND st.updated_at < now() - interval '7 days';

  UPDATE support_tickets
  SET status = 'closed', closed_at = now(), updated_at = now()
  WHERE status = 'in_progress'
    AND updated_at < now() - interval '7 days';
END;
$$;

-- =============================================================
-- 4. NOTIFY CLINIC ON DOCTOR AFFILIATION STATUS CHANGE
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_notify_affiliation_change()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  clinic_user_id UUID;
  doctor_name TEXT;
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    SELECT cp.user_id INTO clinic_user_id
    FROM clinic_profiles cp WHERE cp.id = NEW.clinic_id;

    SELECT p.first_name || ' ' || p.last_name INTO doctor_name
    FROM doctor_profiles dp
    JOIN profiles p ON p.user_id = dp.user_id
    WHERE dp.id = NEW.doctor_id;

    IF NEW.status = 'active' THEN
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (clinic_user_id, '✅ Médico vinculado', 
              'Dr(a). ' || COALESCE(doctor_name, '') || ' aceitou a afiliação à sua clínica.',
              'info', '/dashboard/clinic/doctors');
    ELSIF NEW.status = 'rejected' THEN
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (clinic_user_id, '❌ Afiliação recusada',
              'Dr(a). ' || COALESCE(doctor_name, '') || ' recusou a afiliação.',
              'warning', '/dashboard/clinic/doctors');
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notify_affiliation_change
  AFTER UPDATE ON clinic_affiliations
  FOR EACH ROW
  EXECUTE FUNCTION fn_notify_affiliation_change();

-- =============================================================
-- 5. AUTO-MARK EXAM REQUESTS AS OVERDUE (pending 48h+)
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_notify_overdue_exams()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  admin_id UUID;
BEGIN
  SELECT user_id INTO admin_id FROM user_roles WHERE role = 'admin' LIMIT 1;
  IF admin_id IS NULL THEN RETURN; END IF;

  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT admin_id,
         '🔬 Exame aguardando laudo',
         'Exame de ' || er.exam_type || ' (prioridade: ' || er.priority || ') aguarda laudo há ' ||
           EXTRACT(HOUR FROM now() - er.created_at)::int || 'h.',
         'exam',
         '/dashboard?tab=exams'
  FROM exam_requests er
  WHERE er.status = 'pending'
    AND er.assigned_to IS NULL
    AND er.created_at < now() - interval '48 hours'
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = admin_id
        AND n.title = '🔬 Exame aguardando laudo'
        AND n.message LIKE '%' || er.exam_type || '%'
        AND n.created_at > now() - interval '2 days'
    )
  LIMIT 10;

  -- Urgent exams: notify after just 4 hours
  INSERT INTO notifications (user_id, title, message, type, link)
  SELECT admin_id,
         '🚨 Exame URGENTE sem laudo',
         'Exame urgente de ' || er.exam_type || ' aguarda laudo há ' ||
           EXTRACT(HOUR FROM now() - er.created_at)::int || 'h!',
         'urgent',
         '/dashboard?tab=exams'
  FROM exam_requests er
  WHERE er.status = 'pending'
    AND er.priority = 'urgent'
    AND er.created_at < now() - interval '4 hours'
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = admin_id
        AND n.title = '🚨 Exame URGENTE sem laudo'
        AND n.created_at > now() - interval '4 hours'
    )
  LIMIT 5;
END;
$$;

-- =============================================================
-- SCHEDULE CRON JOBS
-- =============================================================
SELECT cron.schedule('auto-cancel-expired-renewals', '0 */6 * * *', 'SELECT public.fn_auto_cancel_expired_renewals()');
SELECT cron.schedule('notify-low-rating-doctors', '0 10 * * 1', 'SELECT public.fn_notify_low_rating_doctors()');
SELECT cron.schedule('auto-close-stale-tickets', '0 5 * * *', 'SELECT public.fn_auto_close_stale_tickets()');
SELECT cron.schedule('notify-overdue-exams', '0 */4 * * *', 'SELECT public.fn_notify_overdue_exams()');
