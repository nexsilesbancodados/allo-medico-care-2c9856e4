
-- 1. Update fn_auto_no_show to only mark PATIENT no-shows (15min after scheduled time)
-- Doctor no-shows are handled separately
CREATE OR REPLACE FUNCTION public.fn_auto_no_show()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Patient no-show: patient didn't join confirmed/scheduled appointment after 15min
  -- No refund for patient no-shows
  UPDATE appointments
  SET status = 'no_show',
      cancel_reason = 'Paciente não compareceu (automático)',
      cancelled_by = patient_id,
      updated_at = now()
  WHERE status IN ('confirmed', 'scheduled')
    AND payment_status IN ('confirmed', 'approved', 'received')
    AND scheduled_at < now() - interval '15 minutes'
    AND scheduled_at > now() - interval '2 hours';
END;
$function$;

-- 2. New function: handle doctor no-show
-- When doctor doesn't show up, refund patient and try to reassign to another available doctor
CREATE OR REPLACE FUNCTION public.fn_handle_doctor_no_show()
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  appt RECORD;
  new_doctor_id UUID;
  new_doctor_user_id UUID;
BEGIN
  -- Find appointments where doctor didn't show (30min past scheduled time, still confirmed/scheduled)
  -- and doctor has not started consultation (status never went to in_progress)
  FOR appt IN
    SELECT a.id, a.patient_id, a.doctor_id, a.scheduled_at, a.price_at_booking,
           a.payment_status, a.jitsi_link, a.appointment_type, a.notes
    FROM appointments a
    WHERE a.status IN ('confirmed', 'scheduled')
      AND a.payment_status IN ('confirmed', 'approved', 'received')
      AND a.scheduled_at < now() - interval '30 minutes'
      AND a.scheduled_at > now() - interval '3 hours'
      AND NOT EXISTS (
        SELECT 1 FROM activity_logs al
        WHERE al.entity_id = a.id::text
          AND al.action = 'doctor_no_show_handled'
      )
  LOOP
    -- Mark as doctor no-show
    UPDATE appointments
    SET status = 'no_show',
        cancel_reason = 'Médico não compareceu — reagendamento automático em andamento',
        cancelled_by = appt.doctor_id::text,
        updated_at = now()
    WHERE id = appt.id;

    -- Log the event
    INSERT INTO activity_logs (action, entity_type, entity_id, user_id, details)
    VALUES ('doctor_no_show_handled', 'appointment', appt.id, appt.patient_id,
      jsonb_build_object(
        'original_doctor_id', appt.doctor_id,
        'scheduled_at', appt.scheduled_at,
        'price', appt.price_at_booking
      )
    );

    -- Try to find another available doctor
    SELECT dp.id, dp.user_id INTO new_doctor_id, new_doctor_user_id
    FROM doctor_profiles dp
    WHERE dp.available_now = true
      AND dp.is_approved = true
      AND dp.id != appt.doctor_id
    ORDER BY dp.rating DESC NULLS LAST, random()
    LIMIT 1;

    IF new_doctor_id IS NOT NULL AND appt.patient_id IS NOT NULL THEN
      -- Create a new appointment with the available doctor (already paid)
      INSERT INTO appointments (
        patient_id, doctor_id, scheduled_at, status, payment_status,
        price_at_booking, appointment_type, notes, original_appointment_id
      ) VALUES (
        appt.patient_id, new_doctor_id, now() + interval '5 minutes',
        'confirmed', appt.payment_status,
        appt.price_at_booking, COALESCE(appt.appointment_type, 'first_visit'),
        'Reatribuído automaticamente — médico anterior não compareceu',
        appt.id
      );

      -- Notify patient about reassignment
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        appt.patient_id,
        '🔄 Consulta reatribuída',
        'O médico anterior não compareceu. Outro profissional foi designado para seu atendimento. Acesse a sala em instantes!',
        'urgent',
        '/dashboard/consultation'
      );

      -- Notify new doctor
      INSERT INTO notifications (user_id, title, message, type, link)
      VALUES (
        new_doctor_user_id,
        '🚨 Paciente aguardando — reatribuição',
        'Um paciente precisa de atendimento imediato (médico anterior não compareceu).',
        'urgent',
        '/dashboard/waiting-room'
      );

    ELSE
      -- No available doctor found — process full refund
      IF appt.patient_id IS NOT NULL THEN
        -- Mark for refund
        UPDATE appointments
        SET payment_status = 'refund_pending',
            cancel_reason = 'Médico não compareceu — reembolso integral em processamento'
        WHERE id = appt.id;

        -- Trigger refund via edge function
        PERFORM net.http_post(
          url := 'https://oaixgmuocuwhsabidpei.supabase.co/functions/v1/process-refund',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9haXhnbXVvY3V3aHNhYmlkcGVpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExODUyNjksImV4cCI6MjA4Njc2MTI2OX0.J9KUdJRNxSFdhI4hNu4V9CDQw4rl7wHPvRy3WU8mqrc'
          ),
          body := jsonb_build_object(
            'appointmentId', appt.id,
            'reason', 'Médico não compareceu à consulta',
            'refundType', 'full'
          )
        );

        -- Notify patient about refund
        INSERT INTO notifications (user_id, title, message, type, link)
        VALUES (
          appt.patient_id,
          '💸 Reembolso — Médico não compareceu',
          'Infelizmente o médico não compareceu à consulta. Seu reembolso integral será processado automaticamente.',
          'payment',
          '/dashboard/appointments'
        );
      END IF;
    END IF;

    -- Notify admin about doctor no-show
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT ur.user_id,
      '⚠️ Médico não compareceu',
      'O médico (ID: ' || appt.doctor_id || ') não compareceu à consulta ' || appt.id || '. Paciente ' || CASE WHEN new_doctor_id IS NOT NULL THEN 'reatribuído.' ELSE 'reembolsado.' END,
      'warning',
      '/dashboard?tab=appointments'
    FROM user_roles ur WHERE ur.role = 'admin' LIMIT 1;

  END LOOP;
END;
$function$;
