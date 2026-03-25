-- SECURITY FIX: Restrict {public} role policies to {authenticated}
-- Part 1: Tables A-D

ALTER POLICY "Only admins can insert logs" ON public.activity_logs TO authenticated;
ALTER POLICY "Only admins can view logs" ON public.activity_logs TO authenticated;
ALTER POLICY "Support can insert logs" ON public.activity_logs TO authenticated;
ALTER POLICY "Support can view logs" ON public.activity_logs TO authenticated;

ALTER POLICY "Admins can view all AI conversations" ON public.ai_conversations TO authenticated;
ALTER POLICY "Users manage own AI conversations" ON public.ai_conversations TO authenticated;

ALTER POLICY "Only admins can insert app_settings" ON public.app_settings TO authenticated;
ALTER POLICY "Only admins can update app_settings" ON public.app_settings TO authenticated;

ALTER POLICY "Admins manage waitlist" ON public.appointment_waitlist TO authenticated;
ALTER POLICY "Patients manage own waitlist" ON public.appointment_waitlist TO authenticated;

ALTER POLICY "Receptionists can update appointments" ON public.appointments TO authenticated;
ALTER POLICY "Receptionists can view all appointments" ON public.appointments TO authenticated;

ALTER POLICY "Admins manage b2b leads" ON public.b2b_leads TO authenticated;

ALTER POLICY "Admins can manage coupons" ON public.coupons TO authenticated;

ALTER POLICY "Admins manage all discount cards" ON public.discount_cards TO authenticated;
ALTER POLICY "Users insert own discount card" ON public.discount_cards TO authenticated;
ALTER POLICY "Users update own discount card" ON public.discount_cards TO authenticated;
ALTER POLICY "Users view own discount card" ON public.discount_cards TO authenticated;

ALTER POLICY "Doctors can manage own absences" ON public.doctor_absences TO authenticated;

ALTER POLICY "Admins can do everything with invite codes" ON public.doctor_invite_codes TO authenticated;

ALTER POLICY "Doctors can create verifications" ON public.document_verifications TO authenticated;