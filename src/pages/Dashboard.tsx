import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Routes, Route, useSearchParams } from "react-router-dom";
import PatientDashboard from "@/components/dashboards/PatientDashboard";
import DoctorDashboard from "@/components/dashboards/DoctorDashboard";
import ClinicDashboard from "@/components/dashboards/ClinicDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import ReceptionDashboard from "@/components/dashboards/ReceptionDashboard";
import SupportDashboard from "@/components/dashboards/SupportDashboard";
import PartnerDashboard from "@/components/dashboards/PartnerDashboard";
import AffiliateDashboard from "@/components/dashboards/AffiliateDashboard";
import DoctorSearch from "@/components/patient/DoctorSearch";
import AppointmentsList from "@/components/patient/AppointmentsList";
import BookAppointment from "@/components/patient/BookAppointment";
import PlansCheckout from "@/components/patient/PlansCheckout";
import MedicalHistory from "@/components/patient/MedicalHistory";
import PaymentHistory from "@/components/patient/PaymentHistory";
import PatientExamUpload from "@/components/patient/PatientExamUpload";
import PatientHealth from "@/components/patient/PatientHealth";
import UserProfile from "@/components/profile/UserProfile";
import DoctorAvailability from "@/components/doctor/DoctorAvailability";
import DoctorPatients from "@/components/doctor/DoctorPatients";
import DoctorPrescriptions from "@/components/doctor/DoctorPrescriptions";
import DoctorEarnings from "@/components/doctor/DoctorEarnings";
import MedicalCertificate from "@/components/doctor/MedicalCertificate";
import DoctorConsultations from "@/components/doctor/DoctorConsultations";
import DoctorCalendar from "@/components/doctor/DoctorCalendar";
import DoctorWaitingRoom from "@/components/doctor/DoctorWaitingRoom";
import PatientDocuments from "@/components/doctor/PatientDocuments";
import VideoRoom from "@/components/consultation/VideoRoom";
import PrescriptionForm from "@/components/consultation/PrescriptionForm";
import ClinicDoctorsManagement from "@/components/clinic/ClinicDoctorsManagement";
import AdminDoctors from "@/components/admin/AdminDoctors";
import AdminPatients from "@/components/admin/AdminPatients";
import AdminClinics from "@/components/admin/AdminClinics";
import AdminAppointments from "@/components/admin/AdminAppointments";
import AdminSpecialties from "@/components/admin/AdminSpecialties";
import AdminPlans from "@/components/admin/AdminPlans";
import AdminSubscriptions from "@/components/admin/AdminSubscriptions";
import AdminLogs from "@/components/admin/AdminLogs";
import AdminInviteCodes from "@/components/admin/AdminInviteCodes";
import AdminReports from "@/components/admin/AdminReports";
import AdminUsers from "@/components/admin/AdminUsers";
import AdminApprovals from "@/components/admin/AdminApprovals";
import AdminSwitchPanel from "@/components/admin/AdminSwitchPanel";
import ReceptionSchedules from "@/components/reception/ReceptionSchedules";
import ReceptionCheckin from "@/components/reception/ReceptionCheckin";
import ReceptionBilling from "@/components/reception/ReceptionBilling";
import ChatPage from "@/components/chat/ChatPage";
import AdminNPS from "@/components/admin/AdminNPS";
import MedicalRecords from "@/components/medical/MedicalRecords";
import AdminWhatsApp from "@/components/admin/AdminWhatsApp";
import PanelSettings from "@/components/settings/PanelSettings";
import { Loader2 } from "lucide-react";
import { ReactNode } from "react";

const RoleGuard = ({ allowed, roles, children }: { allowed: string[]; roles: string[]; children: ReactNode }) => {
  const isAdmin = roles.includes("admin");
  if (isAdmin) return <>{children}</>;
  if (allowed.some(r => roles.includes(r))) return <>{children}</>;
  return <Navigate to="/dashboard" replace />;
};

