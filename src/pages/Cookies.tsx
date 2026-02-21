import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import SEOHead from "@/components/SEOHead";

const Cookies = () => (
  <div className="min-h-screen bg-background">
    <SEOHead title="Política de Cookies" description="Saiba como a AloClinica utiliza cookies em sua plataforma." />
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <Link to="/" className="inline-flex items-center gap-2 mb-8 text-muted-foreground hover:text-foreground transition text-sm">
        <ArrowLeft className="w-4 h-4" /> Voltar ao início
      </Link>
      <h1 className="text-3xl font-bold text-foreground mb-2">Política de Cookies</h1>
      <p className="text-sm text-muted-foreground mb-8">Última atualização: Fevereiro de 2026</p>
      <div className="prose prose-sm max-w-none text-muted-foreground space-y-6">

        <h2 className="text-xl font-bold text-foreground">1. O que são Cookies?</h2>
        <p>Cookies são pequenos arquivos de texto armazenados no seu navegador quando você visita um site. Eles permitem que o site se lembre de suas preferências e melhore sua experiência de navegação.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">2. Tipos de Cookies Utilizados</h2>

        <h3 className="text-base font-semibold text-foreground mt-4">2.1. Cookies Estritamente Necessários</h3>
        <p>Essenciais para o funcionamento da plataforma. Não podem ser desativados.</p>
        <table className="w-full text-xs border-collapse mt-2">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-left text-foreground">Cookie</th>
              <th className="border border-border p-2 text-left text-foreground">Finalidade</th>
              <th className="border border-border p-2 text-left text-foreground">Duração</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="border border-border p-2">sb-auth-token</td><td className="border border-border p-2">Autenticação do usuário (sessão Supabase)</td><td className="border border-border p-2">Sessão</td></tr>
            <tr><td className="border border-border p-2">sb-refresh-token</td><td className="border border-border p-2">Renovação automática da sessão</td><td className="border border-border p-2">7 dias</td></tr>
            <tr><td className="border border-border p-2">theme</td><td className="border border-border p-2">Preferência de tema (claro/escuro)</td><td className="border border-border p-2">1 ano</td></tr>
            <tr><td className="border border-border p-2">accessibility</td><td className="border border-border p-2">Configurações de acessibilidade</td><td className="border border-border p-2">1 ano</td></tr>
          </tbody>
        </table>

        <h3 className="text-base font-semibold text-foreground mt-4">2.2. Cookies Analíticos</h3>
        <p>Utilizados para compreender como os visitantes interagem com a plataforma, permitindo melhorias contínuas.</p>
        <table className="w-full text-xs border-collapse mt-2">
          <thead>
            <tr className="bg-muted">
              <th className="border border-border p-2 text-left text-foreground">Cookie</th>
              <th className="border border-border p-2 text-left text-foreground">Finalidade</th>
              <th className="border border-border p-2 text-left text-foreground">Duração</th>
            </tr>
          </thead>
          <tbody>
            <tr><td className="border border-border p-2">_ga</td><td className="border border-border p-2">Identificação de visitante único (Analytics)</td><td className="border border-border p-2">2 anos</td></tr>
            <tr><td className="border border-border p-2">_gid</td><td className="border border-border p-2">Identificação de sessão (Analytics)</td><td className="border border-border p-2">24 horas</td></tr>
          </tbody>
        </table>

        <h3 className="text-base font-semibold text-foreground mt-4">2.3. Cookies de Desempenho</h3>
        <p>Monitoram o desempenho da plataforma para garantir estabilidade e velocidade.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">3. Como Gerenciar Cookies</h2>
        <p>Você pode controlar e/ou excluir cookies nas configurações do seu navegador:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li><strong>Chrome:</strong> Configurações → Privacidade e segurança → Cookies</li>
          <li><strong>Firefox:</strong> Opções → Privacidade e Segurança → Cookies</li>
          <li><strong>Safari:</strong> Preferências → Privacidade → Cookies</li>
          <li><strong>Edge:</strong> Configurações → Cookies e permissões do site</li>
        </ul>
        <p><strong>Atenção:</strong> desabilitar cookies essenciais pode impedir o funcionamento correto da plataforma, incluindo login e acesso às consultas.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">4. Local Storage e Session Storage</h2>
        <p>Além de cookies, utilizamos armazenamento local do navegador para:</p>
        <ul className="list-disc pl-6 space-y-1">
          <li>Manter o estado da sessão do usuário;</li>
          <li>Armazenar preferências de interface (tema, idioma);</li>
          <li>Cache de dados de navegação para melhorar a performance.</li>
        </ul>

        <h2 className="text-xl font-bold text-foreground mt-6">5. Alterações</h2>
        <p>Esta Política poderá ser atualizada periodicamente. Alterações significativas serão comunicadas por e-mail ou notificação na plataforma.</p>

        <h2 className="text-xl font-bold text-foreground mt-6">6. Contato</h2>
        <p>Dúvidas sobre cookies: <strong>privacidade@aloclinica.com.br</strong></p>

        <div className="mt-10 p-4 rounded-xl bg-muted text-xs text-muted-foreground">
          <p>Esta Política está em conformidade com a LGPD (Lei nº 13.709/2018) e a Diretiva de ePrivacy da União Europeia utilizada como referência de melhores práticas.</p>
        </div>
      </div>
    </div>
  </div>
);

export default Cookies;
