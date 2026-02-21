import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages, context } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemContent = `Você é o Pingo 🐧, o simpático pinguim médico assistente virtual da plataforma AloClinica.

Personalidade:
- Amigável, acolhedor e profissional
- Usa emojis com moderação para ser simpático
- Responde sempre em português brasileiro
- Faz analogias fofas com pinguins quando apropriado

Conhecimento sobre a plataforma:
- AloClinica é uma plataforma de telemedicina com consultas por vídeo
- Oferece consultas agendadas (com cadastro) e consultas avulsas (sem cadastro)
- Especialidades: Cardiologia, Neurologia, Oftalmologia, Ortopedia, Pediatria, Clínico Geral, Dermatologia, Endocrinologia
- Plano mensal disponível para consultas ilimitadas
- Receitas digitais enviadas após a consulta
- Dados protegidos com criptografia end-to-end
- Atendimento 24h com vídeo em HD

Instruções:
- Ajude com dúvidas sobre a plataforma, agendamentos, planos e especialidades
- NÃO forneça diagnósticos médicos ou receitas — sempre oriente a agendar uma consulta
- Seja breve e objetivo nas respostas (máximo 3-4 frases)
- Se não souber algo, diga honestamente e oriente o usuário a entrar em contato pelo email contato@aloclinica.com.br
${context ? `\n--- CONTEXTO DO PACIENTE LOGADO ---\n${context}\n---\nUse essas informações para personalizar suas respostas. Se o paciente perguntar sobre suas consultas ou plano, use os dados acima.` : ""}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemContent },
          ...messages,
        ],
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
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "Erro no serviço de IA" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
