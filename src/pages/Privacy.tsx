import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const Privacy = () => (
  <div className="min-h-screen bg-background">
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar ao início
      </Link>
      <h1 className="text-3xl font-bold text-foreground mb-6">Política de Privacidade</h1>
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-4">
        <p className="text-foreground font-medium">Última atualização: Fevereiro de 2026</p>

        <h2 className="text-xl font-bold text-foreground mt-8">1. Dados Coletados</h2>
        <p>Coletamos dados pessoais necessários para a prestação do serviço: nome, e-mail, CPF, data de nascimento, dados de saúde durante consultas médicas.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">2. Finalidade do Tratamento</h2>
        <p>Os dados são utilizados para: prestação de serviços médicos, emissão de receitas e atestados, comunicação sobre consultas e cobranças.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">3. Base Legal (LGPD)</h2>
        <p>O tratamento de dados é realizado com base no consentimento do titular, execução de contrato e proteção da vida/saúde do titular.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">4. Compartilhamento de Dados</h2>
        <p>Dados de saúde são compartilhados apenas entre o paciente e seu médico. Não vendemos dados pessoais a terceiros.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">5. Segurança</h2>
        <p>Utilizamos criptografia e controles de acesso para proteger seus dados. Conexões são realizadas via HTTPS e as videochamadas são criptografadas.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">6. Retenção de Dados</h2>
        <p>Prontuários médicos são mantidos pelo prazo legal de 20 anos conforme CFM. Demais dados são mantidos enquanto a conta estiver ativa.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">7. Direitos do Titular</h2>
        <p>Você pode solicitar acesso, correção, exclusão ou portabilidade de seus dados através do e-mail privacidade@alomedico.com.br.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">8. Cookies</h2>
        <p>Utilizamos cookies essenciais para o funcionamento da plataforma e cookies analíticos para melhorar a experiência.</p>
      </div>
    </div>
  </div>
);

export default Privacy;
