
-- ====================================================
-- AUTO-RECALCULATE DOCTOR RATING ON NEW SURVEY
-- ====================================================

CREATE OR REPLACE FUNCTION public.fn_recalc_doctor_rating()
RETURNS TRIGGER AS $$
DECLARE
  avg_nps NUMERIC;
  total_count INTEGER;
BEGIN
  SELECT AVG(nps_score), COUNT(*) INTO avg_nps, total_count
  FROM public.satisfaction_surveys
  WHERE doctor_id = NEW.doctor_id;

  UPDATE public.doctor_profiles
  SET rating = ROUND(avg_nps / 2, 1),
      total_reviews = total_count
  WHERE id = NEW.doctor_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_recalc_doctor_rating ON public.satisfaction_surveys;
CREATE TRIGGER trg_recalc_doctor_rating
  AFTER INSERT ON public.satisfaction_surveys
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_recalc_doctor_rating();

-- ====================================================
-- AUTO-ASSIGN SUPPORT TICKETS ROUND-ROBIN
-- ====================================================

CREATE OR REPLACE FUNCTION public.fn_auto_assign_support_ticket()
RETURNS TRIGGER AS $$
DECLARE
  support_user_id UUID;
BEGIN
  IF NEW.assigned_to IS NULL THEN
    SELECT ur.user_id INTO support_user_id
    FROM public.user_roles ur
    WHERE ur.role = 'support'
    ORDER BY (
      SELECT COUNT(*) FROM public.support_tickets st
      WHERE st.assigned_to = ur.user_id AND st.status IN ('open', 'in_progress')
    ) ASC, random()
    LIMIT 1;

    IF support_user_id IS NOT NULL THEN
      NEW.assigned_to := support_user_id;
      
      -- Notify support agent
      INSERT INTO public.notifications (user_id, title, message, type, link)
      VALUES (
        support_user_id,
        'Novo ticket atribuído',
        'Ticket: ' || NEW.subject,
        'support',
        '/dashboard/support'
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_auto_assign_support_ticket ON public.support_tickets;
CREATE TRIGGER trg_auto_assign_support_ticket
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_auto_assign_support_ticket();

-- ====================================================
-- AUTO-TRACK REFERRAL CONVERSION ON SUBSCRIPTION CREATE
-- When user with referred_by creates a subscription,
-- mark referral as converted and credit referrer
-- ====================================================

CREATE OR REPLACE FUNCTION public.fn_track_referral_subscription()
RETURNS TRIGGER AS $$
DECLARE
  referrer_profile RECORD;
  plan_price NUMERIC;
  commission NUMERIC;
BEGIN
  -- Find if this user was referred
  SELECT p.referred_by, p.user_id INTO referrer_profile
  FROM public.profiles p
  WHERE p.user_id = NEW.user_id AND p.referred_by IS NOT NULL;

  IF referrer_profile.referred_by IS NOT NULL THEN
    -- Get plan price
    SELECT price INTO plan_price FROM public.plans WHERE id = NEW.plan_id;
    commission := COALESCE(plan_price, 0) * 0.10; -- 10% commission

    -- Update referral record
    UPDATE public.referrals
    SET status = 'converted',
        converted_at = now(),
        commission_percent = 10
    WHERE referral_code = referrer_profile.referred_by
      AND referred_user_id = NEW.user_id
      AND status = 'pending';

    -- Credit referrer
    IF commission > 0 THEN
      INSERT INTO public.user_credits (user_id, amount, reason, reference_id)
      SELECT r.referrer_id, commission, 'Comissão de indicação', NEW.id
      FROM public.referrals r
      WHERE r.referral_code = referrer_profile.referred_by
        AND r.referred_user_id = NEW.user_id
      LIMIT 1;
    END IF;

    -- Notify referrer
    INSERT INTO public.notifications (user_id, title, message, type, link)
    SELECT r.referrer_id,
           'Indicação convertida! 🎉',
           'Seu indicado assinou um plano. Você ganhou R$ ' || commission::TEXT || ' em créditos!',
           'referral',
           '/dashboard'
    FROM public.referrals r
    WHERE r.referral_code = referrer_profile.referred_by
      AND r.referred_user_id = NEW.user_id
    LIMIT 1;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_track_referral_subscription ON public.subscriptions;
CREATE TRIGGER trg_track_referral_subscription
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_track_referral_subscription();

-- ====================================================
-- AUTO-UPDATE COUPON USAGE COUNT
-- ====================================================

CREATE OR REPLACE FUNCTION public.fn_increment_coupon_usage()
RETURNS TRIGGER AS $$
BEGIN
  -- When a subscription references a coupon in notes, increment usage
  IF NEW.notes IS NOT NULL AND NEW.notes LIKE 'coupon:%' THEN
    UPDATE public.coupons
    SET times_used = times_used + 1
    WHERE code = REPLACE(NEW.notes, 'coupon:', '')
      AND is_active = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

DROP TRIGGER IF EXISTS trg_increment_coupon_usage ON public.subscriptions;
CREATE TRIGGER trg_increment_coupon_usage
  AFTER INSERT ON public.subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_increment_coupon_usage();
