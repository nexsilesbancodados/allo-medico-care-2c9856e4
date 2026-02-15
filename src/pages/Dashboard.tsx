import { useAuth } from "@/contexts/AuthContext";
import { Navigate, Routes, Route } from "react-router-dom";
import PatientDashboard from "@/components/dashboards/PatientDashboard";
import DoctorDashboard from "@/components/dashboards/DoctorDashboard";
import ClinicDashboard from "@/components/dashboards/ClinicDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
import DoctorSearch from "@/components/patient/DoctorSearch";
import AppointmentsList from "@/components/patient/AppointmentsList";
import BookAppointment from "@/components/patient/BookAppointment";
import DoctorAvailability from "@/components/doctor/DoctorAvailability";
import DoctorPatients from "@/components/doctor/DoctorPatients";
import DoctorPrescriptions from "@/components/doctor/DoctorPrescriptions";
import VideoRoom from "@/components/consultation/VideoRoom";
import PrescriptionForm from "@/components/consultation/PrescriptionForm";
import ClinicDoctorsManagement from "@/components/clinic/ClinicDoctorsManagement";
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
      {/* Patient routes */}
      <Route path="doctors" element={<DoctorSearch />} />
      <Route path="appointments" element={<AppointmentsList />} />
      <Route path="schedule" element={<DoctorSearch />} />
      <Route path="schedule/:doctorId" element={<BookAppointment />} />

      {/* Doctor routes */}
      <Route path="availability" element={<DoctorAvailability />} />
      <Route path="patients" element={<DoctorPatients />} />
      <Route path="prescriptions" element={<DoctorPrescriptions />} />

      {/* Consultation routes */}
      <Route path="consultation/:appointmentId" element={<VideoRoom />} />
      <Route path="prescribe/:appointmentId" element={<PrescriptionForm />} />

      {/* Clinic routes */}
      <Route path="clinic/doctors" element={<ClinicDoctorsManagement />} />

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
