import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { notes, diagnosis, medications } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const medsText = Array.isArray(medications)
      ? medications.map((m: any) => typeof m === "string" ? m : `${m.name || m.medication || ""} ${m.dosage || ""} ${m.instructions || ""}`).join("; ")
      : "";

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
            content: `Você é um assistente médico da plataforma AloClínica. Gere um resumo clínico em linguagem SIMPLES e acessível para o paciente (leigo). O resumo deve:
1. Explicar o que o médico encontrou (sem jargão)
2. Listar os medicamentos prescritos com orientações simples
3. Dar 2-3 recomendações gerais de cuidado
Seja empático, use linguagem acolhedora. Máximo 200 palavras. NÃO faça diagnósticos novos.`,
          },
          {
            role: "user",
            content: `Notas do médico: ${notes || "Não informado"}\nDiagnóstico: ${diagnosis || "Não informado"}\nMedicamentos: ${medsText || "Nenhum prescrito"}`,
          },
        ],
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
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const summary = data.choices?.[0]?.message?.content || "Resumo indisponível no momento.";

    return new Response(JSON.stringify({ summary }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("Clinical summary error:", e);
    return new Response(JSON.stringify({ error: "Não foi possível gerar o resumo." }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
