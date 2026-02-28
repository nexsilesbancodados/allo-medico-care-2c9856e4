import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRole?: "patient" | "doctor" | "clinic" | "admin" | "receptionist" | "support" | "partner" | "affiliate";
}

const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { user, roles, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    // Redirect to the correct auth page based on required role
    if (requiredRole === "patient") return <Navigate to="/paciente" replace />;
    if (requiredRole === "doctor") return <Navigate to="/medico" replace />;
    if (requiredRole === "clinic") return <Navigate to="/clinica" replace />;
    return <Navigate to="/auth" replace />;
  }

  if (requiredRole && !roles.includes(requiredRole) && !roles.includes("admin")) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
