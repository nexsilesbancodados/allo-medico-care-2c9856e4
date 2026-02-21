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
