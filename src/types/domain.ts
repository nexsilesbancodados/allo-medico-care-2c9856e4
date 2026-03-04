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
