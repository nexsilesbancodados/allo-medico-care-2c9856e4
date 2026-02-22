import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Routes, Route, useSearchParams } from "react-router-dom";
import { usePresence } from "@/hooks/use-presence";
import { lazy, Suspense, ReactNode } from "react";
import { Loader2 } from "lucide-react";

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <Loader2 className="w-8 h-8 animate-spin text-primary" />
  </div>
);

// Lazy-loaded dashboard components for code-splitting
const PatientDashboard = lazy(() => import("@/components/dashboards/PatientDashboard"));
const DoctorDashboard = lazy(() => import("@/components/dashboards/DoctorDashboard"));
const ClinicDashboard = lazy(() => import("@/components/dashboards/ClinicDashboard"));
const AdminDashboard = lazy(() => import("@/components/dashboards/AdminDashboard"));
const ReceptionDashboard = lazy(() => import("@/components/dashboards/ReceptionDashboard"));
const SupportDashboard = lazy(() => import("@/components/dashboards/SupportDashboard"));
const PartnerDashboard = lazy(() => import("@/components/dashboards/PartnerDashboard"));
const AffiliateDashboard = lazy(() => import("@/components/dashboards/AffiliateDashboard"));

// Patient
const DoctorSearch = lazy(() => import("@/components/patient/DoctorSearch"));
const AppointmentsList = lazy(() => import("@/components/patient/AppointmentsList"));
const BookAppointment = lazy(() => import("@/components/patient/BookAppointment"));
const PlansCheckout = lazy(() => import("@/components/patient/PlansCheckout"));
const MedicalHistory = lazy(() => import("@/components/patient/MedicalHistory"));
const PaymentHistory = lazy(() => import("@/components/patient/PaymentHistory"));
const PatientExamUpload = lazy(() => import("@/components/patient/PatientExamUpload"));
const PatientHealth = lazy(() => import("@/components/patient/PatientHealth"));
const PatientSupportChat = lazy(() => import("@/components/patient/PatientSupportChat"));
const DependentsManager = lazy(() => import("@/components/patient/DependentsManager"));
const HealthTimeline = lazy(() => import("@/components/patient/HealthTimeline"));
const SymptomDiary = lazy(() => import("@/components/patient/SymptomDiary"));

// Doctor
const DoctorAvailability = lazy(() => import("@/components/doctor/DoctorAvailability"));
const DoctorPatients = lazy(() => import("@/components/doctor/DoctorPatients"));
const DoctorPrescriptions = lazy(() => import("@/components/doctor/DoctorPrescriptions"));
const DoctorEarnings = lazy(() => import("@/components/doctor/DoctorEarnings"));
const MedicalCertificate = lazy(() => import("@/components/doctor/MedicalCertificate"));
const DoctorConsultations = lazy(() => import("@/components/doctor/DoctorConsultations"));
const DoctorCalendar = lazy(() => import("@/components/doctor/DoctorCalendar"));
const DoctorWaitingRoom = lazy(() => import("@/components/doctor/DoctorWaitingRoom"));
const PatientDocuments = lazy(() => import("@/components/doctor/PatientDocuments"));
const DoctorPublicProfile = lazy(() => import("@/components/doctor/DoctorPublicProfile"));

// Consultation
const VideoRoom = lazy(() => import("@/components/consultation/VideoRoom"));
const PrescriptionForm = lazy(() => import("@/components/consultation/PrescriptionForm"));
const RateConsultationPage = lazy(() => import("@/components/patient/RateConsultationPage"));
const PreConsultationPage = lazy(() => import("@/components/patient/PreConsultationPage"));

// Shared
const UserProfile = lazy(() => import("@/components/profile/UserProfile"));
const ChatPage = lazy(() => import("@/components/chat/ChatPage"));
const MedicalRecords = lazy(() => import("@/components/medical/MedicalRecords"));
const PanelSettings = lazy(() => import("@/components/settings/PanelSettings"));
const AIAssistantPanel = lazy(() => import("@/components/ai/AIAssistantPanel"));

// Clinic
const ClinicDoctorsManagement = lazy(() => import("@/components/clinic/ClinicDoctorsManagement"));

