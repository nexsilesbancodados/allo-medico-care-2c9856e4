
-- Add SLA and workflow columns to exam_requests
ALTER TABLE public.exam_requests 
  ADD COLUMN IF NOT EXISTS sla_deadline timestamptz,
  ADD COLUMN IF NOT EXISTS sla_hours integer DEFAULT 24,
  ADD COLUMN IF NOT EXISTS specialty_required text,
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual',
  ADD COLUMN IF NOT EXISTS orthanc_study_uid text,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz;

-- Create index for SLA monitoring
CREATE INDEX IF NOT EXISTS idx_exam_requests_sla ON public.exam_requests (sla_deadline) WHERE status IN ('pending', 'in_review');
CREATE INDEX IF NOT EXISTS idx_exam_requests_specialty ON public.exam_requests (specialty_required) WHERE status = 'pending';

-- Function: Auto-set SLA deadline on exam creation
CREATE OR REPLACE FUNCTION public.fn_set_exam_sla()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  -- Set SLA based on priority
  IF NEW.priority = 'urgent' THEN
    NEW.sla_hours := 2;
  ELSE
    NEW.sla_hours := 24;
  END IF;
  NEW.sla_deadline := NEW.created_at + (NEW.sla_hours || ' hours')::interval;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_set_exam_sla
  BEFORE INSERT ON public.exam_requests
  FOR EACH ROW EXECUTE FUNCTION public.fn_set_exam_sla();

-- Function: Auto-assign exam to specialist laudista by specialty
CREATE OR REPLACE FUNCTION public.fn_auto_assign_exam_to_specialist()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  target_doctor_id UUID;
  specialty_name TEXT;
BEGIN
  -- Only auto-assign if no manual assignment and specialty is set
  IF NEW.assigned_to IS NOT NULL THEN RETURN NEW; END IF;
  
  specialty_name := COALESCE(NEW.specialty_required, '');
  IF specialty_name = '' THEN RETURN NEW; END IF;
  
  -- Find least-busy laudista with matching specialty
  SELECT dp.id INTO target_doctor_id
  FROM doctor_profiles dp
  JOIN user_roles ur ON ur.user_id = dp.user_id AND ur.role = 'doctor'
  JOIN doctor_specialties ds ON ds.doctor_id = dp.id
  JOIN specialties s ON s.id = ds.specialty_id
  WHERE dp.is_approved = true
    AND LOWER(s.name) LIKE '%' || LOWER(specialty_name) || '%'
  ORDER BY (
    SELECT COUNT(*) FROM exam_requests er
    WHERE er.assigned_to = dp.id AND er.status IN ('pending', 'in_review')
  ) ASC, random()
  LIMIT 1;

  IF target_doctor_id IS NOT NULL THEN
    NEW.assigned_to := target_doctor_id;
    
    -- Notify assigned laudista
    INSERT INTO notifications (user_id, title, message, type, link)
    SELECT dp.user_id,
           CASE WHEN NEW.priority = 'urgent' THEN '🚨 Exame URGENTE atribuído' ELSE '🔬 Novo exame atribuído' END,
           'Exame de ' || NEW.exam_type || ' atribuído automaticamente por especialidade.',
           CASE WHEN NEW.priority = 'urgent' THEN 'urgent' ELSE 'exam' END,
           '/dashboard/laudista/report-editor/' || NEW.id || '?role=doctor'
    FROM doctor_profiles dp WHERE dp.id = target_doctor_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_auto_assign_exam_specialty
  BEFORE INSERT ON public.exam_requests
  FOR EACH ROW EXECUTE FUNCTION public.fn_auto_assign_exam_to_specialist();

-- Function: Alert on SLA breach
CREATE OR REPLACE FUNCTION public.fn_alert_sla_breach()
RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE
  exam RECORD;
  admin_id UUID;
BEGIN
  SELECT user_id INTO admin_id FROM user_roles WHERE role = 'admin' LIMIT 1;
  IF admin_id IS NULL THEN RETURN; END IF;

  FOR exam IN
    SELECT er.id, er.exam_type, er.priority, er.sla_deadline, er.assigned_to,
           EXTRACT(EPOCH FROM (now() - er.sla_deadline)) / 3600 as hours_overdue
    FROM exam_requests er
    WHERE er.status IN ('pending', 'in_review')
      AND er.sla_deadline < now()
      AND NOT EXISTS (
        SELECT 1 FROM notifications n
        WHERE n.title LIKE '%SLA%' AND n.message LIKE '%' || er.id::text || '%'
        AND n.created_at > now() - interval '4 hours'
      )
    LIMIT 20
  LOOP
    -- Notify admin
    INSERT INTO notifications (user_id, title, message, type, link)
    VALUES (admin_id,
      '⏰ SLA Estourado — ' || exam.exam_type,
      'Exame ' || exam.id::text || ' ultrapassou o prazo em ' || ROUND(exam.hours_overdue::numeric, 1) || 'h. Prioridade: ' || exam.priority,
      'urgent', '/dashboard?tab=exams');

    -- Notify assigned laudista if exists
    IF exam.assigned_to IS NOT NULL THEN
      INSERT INTO notifications (user_id, title, message, type, link)
      SELECT dp.user_id, '⏰ Prazo estourado!',
        'O exame de ' || exam.exam_type || ' ultrapassou o SLA. Finalize urgentemente.',
        'urgent', '/dashboard/laudista/report-editor/' || exam.id || '?role=doctor'
      FROM doctor_profiles dp WHERE dp.id = exam.assigned_to;
    END IF;
  END LOOP;
END;
$$;

-- Function: Update started_at when status changes to in_review
CREATE OR REPLACE FUNCTION public.fn_track_exam_workflow()
RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public' AS $$
BEGIN
  IF NEW.status = 'in_review' AND OLD.status = 'pending' THEN
    NEW.started_at := now();
  END IF;
  IF NEW.status = 'reported' AND OLD.status != 'reported' THEN
    NEW.completed_at := now();
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_track_exam_workflow
  BEFORE UPDATE ON public.exam_requests
  FOR EACH ROW EXECUTE FUNCTION public.fn_track_exam_workflow();
