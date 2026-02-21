import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import DashboardLayout from "@/components/dashboards/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Send, Bot, Sparkles, Trash2, Copy, Check,
  Stethoscope, FileText, Calculator, Brain,
  ClipboardList, Users, BarChart3, MessageSquare
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";

// Nav imports based on role
import { getPatientNav } from "@/components/patient/patientNav";
import { getDoctorNav } from "@/components/doctor/doctorNav";
import { getAdminNav } from "@/components/admin/adminNav";
import { getReceptionNav } from "@/components/reception/receptionNav";

type Msg = { role: "user" | "assistant"; content: string };

const SUPABASE_URL = "https://oaixgmuocuwhsabidpei.supabase.co";
const AI_URL = `${SUPABASE_URL}/functions/v1/ai-assistant`;

interface QuickAction {
  label: string;
  prompt: string;
  icon: React.ElementType;
}

const quickActionsByRole: Record<string, QuickAction[]> = {
  patient: [
    { label: "Preparar para consulta", prompt: "Quais perguntas devo fazer ao médico na minha próxima consulta?", icon: ClipboardList },
    { label: "Entender meu plano", prompt: "Explique os benefícios do meu plano atual e se vale a pena fazer upgrade.", icon: BarChart3 },
    { label: "Sintomas comuns", prompt: "Tenho dor de cabeça frequente. Qual especialista devo procurar?", icon: Brain },
    { label: "Receita médica", prompt: "Ajude-me a entender minha última receita médica de forma simplificada.", icon: FileText },
  ],
  doctor: [
    { label: "Anamnese", prompt: "Sugira perguntas de anamnese para um paciente com queixa de dor torácica.", icon: Stethoscope },
    { label: "Nota SOAP", prompt: "Ajude-me a redigir uma nota clínica SOAP para uma consulta de rotina.", icon: FileText },
    { label: "Cálculo pediátrico", prompt: "Calcule a dosagem de amoxicilina para uma criança de 20kg.", icon: Calculator },
    { label: "CID-10", prompt: "Qual o CID-10 correto para infecção do trato urinário não complicada?", icon: ClipboardList },
  ],
  admin: [
    { label: "Análise NPS", prompt: "Analise a tendência de NPS e sugira ações para melhorar a satisfação.", icon: BarChart3 },
    { label: "Comunicado", prompt: "Redija um comunicado para médicos sobre nova funcionalidade de receita digital.", icon: MessageSquare },
    { label: "Métricas", prompt: "Quais KPIs devo monitorar para avaliar a saúde da plataforma?", icon: BarChart3 },
    { label: "Onboarding", prompt: "Crie um checklist de onboarding para novos médicos da plataforma.", icon: Users },
  ],
  receptionist: [
    { label: "Script telefônico", prompt: "Crie um script de atendimento telefônico para agendamento de consultas.", icon: MessageSquare },
    { label: "Gestão de fila", prompt: "Como gerenciar encaixes de última hora sem prejudicar a agenda?", icon: Users },
    { label: "Cobrança", prompt: "Como orientar um paciente sobre métodos de pagamento disponíveis?", icon: BarChart3 },
  ],
  support: [
    { label: "Problema técnico", prompt: "Um paciente não consegue entrar na videochamada. Quais passos de diagnóstico seguir?", icon: Brain },
    { label: "Resposta de ticket", prompt: "Redija uma resposta profissional para um paciente insatisfeito com atraso na consulta.", icon: MessageSquare },
    { label: "Escalação", prompt: "Quais critérios usar para escalar um ticket para prioridade alta?", icon: ClipboardList },
  ],
  clinic: [
    { label: "Gestão de médicos", prompt: "Como otimizar a distribuição de consultas entre os médicos da clínica?", icon: Users },
    { label: "Relatório financeiro", prompt: "Gere um resumo das comissões e receitas da clínica neste mês.", icon: BarChart3 },
    { label: "Credenciamento", prompt: "Quais documentos são necessários para credenciar um novo médico na clínica?", icon: ClipboardList },
  ],
  partner: [
    { label: "Validação de receita", prompt: "Como validar corretamente uma receita digital recebida pela plataforma?", icon: ClipboardList },
    { label: "Integração", prompt: "Quais são as melhores práticas para integrar minha farmácia/laboratório à plataforma?", icon: Brain },
    { label: "Relatório", prompt: "Gere um resumo das validações realizadas neste mês.", icon: BarChart3 },
  ],
  affiliate: [
    { label: "Estratégias", prompt: "Quais estratégias posso usar para aumentar minhas indicações na plataforma?", icon: Brain },
    { label: "Comissões", prompt: "Explique como funciona o sistema de comissões e quando recebo pagamento.", icon: BarChart3 },
    { label: "Material", prompt: "Gere um texto de divulgação para eu compartilhar com potenciais pacientes.", icon: MessageSquare },
  ],
};

