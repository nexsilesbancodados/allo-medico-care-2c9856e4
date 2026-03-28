import { useParams, useNavigate } from "react-router-dom";
import PreConsultationForm from "./PreConsultationForm";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "./patientNav";
import { ArrowLeft, FileText } from "lucide-react";
import { motion } from "framer-motion";

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
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" /> Voltar
        </button>

        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 mb-6"
        >
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-foreground">Formulário Pré-Consulta</h1>
            <p className="text-xs text-muted-foreground">
              Preencha para o médico se preparar melhor
            </p>
          </div>
        </motion.div>

        <PreConsultationForm
          appointmentId={appointmentId}
          onComplete={() => navigate("/dashboard/appointments")}
        />
      </div>
    </DashboardLayout>
  );
};

export default PreConsultationPage;
