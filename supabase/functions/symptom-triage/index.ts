import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { symptoms } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content: `Você é um assistente de triagem médica da plataforma AloClínica. Com base nos sintomas descritos pelo paciente, sugira UMA especialidade médica adequada. Responda APENAS em JSON válido com este formato:
{"specialty": "nome da especialidade", "reason": "explicação curta de 1-2 frases", "urgency": "low|medium|high"}

Especialidades disponíveis: Clínico Geral, Dermatologia, Ortopedia, Neurologia, Cardiologia, Endocrinologia, Oftalmologia, Pediatria.
Se não conseguir determinar, sugira Clínico Geral.
NUNCA faça diagnóstico. Apenas sugira a especialidade mais adequada.`,
          },
          {
            role: "user",
            content: `Sintomas do paciente: ${symptoms}`,
          },
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "suggest_specialty",
              description: "Suggest a medical specialty based on symptoms",
              parameters: {
                type: "object",
                properties: {
                  specialty: { type: "string", description: "Medical specialty name" },
                  reason: { type: "string", description: "Short explanation" },
                  urgency: { type: "string", enum: ["low", "medium", "high"] },
                },
                required: ["specialty", "reason", "urgency"],
                additionalProperties: false,
              },
            },
          },
        ],
        tool_choice: { type: "function", function: { name: "suggest_specialty" } },
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded" }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "Credits required" }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    
    let result;
    if (toolCall?.function?.arguments) {
      result = JSON.parse(toolCall.function.arguments);
    } else {
      // Fallback: try parsing content directly
      const content = data.choices?.[0]?.message?.content || "";
      try {
        result = JSON.parse(content);
      } catch {
        result = { specialty: "Clínico Geral", reason: "Recomendamos uma avaliação geral.", urgency: "low" };
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Triage error:", e);
    return new Response(JSON.stringify({ 
      specialty: "Clínico Geral", 
      reason: "Recomendamos uma avaliação geral com um clínico.", 
      urgency: "low" 
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
