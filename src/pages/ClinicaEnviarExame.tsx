import { useNavigate } from "react-router-dom";
import UploadExame from "@/components/exames/UploadExame";

export default function ClinicaEnviarExamePage() {
  const navigate = useNavigate();

  return (
    <div className="max-w-2xl mx-auto p-4 md:p-6">
      <UploadExame onSuccess={() => navigate("/clinica/exames")} />
    </div>
  );
}