// Reception
const ReceptionSchedules = lazy(() => import("@/components/reception/ReceptionSchedules"));
const ReceptionCheckin = lazy(() => import("@/components/reception/ReceptionCheckin"));
const ReceptionBilling = lazy(() => import("@/components/reception/ReceptionBilling"));

// Admin
const AdminDoctors = lazy(() => import("@/components/admin/AdminDoctors"));
const AdminPatients = lazy(() => import("@/components/admin/AdminPatients"));
const AdminClinics = lazy(() => import("@/components/admin/AdminClinics"));
const AdminAppointments = lazy(() => import("@/components/admin/AdminAppointments"));
const AdminSpecialties = lazy(() => import("@/components/admin/AdminSpecialties"));
const AdminPlans = lazy(() => import("@/components/admin/AdminPlans"));
const AdminSubscriptions = lazy(() => import("@/components/admin/AdminSubscriptions"));
const AdminLogs = lazy(() => import("@/components/admin/AdminLogs"));
const AdminInviteCodes = lazy(() => import("@/components/admin/AdminInviteCodes"));
const AdminReports = lazy(() => import("@/components/admin/AdminReports"));
const AdminUsers = lazy(() => import("@/components/admin/AdminUsers"));
const AdminApprovals = lazy(() => import("@/components/admin/AdminApprovals"));
const AdminSwitchPanel = lazy(() => import("@/components/admin/AdminSwitchPanel"));
const AdminNPS = lazy(() => import("@/components/admin/AdminNPS"));
const AdminWhatsApp = lazy(() => import("@/components/admin/AdminWhatsApp"));
const AdminLiveConsultations = lazy(() => import("@/components/admin/AdminLiveConsultations"));
const SystemHealth = lazy(() => import("@/components/admin/SystemHealth"));
const PanelCenter = lazy(() => import("@/components/admin/PanelCenter"));

const RoleGuard = ({ allowed, roles, children }: { allowed: string[]; roles: string[]; children: ReactNode }) => {
  const isAdmin = roles.includes("admin");
  if (isAdmin) return <>{children}</>;
  if (allowed.some(r => roles.includes(r))) return <>{children}</>;
  return <Navigate to="/dashboard" replace />;
};

