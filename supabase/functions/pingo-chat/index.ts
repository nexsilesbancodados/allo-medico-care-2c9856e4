import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context, ticket_id, user_id } = await req.json();
    
    // Try DeepSeek first, fallback to Lovable AI Gateway
    const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    
    const useDeepSeek = !!DEEPSEEK_API_KEY;
    const apiUrl = useDeepSeek 
      ? "https://api.deepseek.com/v1/chat/completions"
      : "https://ai.gateway.lovable.dev/v1/chat/completions";
    const apiKey = useDeepSeek ? DEEPSEEK_API_KEY : LOVABLE_API_KEY;
    const model = useDeepSeek ? "deepseek-chat" : "google/gemini-3-flash-preview";

    if (!apiKey) throw new Error("Nenhuma chave de IA configurada (DEEPSEEK_API_KEY ou LOVABLE_API_KEY)");

    const systemContent = `Você é o Pingo 🐧, o simpático pinguim assistente virtual da plataforma AloClinica. Sua função é realizar a teletriagem e suporte administrativo, seguindo estritamente as resoluções do CFM (2.314/2022) e a LGPD.

DIRETRIZES DE COMPORTAMENTO:

1. NÃO DÊ DIAGNÓSTICOS: Você nunca deve dizer ao paciente o que ele tem. Use termos como "seus sintomas sugerem a necessidade de avaliação médica" ou "recomendo agendar uma consulta para avaliação profissional".

2. NÃO PRESCREVA: É proibido sugerir dosagens, nomes de medicamentos ou tratamentos. Sempre oriente a agendar uma consulta com um médico.

3. TRIAGEM DE EMERGÊNCIA: Se o paciente relatar dor no peito, falta de ar grave, perda de consciência, sangramento intenso, sinais de AVC (dificuldade para falar, fraqueza em um lado do corpo) ou reação alérgica grave, instrua IMEDIATAMENTE:
"🚨 ATENÇÃO: Seus sintomas requerem atendimento URGENTE. Por favor, procure a UPA ou Hospital mais próximo ou ligue para o SAMU (192). Não aguarde uma teleconsulta."

4. TRANSFERÊNCIA PARA HUMANO: Se o usuário pedir para "falar com alguém", "suporte humano", "atendente", "pessoa real" ou demonstrar frustração repetida, responda EXATAMENTE:
"[TRANSFERINDO] Um de nossos atendentes assumirá este chat em instantes. Aguarde um momento. 🎧"
E encerre sua resposta.

5. LGPD: Não peça senhas, dados bancários ou dados sensíveis fora do contexto da triagem. Não armazene nem repita CPF ou dados pessoais na conversa.

PERSONALIDADE:
- Amigável, acolhedor e profissional
- Usa emojis com moderação para ser simpático
- Responde sempre em português brasileiro
- Faz analogias fofas com pinguins quando apropriado
- Seja breve e objetivo (máximo 3-4 frases por resposta)

CONHECIMENTO DA PLATAFORMA:
- AloClinica é uma plataforma de telemedicina com consultas por vídeo
- Oferece consultas agendadas (com cadastro) e consultas avulsas (sem cadastro)
- Especialidades: Cardiologia, Neurologia, Oftalmologia, Ortopedia, Pediatria, Clínico Geral, Dermatologia, Endocrinologia
- Plano mensal disponível para consultas ilimitadas
- Receitas digitais enviadas após a consulta
- Dados protegidos com criptografia
- Atendimento com vídeo em HD
- Contato: contato@aloclinica.com.br

OBJETIVO: Ajude o paciente a agendar consultas, tirar dúvidas sobre a plataforma, testar câmera/microfone e entender como acessar receitas médicas.
${context ? `\n--- CONTEXTO DO PACIENTE LOGADO ---\n${context}\n---\nUse essas informações para personalizar suas respostas.` : ""}`;

    const response = await fetch(apiUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
        temperature: 0.3,
        max_tokens: 500,
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Muitas mensagens! Aguarde um momento e tente novamente." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Créditos de IA esgotados." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error(`AI error (${useDeepSeek ? "DeepSeek" : "Lovable"}):`, response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // AI Triage: analyze the last user message for urgency keywords
    if (ticket_id && user_id) {
      const lastUserMsg = messages.filter((m: any) => m.role === "user").pop()?.content?.toLowerCase() ?? "";
      const highPriorityKeywords = [
        "urgente", "emergência", "emergencia", "dor forte", "dor intensa", "sangramento",
        "desmaio", "desmaiou", "falta de ar", "peito", "avc", "convulsão", "convulsao",
        "inconsciente", "morrer", "morrendo", "suicídio", "suicidio"
      ];
      const mediumPriorityKeywords = [
        "pagamento", "pagar", "cobrado", "cobrança", "reembolso", "cancelar",
        "não consigo", "erro", "problema", "bug", "travou", "não funciona"
      ];

      let detectedPriority: string | null = null;
      if (highPriorityKeywords.some(kw => lastUserMsg.includes(kw))) {
        detectedPriority = "high";
      } else if (mediumPriorityKeywords.some(kw => lastUserMsg.includes(kw))) {
        detectedPriority = "medium";
      }

      if (detectedPriority) {
        try {
          const { createClient } = await import("https://esm.sh/@supabase/supabase-js@2");
          const supabase = createClient(
            Deno.env.get("SUPABASE_URL")!,
            Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
          );

          // Update ticket priority
          await supabase
            .from("support_tickets")
            .update({ priority: detectedPriority })
            .eq("id", ticket_id);

          // If high priority, also escalate to waiting_human
          if (detectedPriority === "high") {
            await supabase
              .from("support_tickets")
              .update({ status: "waiting_human", priority: "high" })
              .eq("id", ticket_id);

            // Send push notification to admins/support
            const { data: supportUsers } = await supabase
              .from("user_roles")
              .select("user_id")
              .in("role", ["admin", "support"]);

            if (supportUsers) {
              for (const su of supportUsers) {
                await supabase.from("notifications").insert({
                  user_id: su.user_id,
                  title: "🚨 Ticket Alta Prioridade",
                  message: `Paciente reportou: "${lastUserMsg.substring(0, 80)}..."`,
                  type: "urgent",
                  link: "/dashboard/support",
                });
              }
            }
          }

          console.log(`Triage: ticket ${ticket_id} => priority: ${detectedPriority}`);
        } catch (triageErr) {
          console.error("Triage error:", triageErr);
        }
      }
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Erro desconhecido" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
