-- =====================================================
-- LIMPEZA COMPLETA: Remover dados operacionais de teste
-- Respeita foreign keys (ordem de dependência)
-- =====================================================

-- 1. Mensagens e chat
DELETE FROM public.messages;
DELETE FROM public.support_messages;
DELETE FROM public.support_chat_messages;
DELETE FROM public.support_tickets;

-- 2. Documentos médicos
DELETE FROM public.prescription_validations;
DELETE FROM public.prescriptions;
DELETE FROM public.consultation_notes;
DELETE FROM public.patient_documents;
DELETE FROM public.document_verifications;
DELETE FROM public.patient_consents;
DELETE FROM public.pre_consultation_symptoms;
DELETE FROM public.medical_records;

-- 3. Agendamentos e relacionados
DELETE FROM public.video_presence_logs;
DELETE FROM public.satisfaction_surveys;
DELETE FROM public.appointment_waitlist;
DELETE FROM public.appointments;

-- 4. Financeiro
DELETE FROM public.withdrawal_requests;
DELETE FROM public.user_credits;
DELETE FROM public.subscriptions;
DELETE FROM public.referrals;

-- 5. Notificações e presença
DELETE FROM public.notifications;
DELETE FROM public.push_subscriptions;
DELETE FROM public.user_presence;
DELETE FROM public.user_consents;
DELETE FROM public.activity_logs;

-- 6. AI conversations
DELETE FROM public.ai_conversations;

-- 7. Métricas e diário
DELETE FROM public.health_metrics;
DELETE FROM public.symptom_diary;

-- 8. Rate limits
DELETE FROM public.rate_limits;

-- 9. Favoritos e dependentes
DELETE FROM public.favorite_doctors;
DELETE FROM public.dependents;

-- 10. Perfis de médico (affiliations, specialties, absences, slots)
DELETE FROM public.clinic_affiliations;
DELETE FROM public.doctor_specialties;
DELETE FROM public.doctor_absences;
DELETE FROM public.availability_slots;

-- 11. Guest patients
DELETE FROM public.guest_patients;

-- 12. Convites usados
DELETE FROM public.doctor_invite_codes;

-- =====================================================
-- REMOVER CONTAS DE TESTE (manter apenas a5c1ac9a = plenasaudebv)
-- =====================================================

-- Remover perfis clínica/parceiro/médico de contas de teste
DELETE FROM public.doctor_profiles WHERE user_id != 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353';
DELETE FROM public.clinic_profiles WHERE user_id != 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353';
DELETE FROM public.partner_profiles WHERE user_id != 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353';

-- Remover roles de teste
DELETE FROM public.user_roles WHERE user_id != 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353';

-- Remover profiles de teste
DELETE FROM public.profiles WHERE user_id != 'a5c1ac9a-5368-4429-83a0-85e2b3d4a353';

-- Nota: contas no auth.users não podem ser deletadas via migration SQL.
-- Elas devem ser removidas manualmente no dashboard Supabase > Authentication > Users.