import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getBaseUrl(apiKey: string): string {
  const env = Deno.env.get("ASAAS_ENVIRONMENT");
  if (env === "production") return "https://api.asaas.com/v3";
  if (env === "sandbox") return "https://api-sandbox.asaas.com/v3";
  if (apiKey.includes("hmlg") || apiKey.includes("sandbox")) return "https://api-sandbox.asaas.com/v3";
  return "https://api.asaas.com/v3";
}

/**
 * Register a doctor as an Asaas sub-account so they can receive splits.
 * Also stores their walletId in doctor_profiles for future payments.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      return new Response(JSON.stringify({ error: "Asaas not configured" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const baseUrl = getBaseUrl(ASAAS_API_KEY);
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      accept: "application/json",
      access_token: ASAAS_API_KEY,
    };

    const { doctorProfileId } = await req.json();
    if (!doctorProfileId) {
      return new Response(JSON.stringify({ error: "doctorProfileId required" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get doctor info
    const { data: doctor, error: dErr } = await supabase
      .from("doctor_profiles")
      .select("id, user_id, crm, pix_key, pix_key_type")
      .eq("id", doctorProfileId)
      .single();

    if (dErr || !doctor) {
      return new Response(JSON.stringify({ error: "Doctor not found" }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, last_name, cpf, phone, date_of_birth")
      .eq("user_id", doctor.user_id)
      .single();

    if (!profile?.cpf) {
      return new Response(JSON.stringify({ error: "Doctor CPF required for Asaas registration" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const cleanCpf = profile.cpf.replace(/\D/g, "");
    const fullName = `${profile.first_name} ${profile.last_name}`.trim();

    // Check if already registered as sub-account (wallet)
    const searchRes = await fetch(`${baseUrl}/accounts?cpfCnpj=${cleanCpf}`, { headers });
    const searchData = await searchRes.json();

    let walletId: string;

    if (searchData.data?.length > 0) {
      walletId = searchData.data[0].walletId || searchData.data[0].id;
      console.info(`[Asaas] Doctor already registered as sub-account: ${walletId}`);
    } else {
      // Create sub-account (subconta) for the doctor — required for splits
      // Per Asaas docs: POST /v3/accounts
      // mobilePhone is REQUIRED for sub-accounts
      let phoneForAsaas = "11999990001"; // Asaas docs example
      if (profile.phone) {
        let rawPhone = profile.phone.replace(/\D/g, "");
        if (rawPhone.length === 13 && rawPhone.startsWith("55")) rawPhone = rawPhone.substring(2);
        if (rawPhone.length >= 10 && rawPhone.length <= 11) phoneForAsaas = rawPhone;
      }

      const body: Record<string, any> = {
        name: fullName,
        cpfCnpj: cleanCpf,
        loginEmail: `doctor_${doctor.id}@aloclinica.com.br`,
        email: `doctor_${doctor.id}@aloclinica.com.br`,
        birthDate: profile.date_of_birth || "1990-01-01",
        incomeValue: 5000,
        mobilePhone: phoneForAsaas,
        address: "Rua Medico",
        addressNumber: "100",
        province: "Centro",
        postalCode: "01001000",
      };

      const createRes = await fetch(`${baseUrl}/accounts`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });
      const createData = await createRes.json();

      if (!createRes.ok) {
        console.error("Asaas sub-account registration error:", createData);
        return new Response(JSON.stringify({ error: createData.errors?.[0]?.description || "Registration failed", details: createData }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      walletId = createData.walletId || createData.id;
      console.info(`[Asaas] Doctor registered as sub-account: ${walletId}, apiKey: ${createData.apiKey ? 'provided' : 'none'}`);
    }

    // Store walletId in doctor_profiles (we'll use pix_key_type field or a dedicated column)
    // We store it in a JSON details or use the existing structure
    // For now, let's store as a custom field via app_settings
    await supabase.from("app_settings").upsert({
      key: `asaas_wallet_${doctorProfileId}`,
      value: walletId,
    });

    return new Response(JSON.stringify({
      success: true,
      walletId,
      doctorName: fullName,
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Asaas Register Doctor] Error:", error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
