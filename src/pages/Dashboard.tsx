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
import ReceptionSchedules from "@/components/reception/ReceptionSchedules";
import ReceptionCheckin from "@/components/reception/ReceptionCheckin";
import ReceptionBilling from "@/components/reception/ReceptionBilling";
import ChatPage from "@/components/chat/ChatPage";
import { Loader2 } from "lucide-react";

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

  const primaryRole = forceRole && roles.includes(forceRole as any)
    ? forceRole
    : roles.includes("admin") ? "admin"
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

      {/* Patient routes */}
      <Route path="doctors" element={<DoctorSearch />} />
      <Route path="appointments" element={<AppointmentsList />} />
      <Route path="schedule" element={<DoctorSearch />} />
      <Route path="schedule/:doctorId" element={<BookAppointment />} />
      <Route path="plans" element={<PlansCheckout />} />
      <Route path="history" element={<MedicalHistory />} />
      <Route path="payment-history" element={<PaymentHistory />} />
      <Route path="patient/documents" element={<PatientExamUpload />} />
      <Route path="patient/health" element={<PatientHealth />} />
      <Route path="chat" element={<ChatPage />} />

      {/* Doctor routes */}
      <Route path="availability" element={<DoctorAvailability />} />
      <Route path="patients" element={<DoctorPatients />} />
      <Route path="prescriptions" element={<DoctorPrescriptions />} />
      <Route path="earnings" element={<DoctorEarnings />} />
      <Route path="certificates" element={<MedicalCertificate />} />
      <Route path="doctor/consultations" element={<DoctorConsultations />} />
      <Route path="doctor/calendar" element={<DoctorCalendar />} />
      <Route path="doctor/waiting-room" element={<DoctorWaitingRoom />} />
      <Route path="doctor/documents" element={<PatientDocuments />} />

      {/* Consultation routes */}
      <Route path="consultation/:appointmentId" element={<VideoRoom />} />
      <Route path="prescribe/:appointmentId" element={<PrescriptionForm />} />

      {/* Clinic routes */}
      <Route path="clinic/doctors" element={<ClinicDoctorsManagement />} />

      {/* Reception routes */}
      <Route path="reception/schedules" element={<ReceptionSchedules />} />
      <Route path="reception/checkin" element={<ReceptionCheckin />} />
      <Route path="reception/billing" element={<ReceptionBilling />} />

      {/* Admin routes */}
      <Route path="admin/doctors" element={<AdminDoctors />} />
      <Route path="admin/users" element={<AdminUsers />} />
      <Route path="admin/patients" element={<AdminPatients />} />
      <Route path="admin/clinics" element={<AdminClinics />} />
      <Route path="admin/appointments" element={<AdminAppointments />} />
      <Route path="admin/specialties" element={<AdminSpecialties />} />
      <Route path="admin/plans" element={<AdminPlans />} />
      <Route path="admin/subscriptions" element={<AdminSubscriptions />} />
      <Route path="admin/logs" element={<AdminLogs />} />
      <Route path="admin/invite-codes" element={<AdminInviteCodes />} />
      <Route path="admin/reports" element={<AdminReports />} />
      <Route path="admin/approvals" element={<AdminApprovals />} />

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
