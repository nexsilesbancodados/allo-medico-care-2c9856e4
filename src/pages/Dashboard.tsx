import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import PatientDashboard from "@/components/dashboards/PatientDashboard";
import DoctorDashboard from "@/components/dashboards/DoctorDashboard";
import ClinicDashboard from "@/components/dashboards/ClinicDashboard";
import AdminDashboard from "@/components/dashboards/AdminDashboard";
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

  // Priority: admin > doctor > clinic > patient
  if (roles.includes("admin")) return <AdminDashboard />;
  if (roles.includes("doctor")) return <DoctorDashboard />;
  if (roles.includes("clinic")) return <ClinicDashboard />;
  return <PatientDashboard />;
};

export default Dashboard;
