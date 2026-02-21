import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context, role } = await req.json();

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY não configurada");

    const roleInstructions: Record<string, string> = {
      patient: `Você auxilia PACIENTES com:
- Agendar consultas, entender planos e preços
- Interpretar receitas de forma simplificada (sem diagnósticos)
- Orientar sobre exames e preparações pré-consulta
- Ajudar a navegar o sistema: histórico médico, dependentes, diário de sintomas
- Explicar resultados de exames de forma acessível (sem diagnosticar)`,

      doctor: `Você auxilia MÉDICOS com:
- Resumir prontuários e histórico do paciente
- Sugerir perguntas de anamnese baseadas nos sintomas relatados
- Auxiliar na redação de notas clínicas no padrão SOAP
- Buscar informações sobre CID-10, protocolos clínicos e bulas
- Calcular dosagens pediátricas e ajustes renais
- Gerar rascunhos de atestados e laudos`,

      admin: `Você auxilia ADMINISTRADORES com:
- Análise de métricas: NPS, taxa de conclusão, receita, churn
- Sugestões de otimização operacional
- Rascunhos de comunicados e e-mails para médicos/pacientes
- Interpretação de relatórios financeiros
- Gestão de aprovações e onboarding de médicos`,

      receptionist: `Você auxilia RECEPCIONISTAS com:
- Orientações sobre agendamento e check-in de pacientes
- Scripts de atendimento telefônico
- Gestão de filas e encaixes
- Informações sobre cobranças e métodos de pagamento`,

      support: `Você auxilia o SUPORTE com:
- Diagnóstico de problemas técnicos comuns
- Scripts de atendimento ao cliente
- Escalação de tickets baseada em prioridade
- Rascunhos de respostas para tickets de suporte`,

      clinic: `Você auxilia CLÍNICAS com:
- Gestão de médicos afiliados e comissões
- Análise de performance da clínica
- Orientações sobre credenciamento e CNPJ`,
    };

    const roleContext = roleInstructions[role] || roleInstructions.patient;

    const systemPrompt = `Você é o Assistente IA da plataforma AloClinica, um assistente inteligente e profissional integrado ao painel de gestão.

REGRAS FUNDAMENTAIS:
1. NUNCA dê diagnósticos médicos definitivos
2. NUNCA prescreva medicamentos com dosagens
3. Em emergências, oriente SAMU (192) ou UPA imediatamente
4. Respeite a LGPD — não peça dados sensíveis desnecessários
5. Sempre sugira consultar um profissional quando aplicável

CAPACIDADES POR PAPEL:
${roleContext}

FORMATO DE RESPOSTA:
- Seja objetivo e profissional
- Use markdown para estruturar respostas (listas, negrito, headers)
- Máximo 6-8 frases por resposta
- Use emojis com moderação para clareza visual
- Responda sempre em português brasileiro

${context ? `\n--- CONTEXTO DO USUÁRIO ---\n${context}\n---` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        temperature: 0.4,
        max_tokens: 1000,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas requisições. Aguarde um momento." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados. Adicione créditos no workspace." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("ai-assistant error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