const AIAssistantPanel = () => {
  const { user, roles, profile } = useAuth();
  const { toast } = useToast();
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIdx, setCopiedIdx] = useState<number | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const primaryRole = roles.includes("admin") ? "admin"
    : roles.includes("doctor") ? "doctor"
    : roles.includes("receptionist") ? "receptionist"
    : roles.includes("support") ? "support"
    : roles.includes("clinic") ? "clinic"
    : roles.includes("partner") ? "partner"
    : roles.includes("affiliate") ? "affiliate"
    : "patient";

  const quickActions = quickActionsByRole[primaryRole] || quickActionsByRole.patient;

  // Build context
  const [userContext, setUserContext] = useState("");
  useEffect(() => {
    if (!user) return;
    const parts: string[] = [];
    if (profile) parts.push(`Usuário: ${profile.first_name} ${profile.last_name}`);
    parts.push(`Papel: ${primaryRole}`);
    setUserContext(parts.join("\n"));
  }, [user, profile, primaryRole]);

  // Auto-scroll
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const getNav = () => {
    switch (primaryRole) {
      case "doctor": return getDoctorNav("ai-assistant");
      case "admin": return getAdminNav("ai-assistant");
      case "receptionist": return getReceptionNav("ai-assistant");
      default: return getPatientNav("ai-assistant");
    }
  };

  const roleLabel: Record<string, string> = {
    patient: "Paciente",
    doctor: "Médico",
    admin: "Administrador",
    receptionist: "Recepcionista",
    support: "Suporte",
    clinic: "Clínica",
    partner: "Parceiro",
    affiliate: "Afiliado",
  };

  const currentRoleLabel = roleLabel[primaryRole] || "Usuário";

  const copyMessage = (idx: number) => {
    const msg = messages[idx];
    if (msg) {
      navigator.clipboard.writeText(msg.content);
      setCopiedIdx(idx);
      setTimeout(() => setCopiedIdx(null), 2000);
    }
  };

  const send = useCallback(async (overrideText?: string) => {
    const text = (overrideText ?? input).trim();
    if (!text || isLoading) return;
    setInput("");

    const userMsg: Msg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      const resp = await fetch(AI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          context: userContext || undefined,
          role: primaryRole,
        }),
      });

      if (!resp.ok) {
        const data = await resp.json().catch(() => ({}));
        const errorMsg = resp.status === 429
          ? "⏳ Muitas requisições. Aguarde um momento e tente novamente."
          : resp.status === 402
          ? "💳 Créditos de IA esgotados."
          : data.error || "Erro ao conectar com a IA";
        setMessages(prev => [...prev, { role: "assistant", content: `😕 ${errorMsg}` }]);
        setIsLoading(false);
        return;
      }

      if (!resp.body) throw new Error("Sem resposta");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let idx: number;
        while ((idx = buffer.indexOf("\n")) !== -1) {
          let line = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (!line.startsWith("data: ")) continue;
          const json = line.slice(6).trim();
          if (json === "[DONE]") break;
          try {
            const parsed = JSON.parse(json);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) upsert(content);
          } catch {
            buffer = line + "\n" + buffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "assistant", content: "😕 Ocorreu um erro. Tente novamente." }]);
    }
    setIsLoading(false);
  }, [input, isLoading, messages, userContext, primaryRole]);

  return (
    <DashboardLayout title={currentRoleLabel} nav={getNav()}>
      <div className="max-w-4xl mx-auto flex flex-col" style={{ height: "calc(100vh - 120px)" }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Bot className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground flex items-center gap-2">
                Assistente IA
                <Badge variant="secondary" className="text-[10px] font-normal">
                  <Sparkles className="w-3 h-3 mr-1" />
                  DeepSeek
                </Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                Assistente inteligente para {currentRoleLabel.toLowerCase()}s
              </p>
            </div>
          </div>
          {messages.length > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMessages([])}
              className="text-muted-foreground hover:text-destructive gap-1.5"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Limpar
            </Button>
          )}
        </div>

        {/* Messages area */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto space-y-4 pr-1 min-h-0">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 py-8">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"
              >
                <Bot className="w-10 h-10 text-primary" />
              </motion.div>
              <div className="text-center space-y-1">
                <p className="text-base font-semibold text-foreground">
                  Olá{profile?.first_name ? `, ${profile.first_name}` : ""}! 👋
                </p>
                <p className="text-sm text-muted-foreground max-w-md">
                  Sou seu assistente IA. Posso ajudar com diversas tarefas do seu painel. Escolha uma sugestão ou escreva sua pergunta.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {quickActions.map((action) => {
                  const Icon = action.icon;
                  return (
                    <motion.button
                      key={action.label}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => send(action.prompt)}
                      className="flex items-start gap-3 text-left p-3 rounded-xl border border-border bg-card hover:bg-muted/50 hover:border-primary/30 transition-all group"
                    >
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors">
                        <Icon className="w-4 h-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{action.label}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{action.prompt}</p>
                      </div>
                    </motion.button>
                  );
                })}
              </div>
            </div>
          ) : (
            messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div className={`relative group max-w-[85%] ${
                  msg.role === "user"
                    ? "bg-primary text-primary-foreground rounded-2xl rounded-br-md px-4 py-3"
                    : "bg-muted rounded-2xl rounded-bl-md px-4 py-3"
                }`}>
                  {msg.role === "assistant" ? (
                    <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {msg.role === "assistant" && (
                    <button
                      onClick={() => copyMessage(i)}
                      className="absolute -bottom-2 -right-2 opacity-0 group-hover:opacity-100 transition-opacity w-7 h-7 rounded-full bg-background border border-border shadow-sm flex items-center justify-center"
                      title="Copiar"
                    >
                      {copiedIdx === i
                        ? <Check className="w-3 h-3 text-primary" />
                        : <Copy className="w-3 h-3 text-muted-foreground" />}
                    </button>
                  )}
                </div>
              </motion.div>
            ))
          )}

          {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
            <div className="flex justify-start">
              <div className="bg-muted rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex gap-1.5">
                  {[0, 1, 2].map(i => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-primary/40 rounded-full"
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Input */}
        <div className="pt-3 border-t border-border mt-3">
          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="flex gap-2 items-end"
          >
            <Textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              placeholder="Pergunte algo ao assistente..."
              className="flex-1 min-h-[44px] max-h-[120px] resize-none text-sm"
              rows={1}
              disabled={isLoading}
            />
            <Button
              type="submit"
              size="icon"
              disabled={isLoading || !input.trim()}
              className="shrink-0 h-11 w-11 rounded-xl"
            >
              <Send className="w-4 h-4" />
            </Button>
          </form>
          <p className="text-[10px] text-muted-foreground text-center mt-2">
            A IA pode cometer erros. Sempre confirme informações médicas com um profissional.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default AIAssistantPanel;