const Dashboard = () => {
  const { user, roles, loading } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const forceRole = searchParams.get("role");
  usePresence();

  if (loading) {
    return <PageLoader />;
  }

  if (!user) return <Navigate to="/auth" replace />;

  const isAdmin = roles.includes("admin");
  const validForceRoles = ["patient", "doctor", "receptionist", "support", "clinic", "partner", "affiliate", "admin"];
  
  // Determine primary role - admin always defaults to admin unless explicitly forced
  const primaryRole = isAdmin && forceRole && validForceRoles.includes(forceRole)
    ? forceRole
    : isAdmin ? "admin"
    : roles.includes("doctor") ? "doctor"
    : roles.includes("receptionist") ? "receptionist"
    : roles.includes("support") ? "support"
    : roles.includes("clinic") ? "clinic"
    : roles.includes("partner") ? "partner"
    : roles.includes("affiliate") ? "affiliate"
    : "patient";

  // Determine which dashboard to show at index based on the current role context
  const IndexDashboard = () => {
    // Admin without explicit ?role= goes to Panel Center
    // Admin WITH ?role=admin goes to AdminDashboard
    if (isAdmin && !forceRole) return <Navigate to="/dashboard/admin/panel-center" replace />;
    switch (primaryRole) {
      case "admin": return <AdminDashboard />;
      case "doctor": return <DoctorDashboard />;
      case "receptionist": return <ReceptionDashboard />;
      case "support": return <SupportDashboard />;
      case "clinic": return <ClinicDashboard />;
      case "partner": return <PartnerDashboard />;
      case "affiliate": return <AffiliateDashboard />;
      default: return <PatientDashboard />;
    }
  };

  return (
    <Suspense fallback={<PageLoader />}>
    <Routes>
      {/* ─── Main dashboard index — shows dashboard based on primaryRole ─── */}
      <Route index element={<IndexDashboard />} />

      {/* ─── Role-based dashboard explicit routes ─── */}
      <Route path="patient" element={<RoleGuard allowed={["patient"]} roles={roles}><PatientDashboard /></RoleGuard>} />
      <Route path="doctor" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorDashboard /></RoleGuard>} />
      <Route path="clinic" element={<RoleGuard allowed={["clinic"]} roles={roles}><ClinicDashboard /></RoleGuard>} />
      <Route path="admin" element={<RoleGuard allowed={[]} roles={roles}><AdminDashboard /></RoleGuard>} />
      <Route path="receptionist" element={<RoleGuard allowed={["receptionist"]} roles={roles}><ReceptionDashboard /></RoleGuard>} />
      <Route path="support" element={<RoleGuard allowed={["support"]} roles={roles}><SupportDashboard /></RoleGuard>} />
      <Route path="partner" element={<RoleGuard allowed={["partner"]} roles={roles}><PartnerDashboard /></RoleGuard>} />
      <Route path="affiliate" element={<RoleGuard allowed={["affiliate"]} roles={roles}><AffiliateDashboard /></RoleGuard>} />

      {/* Shared routes */}
      <Route path="profile" element={<UserProfile />} />
      <Route path="settings" element={<PanelSettings />} />
      <Route path="ai-assistant" element={<AIAssistantPanel />} />

      {/* Patient routes */}
      <Route path="doctors" element={<RoleGuard allowed={["patient"]} roles={roles}><DoctorSearch /></RoleGuard>} />
      <Route path="appointments" element={<RoleGuard allowed={["patient"]} roles={roles}><AppointmentsList /></RoleGuard>} />
      <Route path="schedule" element={<RoleGuard allowed={["patient"]} roles={roles}><DoctorSearch /></RoleGuard>} />
      <Route path="schedule/:doctorId" element={<RoleGuard allowed={["patient"]} roles={roles}><BookAppointment /></RoleGuard>} />
      <Route path="plans" element={<RoleGuard allowed={["patient"]} roles={roles}><PlansCheckout /></RoleGuard>} />
      <Route path="history" element={<RoleGuard allowed={["patient"]} roles={roles}><MedicalHistory /></RoleGuard>} />
      <Route path="payment-history" element={<RoleGuard allowed={["patient"]} roles={roles}><PaymentHistory /></RoleGuard>} />
      <Route path="patient/documents" element={<RoleGuard allowed={["patient"]} roles={roles}><PatientExamUpload /></RoleGuard>} />
      <Route path="patient/health" element={<RoleGuard allowed={["patient"]} roles={roles}><PatientHealth /></RoleGuard>} />
      <Route path="patient/support" element={<RoleGuard allowed={["patient"]} roles={roles}><PatientSupportChat /></RoleGuard>} />
      <Route path="patient/dependents" element={<RoleGuard allowed={["patient"]} roles={roles}><DependentsManager /></RoleGuard>} />
      <Route path="chat" element={<RoleGuard allowed={["patient", "doctor"]} roles={roles}><ChatPage /></RoleGuard>} />
      <Route path="medical-records" element={<RoleGuard allowed={["patient", "doctor"]} roles={roles}><MedicalRecords /></RoleGuard>} />
      <Route path="timeline" element={<RoleGuard allowed={["patient"]} roles={roles}><HealthTimeline /></RoleGuard>} />
      <Route path="patient/diary" element={<RoleGuard allowed={["patient"]} roles={roles}><SymptomDiary /></RoleGuard>} />

      {/* Doctor routes */}
      <Route path="availability" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorAvailability /></RoleGuard>} />
      <Route path="patients" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorPatients /></RoleGuard>} />
      <Route path="prescriptions" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorPrescriptions /></RoleGuard>} />
      <Route path="earnings" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorEarnings /></RoleGuard>} />
      <Route path="certificates" element={<RoleGuard allowed={["doctor"]} roles={roles}><MedicalCertificate /></RoleGuard>} />
      <Route path="doctor/consultations" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorConsultations /></RoleGuard>} />
      <Route path="doctor/calendar" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorCalendar /></RoleGuard>} />
      <Route path="doctor/waiting-room" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorWaitingRoom /></RoleGuard>} />
      <Route path="doctor/documents" element={<RoleGuard allowed={["doctor"]} roles={roles}><PatientDocuments /></RoleGuard>} />

      {/* Consultation routes */}
      <Route path="consultation/:appointmentId" element={<RoleGuard allowed={["doctor", "patient"]} roles={roles}><VideoRoom /></RoleGuard>} />
      <Route path="prescribe/:appointmentId" element={<RoleGuard allowed={["doctor"]} roles={roles}><PrescriptionForm /></RoleGuard>} />
      <Route path="rate/:appointmentId" element={<RoleGuard allowed={["patient"]} roles={roles}><RateConsultationPage /></RoleGuard>} />
      <Route path="pre-consultation/:appointmentId" element={<RoleGuard allowed={["patient"]} roles={roles}><PreConsultationPage /></RoleGuard>} />
      <Route path="doctor-profile/:doctorId" element={<DoctorPublicProfile />} />

      {/* Clinic routes */}
      <Route path="clinic/doctors" element={<RoleGuard allowed={["clinic"]} roles={roles}><ClinicDoctorsManagement /></RoleGuard>} />

      {/* Reception routes */}
      <Route path="reception/schedules" element={<RoleGuard allowed={["receptionist"]} roles={roles}><ReceptionSchedules /></RoleGuard>} />
      <Route path="reception/checkin" element={<RoleGuard allowed={["receptionist"]} roles={roles}><ReceptionCheckin /></RoleGuard>} />
      <Route path="reception/billing" element={<RoleGuard allowed={["receptionist"]} roles={roles}><ReceptionBilling /></RoleGuard>} />

      {/* Admin routes */}
      <Route path="admin/doctors" element={<RoleGuard allowed={[]} roles={roles}><AdminDoctors /></RoleGuard>} />
      <Route path="admin/users" element={<RoleGuard allowed={[]} roles={roles}><AdminUsers /></RoleGuard>} />
      <Route path="admin/patients" element={<RoleGuard allowed={[]} roles={roles}><AdminPatients /></RoleGuard>} />
      <Route path="admin/clinics" element={<RoleGuard allowed={[]} roles={roles}><AdminClinics /></RoleGuard>} />
      <Route path="admin/appointments" element={<RoleGuard allowed={[]} roles={roles}><AdminAppointments /></RoleGuard>} />
      <Route path="admin/specialties" element={<RoleGuard allowed={[]} roles={roles}><AdminSpecialties /></RoleGuard>} />
      <Route path="admin/plans" element={<RoleGuard allowed={[]} roles={roles}><AdminPlans /></RoleGuard>} />
      <Route path="admin/subscriptions" element={<RoleGuard allowed={[]} roles={roles}><AdminSubscriptions /></RoleGuard>} />
      <Route path="admin/logs" element={<RoleGuard allowed={[]} roles={roles}><AdminLogs /></RoleGuard>} />
      <Route path="admin/invite-codes" element={<RoleGuard allowed={[]} roles={roles}><AdminInviteCodes /></RoleGuard>} />
      <Route path="admin/reports" element={<RoleGuard allowed={[]} roles={roles}><AdminReports /></RoleGuard>} />
      <Route path="admin/approvals" element={<RoleGuard allowed={[]} roles={roles}><AdminApprovals /></RoleGuard>} />
      <Route path="admin/switch-panel" element={<RoleGuard allowed={[]} roles={roles}><AdminSwitchPanel /></RoleGuard>} />
      <Route path="admin/nps" element={<RoleGuard allowed={[]} roles={roles}><AdminNPS /></RoleGuard>} />
      <Route path="admin/whatsapp" element={<RoleGuard allowed={[]} roles={roles}><AdminWhatsApp /></RoleGuard>} />
      <Route path="admin/health" element={<RoleGuard allowed={[]} roles={roles}><SystemHealth /></RoleGuard>} />
      <Route path="admin/live" element={<RoleGuard allowed={[]} roles={roles}><AdminLiveConsultations /></RoleGuard>} />
      <Route path="admin/panel-center" element={<RoleGuard allowed={[]} roles={roles}><PanelCenter /></RoleGuard>} />

      {/* Fallback: redirect to role-appropriate dashboard */}
      <Route
        path="*"
        element={<Navigate to={`/dashboard${forceRole ? `?role=${forceRole}` : ''}`} replace />}
      />
    </Routes>
    </Suspense>
  );
};

export default Dashboard;
