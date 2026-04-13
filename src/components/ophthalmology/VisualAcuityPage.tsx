import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { getPatientNav } from "@/components/patient/patientNav";
import VisualAcuityTest from "./VisualAcuityTest";

export default function VisualAcuityPage() {
  return (
    <DashboardLayout title="Paciente" nav={getPatientNav("visual-acuity")}>
      <div className="max-w-lg mx-auto pb-24 md:pb-8 pt-4">
        <h1 className="text-2xl font-bold text-foreground mb-6">Teste de Acuidade Visual</h1>
        <VisualAcuityTest />
      </div>
    </DashboardLayout>
  );
}
