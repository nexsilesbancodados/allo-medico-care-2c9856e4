import AuthSimpleRole from "./AuthSimpleRole";
import { ClipboardList } from "lucide-react";
import pingoReception from "@/assets/pingo-reception.png";

const AuthRecepcionista = () => (
  <AuthSimpleRole
    role="receptionist"
    title="Portal da Recepção"
    subtitle="Gestão de atendimento"
    description="Gerencie agendamentos, check-ins e faturamento dos pacientes da clínica."
    seoDescription="Acesse o painel de recepção da AloClinica."
    icon={ClipboardList}
    gradientFrom="primary/70"
    gradientTo="secondary/70"
    features={["Check-in de pacientes", "Gestão de agendamentos", "Confirmação de pagamentos", "Controle de fila de espera"]}
    placeholder="recepcao@clinica.com"
    bottomLabel="Recepção"
    bottomIcon={ClipboardList}
    bottomIconColor="text-primary"
    mascotSrc={pingoReception}
  />
);

export default AuthRecepcionista;
