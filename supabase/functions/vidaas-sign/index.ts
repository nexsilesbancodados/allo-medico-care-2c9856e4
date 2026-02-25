import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VIDAAS_CLIENT_ID = Deno.env.get("VIDAAS_CLIENT_ID");
    const VIDAAS_CLIENT_SECRET = Deno.env.get("VIDAAS_CLIENT_SECRET");
    const VIDAAS_BASE_URL = Deno.env.get("VIDAAS_BASE_URL") || "https://certificado.vidaas.com.br";

    if (!VIDAAS_CLIENT_ID || !VIDAAS_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({
          error: "VIDaaS não configurado. Adicione VIDAAS_CLIENT_ID e VIDAAS_CLIENT_SECRET.",
          configured: false,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { action, document_hash, document_type, doctor_name, doctor_crm, verification_code, user_token } =
      await req.json();

    // Initialize Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    if (action === "authorize") {
      // Step 1: Generate authorization URL for doctor to authenticate with ICP-Brasil certificate
      const redirectUri = `${supabaseUrl}/functions/v1/vidaas-sign?action=callback`;
      const state = crypto.randomUUID();

      const authUrl = `${VIDAAS_BASE_URL}/v0/oauth/authorize?` +
        `client_id=${encodeURIComponent(VIDAAS_CLIENT_ID)}` +
        `&response_type=code` +
        `&redirect_uri=${encodeURIComponent(redirectUri)}` +
        `&scope=signature_session` +
        `&state=${state}` +
        `&lifetime=600`;

      return new Response(
        JSON.stringify({ auth_url: authUrl, state }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (action === "callback") {
      // Step 2: Exchange authorization code for access token
      const url = new URL(req.url);
      const code = url.searchParams.get("code");

      if (!code) {
        return new Response("Código de autorização não recebido.", { status: 400 });
      }

      const tokenRes = await fetch(`${VIDAAS_BASE_URL}/v0/oauth/token`, {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          grant_type: "authorization_code",
          code,
          client_id: VIDAAS_CLIENT_ID,
          client_secret: VIDAAS_CLIENT_SECRET,
          redirect_uri: `${supabaseUrl}/functions/v1/vidaas-sign?action=callback`,
        }),
      });

      const tokenData = await tokenRes.json();

      if (!tokenData.access_token) {
        return new Response(
          JSON.stringify({ error: "Falha ao obter token VIDaaS", details: tokenData }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Redirect back to the application with the token
      return new Response(null, {
        status: 302,
        headers: {
          Location: `/dashboard/laudista/queue?vidaas_token=${tokenData.access_token}`,
          ...corsHeaders,
        },
      });
    }

    if (action === "sign") {
      // Step 3: Sign document hash with ICP-Brasil certificate
      if (!user_token || !document_hash) {
        return new Response(
          JSON.stringify({ error: "Token e hash do documento são obrigatórios." }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Create CAdES-BES signature using VIDaaS API
      const signRes = await fetch(`${VIDAAS_BASE_URL}/v0/oauth/sign`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user_token}`,
        },
        body: JSON.stringify({
          hashes: [
            {
              id: verification_code || crypto.randomUUID(),
              alias: `Laudo - ${document_type || "exam_report"}`,
              hash: document_hash,
              hash_algorithm: "2.16.840.1.101.3.4.2.1", // SHA-256 OID
              signature_format: "CAdES",
            },
          ],
        }),
      });

      const signData = await signRes.json();

      if (!signRes.ok) {
        return new Response(
          JSON.stringify({ error: "Falha na assinatura ICP-Brasil", details: signData }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Store signature info
      const signature = signData.signatures?.[0];

      // Log the ICP-Brasil signature in activity_logs
      await supabase.from("activity_logs").insert({
        action: "icp_brasil_signature",
        entity_type: "document",
        details: {
          document_type,
          doctor_name,
          doctor_crm,
          verification_code,
          document_hash,
          certificate_cn: signature?.certificate_cn || "N/A",
          signature_value: signature?.signature || "N/A",
          signed_at: new Date().toISOString(),
        },
      });

      return new Response(
        JSON.stringify({
          success: true,
          signature: {
            value: signature?.signature,
            certificate_cn: signature?.certificate_cn,
            certificate_issuer: signature?.certificate_issuer,
            signed_at: new Date().toISOString(),
          },
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Ação inválida. Use: authorize, callback, sign" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("VIDaaS sign error:", err);
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
