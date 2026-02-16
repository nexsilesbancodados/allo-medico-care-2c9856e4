import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Terms = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar ao início
      </Link>
      <h1 className="text-3xl font-bold text-foreground mb-6">Termos de Uso</h1>
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
        <p className="text-foreground font-medium">Última atualização: Fevereiro de 2026</p>

        <h2 className="text-xl font-bold text-foreground mt-8">1. Aceitação dos Termos</h2>
        <p>Ao acessar e utilizar a plataforma AloClinica, você concorda com estes Termos de Uso. Caso não concorde, não utilize a plataforma.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">2. Descrição do Serviço</h2>
        <p>A AloClinica é uma plataforma de telemedicina que conecta pacientes a médicos para consultas por videochamada. Não substituímos atendimento presencial de emergência.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">3. Cadastro e Conta</h2>
        <p>O usuário é responsável por manter a confidencialidade de suas credenciais. Informações falsas ou incompletas podem resultar no cancelamento da conta.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">4. Consultas Médicas</h2>
        <p>As consultas são realizadas por médicos devidamente registrados no CRM. Receitas e atestados são emitidos digitalmente conforme legislação vigente.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">5. Pagamentos</h2>
        <p>Os valores dos planos e consultas avulsas são informados antes da contratação. Cancelamentos seguem a política de reembolso vigente.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">6. Privacidade</h2>
        <p>O tratamento de dados pessoais segue a LGPD (Lei Geral de Proteção de Dados). Consulte nossa <Link to="/privacy" className="text-primary hover:underline">Política de Privacidade</Link>.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">7. Limitação de Responsabilidade</h2>
        <p>A plataforma não se responsabiliza por diagnósticos médicos. A relação médico-paciente é de responsabilidade das partes envolvidas.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">8. Contato</h2>
        <p>Dúvidas sobre estes termos podem ser enviadas para contato@aloclinica.com.br.</p>
      </div>
    </div>
  </div>
);

export default Terms;
