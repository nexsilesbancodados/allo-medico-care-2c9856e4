
-- =============================================================
-- 1. AUTO NO-SHOW: Mark appointments as no_show if not started
--    15 minutes after scheduled time
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_auto_no_show()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
BEGIN
  UPDATE appointments
  SET status = 'no_show',
      cancel_reason = 'Paciente não compareceu (automático)',
      updated_at = now()
  WHERE status IN ('confirmed', 'scheduled')
    AND payment_status = 'confirmed'
    AND scheduled_at < now() - interval '15 minutes'
    AND scheduled_at > now() - interval '2 hours';
END;
$$;

-- =============================================================
-- 2. AUTO-ASSIGN PRESCRIPTION RENEWALS: When paid, assign to
--    the least-busy available doctor
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_auto_assign_renewal()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  target_doctor_id UUID;
BEGIN
  -- Only fire when paid_at changes from NULL to a value
  IF NEW.paid_at IS NOT NULL AND OLD.paid_at IS NULL AND NEW.assigned_doctor_id IS NULL THEN
    -- Find least-busy approved doctor
    SELECT dp.id INTO target_doctor_id
    FROM doctor_profiles dp
    JOIN user_roles ur ON ur.user_id = dp.user_id AND ur.role = 'doctor'
    WHERE dp.is_approved = true
    ORDER BY (
      SELECT COUNT(*) FROM prescription_renewals pr
      WHERE pr.assigned_doctor_id = dp.id
        AND pr.status IN ('pending_review', 'in_review')
    ) ASC, random()
    LIMIT 1;

    IF target_doctor_id IS NOT NULL THEN
      NEW.assigned_doctor_id := target_doctor_id;
      NEW.status := 'pending_review';

      -- Notify assigned doctor
      INSERT INTO notifications (user_id, title, message, type, link)
      SELECT dp.user_id,
             '📋 Nova renovação de receita',
             'Uma renovação de receita foi atribuída para sua análise.',
             'prescription',
             '/dashboard/renewals'
      FROM doctor_profiles dp WHERE dp.id = target_doctor_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_assign_renewal
  BEFORE UPDATE ON prescription_renewals
  FOR EACH ROW
  EXECUTE FUNCTION fn_auto_assign_renewal();

-- =============================================================
-- 3. SUBSCRIPTION EXPIRY WARNING: Notify users 3 days before
--    their subscription expires
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_notify_subscription_expiry()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  sub RECORD;
BEGIN
  FOR sub IN
    SELECT s.id, s.user_id, s.current_period_end, p.name as plan_name
    FROM subscriptions s
    JOIN plans p ON p.id = s.plan_id
    WHERE s.status = 'active'
      AND s.current_period_end IS NOT NULL
      AND s.current_period_end BETWEEN now() AND now() + interval '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = s.user_id
          AND n.title = 'Assinatura expirando'
          AND n.created_at > now() - interval '3 days'
      )
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      sub.user_id,
      'Assinatura expirando',
      'Seu plano ' || sub.plan_name || ' expira em ' ||
        to_char(sub.current_period_end AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY') ||
        '. Renove para continuar aproveitando!',
      'billing',
      '/dashboard/plans'
    );
  END LOOP;
END;
$$;

-- =============================================================
-- 4. INVITE CODE FOLLOW-UP: Remind admins about unused invite
--    codes 3 days before expiry
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_notify_expiring_invites()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  inv RECORD;
BEGIN
  FOR inv IN
    SELECT dic.id, dic.code, dic.created_by, dic.expires_at
    FROM doctor_invite_codes dic
    WHERE dic.is_used = false
      AND dic.expires_at IS NOT NULL
      AND dic.expires_at BETWEEN now() AND now() + interval '3 days'
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.user_id = dic.created_by
          AND n.title = 'Convite médico expirando'
          AND n.created_at > now() - interval '2 days'
          AND n.message LIKE '%' || dic.code || '%'
      )
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      inv.created_by,
      'Convite médico expirando',
      'O código ' || inv.code || ' expira em ' ||
        to_char(inv.expires_at AT TIME ZONE 'America/Sao_Paulo', 'DD/MM/YYYY') ||
        '. O médico ainda não se cadastrou.',
      'warning',
      '/dashboard?tab=approvals'
    );
  END LOOP;
END;
$$;

-- =============================================================
-- 5. PATIENT RE-ENGAGEMENT: Notify patients with no
--    appointments in 90+ days
-- =============================================================
CREATE OR REPLACE FUNCTION public.fn_reengage_inactive_patients()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $$
DECLARE
  pat RECORD;
BEGIN
  FOR pat IN
    SELECT DISTINCT p.user_id, p.first_name
    FROM profiles p
    JOIN user_roles ur ON ur.user_id = p.user_id AND ur.role = 'patient'
    WHERE NOT EXISTS (
      SELECT 1 FROM appointments a
      WHERE a.patient_id = p.user_id
        AND a.created_at > now() - interval '90 days'
    )
    AND NOT EXISTS (
      SELECT 1 FROM notifications n
      WHERE n.user_id = p.user_id
        AND n.title = 'Sentimos sua falta!'
        AND n.created_at > now() - interval '30 days'
    )
    LIMIT 50
  LOOP
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (
      pat.user_id,
      'Sentimos sua falta!',
      'Olá ' || COALESCE(pat.first_name, '') || '! Faz tempo que você não agenda uma consulta. Cuide da sua saúde! 💚',
      'info',
      '/dashboard/book'
    );
  END LOOP;
END;
$$;
