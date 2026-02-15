import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Routes, Route } from "react-router-dom";
import PatientDashboard from "@/components/dashboards/PatientDashboard";
import DoctorDashboard from "@/components/dashboards/DoctorDashboard";
import ClinicDashboard from "@/components/dashboards/ClinicDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import DoctorSearch from "@/components/patient/DoctorSearch";
import AppointmentsList from "@/components/patient/AppointmentsList";
import BookAppointment from "@/components/patient/BookAppointment";
import PlansCheckout from "@/components/patient/PlansCheckout";
import MedicalHistory from "@/components/patient/MedicalHistory";
import PaymentHistory from "@/components/patient/PaymentHistory";
import UserProfile from "@/components/profile/UserProfile";
import DoctorAvailability from "@/components/doctor/DoctorAvailability";
import DoctorPatients from "@/components/doctor/DoctorPatients";
import DoctorPrescriptions from "@/components/doctor/DoctorPrescriptions";
import DoctorEarnings from "@/components/doctor/DoctorEarnings";
import MedicalCertificate from "@/components/doctor/MedicalCertificate";
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
import { Loader2 } from "lucide-react";

const Dashboard = () => {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;

  const primaryRole = roles.includes("admin")
    ? "admin"
    : roles.includes("doctor")
    ? "doctor"
    : roles.includes("clinic")
    ? "clinic"
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

      {/* Doctor routes */}
      <Route path="availability" element={<DoctorAvailability />} />
      <Route path="patients" element={<DoctorPatients />} />
      <Route path="prescriptions" element={<DoctorPrescriptions />} />
      <Route path="earnings" element={<DoctorEarnings />} />
      <Route path="certificates" element={<MedicalCertificate />} />

      {/* Consultation routes */}
      <Route path="consultation/:appointmentId" element={<VideoRoom />} />
      <Route path="prescribe/:appointmentId" element={<PrescriptionForm />} />

      {/* Clinic routes */}
      <Route path="clinic/doctors" element={<ClinicDoctorsManagement />} />

      {/* Admin routes */}
      <Route path="admin/doctors" element={<AdminDoctors />} />
      <Route path="admin/patients" element={<AdminPatients />} />
      <Route path="admin/clinics" element={<AdminClinics />} />
      <Route path="admin/appointments" element={<AdminAppointments />} />
      <Route path="admin/specialties" element={<AdminSpecialties />} />
      <Route path="admin/plans" element={<AdminPlans />} />
      <Route path="admin/subscriptions" element={<AdminSubscriptions />} />
      <Route path="admin/logs" element={<AdminLogs />} />
      <Route path="admin/invite-codes" element={<AdminInviteCodes />} />
      <Route path="admin/reports" element={<AdminReports />} />

      {/* Default: role-based dashboard */}
      <Route
        path="*"
        element={
          primaryRole === "admin" ? <AdminDashboard /> :
          primaryRole === "doctor" ? <DoctorDashboard /> :
          primaryRole === "clinic" ? <ClinicDashboard /> :
          <PatientDashboard />
        }
      />
    </Routes>
  );
};

export default Dashboard;
