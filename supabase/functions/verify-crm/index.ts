import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { crm, uf, doctor_profile_id } = await req.json();

    if (!crm || !uf) {
      return new Response(
        JSON.stringify({ error: "CRM e UF são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiKey = Deno.env.get("CONSULTA_CRM_API_KEY");
    if (!apiKey) {
      return new Response(
        JSON.stringify({ error: "CONSULTA_CRM_API_KEY não configurada" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query consultacrm.com.br API
    const apiUrl = `https://www.consultacrm.com.br/api/index.php?tipo=crm&uf=${encodeURIComponent(uf)}&q=${encodeURIComponent(crm)}&chave=${encodeURIComponent(apiKey)}&destino=json`;

    const apiResponse = await fetch(apiUrl);
    if (!apiResponse.ok) {
      return new Response(
        JSON.stringify({ error: `Erro ao consultar API do CRM: ${apiResponse.status}` }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const apiData = await apiResponse.json();

    // The API returns an object with "item" array
    const items = apiData?.item ?? apiData?.items ?? [];
    const found = Array.isArray(items) && items.length > 0;

    let doctorInfo = null;
    let isValid = false;

    if (found) {
      const doctor = items[0];
      doctorInfo = {
        nome: doctor.nome ?? doctor.name ?? null,
        crm: doctor.numero ?? doctor.crm ?? crm,
        uf: doctor.uf ?? uf,
        situacao: doctor.situacao ?? doctor.status ?? null,
        especialidades: doctor.especialidade ?? doctor.especialidades ?? null,
        tipo_inscricao: doctor.tipo ?? doctor.tipo_inscricao ?? null,
      };
      // CRM is valid if the situation is "Regular" or "Ativo"
      const situacao = (doctorInfo.situacao ?? "").toLowerCase();
      isValid = situacao.includes("regular") || situacao.includes("ativ");
    }

    // If doctor_profile_id is provided and CRM is valid, auto-update the DB
    if (doctor_profile_id && isValid) {
      const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
      const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
      const supabase = createClient(supabaseUrl, serviceKey);

      await supabase.from("doctor_profiles").update({
        crm_verified: true,
        crm_verified_at: new Date().toISOString(),
      }).eq("id", doctor_profile_id);
    }

    return new Response(
      JSON.stringify({
        found,
        valid: isValid,
        doctor: doctorInfo,
        message: isValid
          ? "CRM válido e situação regular"
          : found
          ? "CRM encontrado mas situação irregular"
          : "CRM não encontrado na base de dados",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("verify-crm error:", error);
    return new Response(
      JSON.stringify({ error: error.message ?? "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
