/** Shared domain types used across components */

/** Generic chart data — any key/value shape for Recharts */
export type ChartDataPoint = Record<string, string | number>;

export interface SpecialtyJoinRow {
  doctor_id: string;
  specialties?: { name?: string } | null;
}

export interface DoctorProfileRow {
  id: string;
  user_id: string;
  crm: string;
  crm_state: string;
  is_approved: boolean | null;
  crm_verified?: boolean;
  crm_verified_at?: string | null;
  bio: string | null;
  consultation_price: number | null;
  experience_years: number | null;
  education: string | null;
  rating?: number | null;
  total_reviews?: number | null;
  created_at: string;
  available_now?: boolean;
}

export interface DoctorWithProfile extends DoctorProfileRow {
  first_name?: string;
  last_name?: string;
  phone?: string | null;
  cpf?: string | null;
  specialties?: string[];
}

export interface AppointmentRow {
  id: string;
  scheduled_at: string;
  status: string;
  doctor_id: string;
  patient_id?: string | null;
  duration_minutes?: number | null;
  appointment_type?: string | null;
  price_at_booking?: number | null;
  notes?: string | null;
  video_room_url?: string | null;
  jitsi_link?: string | null;
  access_token?: string | null;
  guest_patient_id?: string | null;
  payment_status?: string | null;
  cancel_reason?: string | null;
  cancelled_by?: string | null;
  return_deadline?: string | null;
  original_appointment_id?: string | null;
}

export interface ClinicProfileRow {
  id: string;
  user_id: string;
  name: string;
  cnpj: string | null;
  address: string | null;
  phone: string | null;
  is_approved: boolean | null;
  created_at: string;
}

export interface PartnerProfileRow {
  id: string;
  user_id: string;
  business_name: string;
  partner_type: string;
  cnpj: string | null;
  is_approved: boolean | null;
  created_at: string;
}

export interface MedicationItem {
  name: string;
  dosage: string;
  frequency?: string;
  duration?: string;
  notes?: string;
}

export interface WithdrawalRow {
  id: string;
  amount: number;
  status: string;
  created_at: string;
}

export interface PaymentResponse {
  paymentId?: string;
  subscriptionId?: string;
  pixCopyPaste?: string;
  invoiceUrl?: string;
  bankSlipUrl?: string;
  payment?: {
    id?: string;
    invoiceUrl?: string;
  };
}

// ─── Admin Types ──────────────────────────────────────────────────────────────

export type TrendIndicator = "↑" | "↓" | "⚠" | "✓" | null;

export interface AdminKpiItem {
  label: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  bg: string;
  path?: string;
  trend?: TrendIndicator;
}

export interface AdminStats {
  total_revenue: number;
  active_subs: number;
  overdue_subs: number;
  total_patients: number;
  total_doctors: number;
  monthly_appts: number;
  total_laudos: number;
  avg_nps: number;
  period?: string;
}

// ─── Exam / Laudo Types ───────────────────────────────────────────────────────

export interface ExamRequest {
  id: string;
  requesting_doctor_id: string;
  patient_id?: string | null;
  exam_type: string;
  status: string;
  assigned_to?: string | null;
  created_at: string;
  updated_at?: string;
  notes?: string | null;
}

export interface ExamReport {
  id: string;
  exam_request_id: string;
  reporter_id: string;
  content_text: string;
  signed_at?: string | null;
  verification_code?: string | null;
  created_at: string;
}

export interface ReportTemplate {
  id: string;
  title: string;
  content: string;
  is_active: boolean;
  created_at: string;
}

// ─── AI Conversation Types ────────────────────────────────────────────────────

export interface AiConversation {
  id: string;
  user_id: string;
  role: "user" | "assistant";
  content: string;
  context?: string | null;
  created_at: string;
}

// ─── NPS Types ────────────────────────────────────────────────────────────────

export interface NpsRow {
  id: string;
  appointment_id?: string | null;
  patient_id?: string | null;
  nps_score: number;
  feedback?: string | null;
  created_at: string;
}

// ─── Doctor Earnings ──────────────────────────────────────────────────────────

export interface DoctorAffiliation {
  id: string;
  doctor_id: string;
  clinic_id: string;
  commission_percent: number;
  clinic_profiles?: { name: string } | null;
}

// ─── Plans ────────────────────────────────────────────────────────────────────

export interface PlanPayload {
  name: string;
  price: number;
  description?: string | null;
  features?: string[] | null;
  is_active?: boolean;
  billing_period?: "monthly" | "annual";
}

// ─── Affiliate ────────────────────────────────────────────────────────────────

export interface AffiliateProfile {
  id: string;
  user_id: string;
  referral_code: string;
  commission_percent: number;
  total_earned: number;
  is_approved: boolean;
  created_at: string;
}

// ─── Admin Component Row Types ────────────────────────────────────────────────

export interface AdminAppointmentRow {
  id: string;
  scheduled_at: string;
  status: string;
  patient_id: string | null;
  doctor_id: string;
  duration_minutes: number | null;
  notes: string | null;
  appointment_type: string | null;
  patient_name?: string;
  doctor_name?: string;
  price_at_booking?: number | null;
  payment_status?: string | null;
  created_at?: string;
}

export interface AuditLog {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  user_id: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface CouponRow {
  id: string;
  code: string;
  discount_type: "percent" | "fixed";
  discount_value: number;
  max_uses: number | null;
  uses_count: number;
  valid_from: string | null;
  valid_until: string | null;
  is_active: boolean;
  created_at: string;
}

export interface InviteCode {
  id: string;
  code: string;
  role: string;
  uses_left: number | null;
  created_by: string | null;
  created_at: string;
  expires_at: string | null;
}

export interface SpecialtyRow {
  id: string;
  name: string;
  description: string | null;
  consultation_price: number | null;
  created_at?: string;
}

export interface SubscriptionRow {
  id: string;
  user_id: string;
  plan_id: string;
  status: string;
  started_at: string;
  ends_at: string | null;
  payment_method: string | null;
  notes: string | null;
  created_at: string;
  profiles?: { first_name: string; last_name: string; email?: string } | null;
  plans?: { name: string; price: number } | null;
}

export interface SurveyRow {
  id: string;
  appointment_id: string | null;
  patient_id: string | null;
  nps_score: number;
  feedback: string | null;
  doctor_id?: string | null;
  created_at: string;
}

export interface ApprovalItem {
  id: string;
  user_id: string;
  first_name?: string;
  last_name?: string;
  name?: string;
  email?: string;
  is_approved: boolean | null;
  created_at: string;
  crm?: string;
  crm_state?: string;
  rejection_reason?: string | null;
}

export interface PlanRow {
  id: string;
  name: string;
  price: number;
  description: string | null;
  features: string[] | null;
  is_active: boolean;
  billing_period?: string | null;
  max_appointments?: number | null;
  created_at?: string;
}

export interface DoctorPerformanceRow {
  doctor_id: string;
  doctor_name: string;
  total: number;
  avg_rating: number;
  revenue: number;
}

export interface RevenueDataRow {
  month: string;
  revenue: number;
  appointments: number;
}