const Dashboard = () => {
  const { user, roles, loading } = useAuth();
  const [searchParams] = useSearchParams();
  const forceRole = searchParams.get("role");

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  // Only admin can switch between all panels; others see only their own
  const isAdmin = roles.includes("admin");
  const validForceRoles = ["patient", "doctor", "receptionist", "support", "clinic", "partner", "affiliate", "admin"];
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

  return (
    <Routes>
      {/* Shared routes */}
      <Route path="profile" element={<UserProfile />} />
      <Route path="settings" element={<PanelSettings />} />

      {/* Patient routes — patients + admin */}
      <Route path="doctors" element={<RoleGuard allowed={["patient"]} roles={roles}><DoctorSearch /></RoleGuard>} />
      <Route path="appointments" element={<RoleGuard allowed={["patient"]} roles={roles}><AppointmentsList /></RoleGuard>} />
      <Route path="schedule" element={<RoleGuard allowed={["patient"]} roles={roles}><DoctorSearch /></RoleGuard>} />
      <Route path="schedule/:doctorId" element={<RoleGuard allowed={["patient"]} roles={roles}><BookAppointment /></RoleGuard>} />
      <Route path="plans" element={<RoleGuard allowed={["patient"]} roles={roles}><PlansCheckout /></RoleGuard>} />
      <Route path="history" element={<RoleGuard allowed={["patient"]} roles={roles}><MedicalHistory /></RoleGuard>} />
      <Route path="payment-history" element={<RoleGuard allowed={["patient"]} roles={roles}><PaymentHistory /></RoleGuard>} />
      <Route path="patient/documents" element={<RoleGuard allowed={["patient"]} roles={roles}><PatientExamUpload /></RoleGuard>} />
      <Route path="patient/health" element={<RoleGuard allowed={["patient"]} roles={roles}><PatientHealth /></RoleGuard>} />
      <Route path="chat" element={<RoleGuard allowed={["patient", "doctor"]} roles={roles}><ChatPage /></RoleGuard>} />
      <Route path="medical-records" element={<RoleGuard allowed={["patient", "doctor"]} roles={roles}><MedicalRecords /></RoleGuard>} />

      {/* Doctor routes — doctors + admin */}
      <Route path="availability" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorAvailability /></RoleGuard>} />
      <Route path="patients" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorPatients /></RoleGuard>} />
      <Route path="prescriptions" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorPrescriptions /></RoleGuard>} />
      <Route path="earnings" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorEarnings /></RoleGuard>} />
      <Route path="certificates" element={<RoleGuard allowed={["doctor"]} roles={roles}><MedicalCertificate /></RoleGuard>} />
      <Route path="doctor/consultations" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorConsultations /></RoleGuard>} />
      <Route path="doctor/calendar" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorCalendar /></RoleGuard>} />
      <Route path="doctor/waiting-room" element={<RoleGuard allowed={["doctor"]} roles={roles}><DoctorWaitingRoom /></RoleGuard>} />
      <Route path="doctor/documents" element={<RoleGuard allowed={["doctor"]} roles={roles}><PatientDocuments /></RoleGuard>} />

      {/* Consultation routes — doctor + patient + admin */}
      <Route path="consultation/:appointmentId" element={<RoleGuard allowed={["doctor", "patient"]} roles={roles}><VideoRoom /></RoleGuard>} />
      <Route path="prescribe/:appointmentId" element={<RoleGuard allowed={["doctor"]} roles={roles}><PrescriptionForm /></RoleGuard>} />

      {/* Clinic routes — clinic + admin */}
      <Route path="clinic/doctors" element={<RoleGuard allowed={["clinic"]} roles={roles}><ClinicDoctorsManagement /></RoleGuard>} />

      {/* Reception routes — receptionist + admin */}
      <Route path="reception/schedules" element={<RoleGuard allowed={["receptionist"]} roles={roles}><ReceptionSchedules /></RoleGuard>} />
      <Route path="reception/checkin" element={<RoleGuard allowed={["receptionist"]} roles={roles}><ReceptionCheckin /></RoleGuard>} />
      <Route path="reception/billing" element={<RoleGuard allowed={["receptionist"]} roles={roles}><ReceptionBilling /></RoleGuard>} />

      {/* Admin routes — admin only */}
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

      {/* Default: role-based dashboard */}
      <Route
        path="*"
        element={
          primaryRole === "admin" ? <AdminDashboard /> :
          primaryRole === "doctor" ? <DoctorDashboard /> :
          primaryRole === "receptionist" ? <ReceptionDashboard /> :
          primaryRole === "support" ? <SupportDashboard /> :
          primaryRole === "clinic" ? <ClinicDashboard /> :
          primaryRole === "partner" ? <PartnerDashboard /> :
          primaryRole === "affiliate" ? <AffiliateDashboard /> :
          <PatientDashboard />
        }
      />
    </Routes>
  );
};

export default Dashboard;
