import { useParams, useNavigate } from "react-router-dom";
import PreConsultationForm from "./PreConsultationForm";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { ArrowLeft } from "lucide-react";

const PreConsultationPage = () => {
  const { appointmentId } = useParams();
  const navigate = useNavigate();

  if (!appointmentId) {
    navigate("/dashboard/appointments");
    return null;
  }

  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("home")} role="patient">
      <div className="max-w-lg mx-auto pb-24 md:pb-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>
        <PreConsultationForm
          appointmentId={appointmentId}
          onComplete={() => navigate("/dashboard/appointments")}
        />
      </div>
    </DashboardLayout>
  );
};

export default PreConsultationPage;
