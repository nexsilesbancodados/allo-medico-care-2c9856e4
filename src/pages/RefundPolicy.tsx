import { Link } from "react-router-dom";
import { ReceiptText, Clock, XCircle, RefreshCw } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import SEOHead from "@/components/SEOHead";
import InstitutionalHero from "@/components/landing/InstitutionalHero";

const RefundPolicy = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Política de Reembolso" description="Conheça a política de cancelamento e reembolso da AloClinica." />
    
    <InstitutionalHero title="Política de Reembolso e Cancelamento" icon={ReceiptText} lastUpdate="Fevereiro de 2026" />

    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <div className="grid sm:grid-cols-3 gap-3 mb-8">
        {[
          { icon: Clock, title: "Até 2h antes", desc: "Cancelamento gratuito", color: "text-primary bg-primary/10" },
          { icon: XCircle, title: "Menos de 2h", desc: "Cobrança integral", color: "text-destructive bg-destructive/10" },
          { icon: RefreshCw, title: "7 dias", desc: "Direito de arrependimento", color: "text-secondary bg-secondary/10" },
        ].map((item, i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4 text-center">
              <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center mx-auto mb-2`}>
                <item.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-semibold text-foreground">{item.title}</p>
              <p className="text-xs text-muted-foreground">{item.desc}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">

        <h2 className="text-xl font-bold text-foreground">1. Cancelamento de Consultas Agendadas</h2>
        <h3 className="text-base font-semibold text-foreground mt-4">1.1. Cancelamento pelo Paciente</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Com mais de 2 horas de antecedência:</strong> cancelamento gratuito com reembolso integral ou crédito na conta;</li>
          <li><strong>Com menos de 2 horas de antecedência:</strong> será cobrado o valor integral da consulta como taxa de no-show;</li>
          <li><strong>Não comparecimento (no-show):</strong> sem direito a reembolso.</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground mt-4">1.2. Cancelamento pelo Médico</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Caso o médico cancele ou não compareça à consulta, o paciente terá direito a <strong>reembolso integral</strong> ou reagendamento sem custo adicional;</li>
          <li>O paciente será notificado imediatamente e poderá escolher entre reembolso ou reagendamento;</li>
          <li>Em caso de cancelamento recorrente por parte de um médico, a AloClinica poderá suspender ou desativar seu cadastro.</li>
        </ul>

        <h3 className="text-base font-semibold text-foreground mt-4">1.3. Problemas Técnicos</h3>
        <ul className="list-disc pl-6 space-y-1">
          <li>Se a consulta não puder ser realizada por falha técnica da Plataforma (servidor, videochamada), o paciente será reembolsado integralmente;</li>
          <li>Se o problema for na conexão de internet do paciente ou do médico, a consulta poderá ser reagendada sem custo, mediante comprovação;</li>
          <li>Os logs de presença em vídeo (horário de entrada/saída) são utilizados para verificar se a consulta efetivamente ocorreu.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-6">2. Cancelamento de Planos de Assinatura</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Planos podem ser cancelados a qualquer momento pelo painel do paciente;</li>
          <li>O acesso aos benefícios do plano será mantido até o final do período já pago;</li>
          <li>Não há reembolso proporcional pelo período não utilizado após o período de arrependimento;</li>
          <li>Consultas já agendadas dentro do período pago serão mantidas.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-6">3. Direito de Arrependimento</h2>
        <p>Conforme o Art. 49 do Código de Defesa do Consumidor, o paciente tem direito ao arrependimento em até <strong>7 (sete) dias corridos</strong> após a primeira contratação (assinatura de plano ou primeira consulta avulsa), recebendo reembolso integral, desde que:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Nenhuma consulta tenha sido realizada no período;</li>
          <li>O pedido seja feito por escrito (e-mail para contato@aloclinica.com.br).</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-6">4. Créditos e Saldo</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Cancelamentos elegíveis geram créditos na conta do paciente, que podem ser utilizados em futuras consultas;</li>
          <li>Créditos de indicação ("Indique e Ganhe") não são reembolsáveis em dinheiro;</li>
          <li>Créditos expiram após 12 meses da data de emissão;</li>
          <li>Em caso de encerramento da conta, créditos restantes serão perdidos.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-6">5. Consultas de Retorno</h2>
        <p>Consultas de retorno (agendadas dentro do prazo estipulado pelo médico, geralmente 15 dias) têm valor R$ 0,00 e não são passíveis de reembolso, por serem gratuitas. Caso o paciente não compareça ao retorno, perde o direito à gratuidade.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">6. Disputas e Chargebacks</h2>
        <p>Em caso de contestação junto à operadora do cartão (chargeback), a AloClinica utilizará os logs de presença em videoconsulta como evidência de realização do serviço. Chargebacks fraudulentos resultarão em suspensão imediata da conta.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">7. Como Solicitar Reembolso</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li>Pelo painel do paciente: Configurações → Histórico de Pagamentos → Solicitar Reembolso;</li>
          <li>Por e-mail: contato@aloclinica.com.br com assunto "Reembolso - [seu CPF]";</li>
          <li>Prazo de processamento: até 10 dias úteis para estorno no cartão ou 5 dias para crédito em conta AloClinica.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-6">8. Contato</h2>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>E-mail:</strong> contato@aloclinica.com.br</li>
          <li><strong>Telefone:</strong> 0800 123 4567</li>
          <li><strong>Horário de atendimento:</strong> Seg-Sex, 8h-20h</li>
        </ul>

        <div className="mt-10 p-4 rounded-xl bg-muted text-xs text-muted-foreground">
          <p>Esta Política está em conformidade com o Código de Defesa do Consumidor (Lei nº 8.078/1990) e as regulamentações do Banco Central para transações digitais.</p>
        </div>
      </div>
    </div>
  </div>
);

export default RefundPolicy;
