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
  if (env === "sandbox") return "https://sandbox.asaas.com/api/v3";
  // Fallback: detect by key pattern
  if (apiKey.includes("hmlg") || apiKey.includes("sandbox")) return "https://sandbox.asaas.com/api/v3";
  return "https://api.asaas.com/v3";
}

// Map internal pix_key_type values to Asaas API enum values
const PIX_TYPE_MAP: Record<string, string> = {
  cpf: "CPF",
  cnpj: "CNPJ",
  email: "EMAIL",
  phone: "PHONE",
  random: "EVP",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Asaas não configurado" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build an admin-privileged Supabase client
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Extract admin identity from the JWT in the Authorization header
    const authHeader = req.headers.get("Authorization") ?? "";
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user: adminUser }, error: authError } = await supabase.auth.getUser(jwt);
    if (authError || !adminUser) {
      return new Response(
        JSON.stringify({ error: "Não autorizado" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { withdrawal_id, action, admin_notes } = await req.json() as {
      withdrawal_id: string;
      action: "approve" | "reject" | "process";
      admin_notes?: string;
      asaas_transfer_id?: string;
    };

    if (!withdrawal_id || !action) {
      return new Response(
        JSON.stringify({ error: "withdrawal_id e action são obrigatórios" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fetch the withdrawal request
    const { data: wr, error: wrError } = await supabase
      .from("withdrawal_requests")
      .select("*")
      .eq("id", withdrawal_id)
      .single();

    if (wrError || !wr) {
      return new Response(
        JSON.stringify({ error: "Solicitação de saque não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------------------------------
    // ACTION: approve
    // -----------------------------------------------------------------------
    if (action === "approve") {
      if (wr.status !== "pending") {
        return new Response(
          JSON.stringify({ error: `Não é possível aprovar uma solicitação com status '${wr.status}'` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "approved",
          reviewed_by: adminUser.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: admin_notes ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal_id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar solicitação", details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Notify doctor
      await supabase.from("notifications").insert({
        user_id: wr.user_id,
        title: "Saque aprovado",
        message: `Seu saque de R$ ${Number(wr.amount).toFixed(2).replace(".", ",")} foi aprovado e será processado em breve.`,
        type: "financial",
        link: "/dashboard/earnings",
      });

      return new Response(
        JSON.stringify({ success: true, message: "Saque aprovado com sucesso" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------------------------------
    // ACTION: reject
    // -----------------------------------------------------------------------
    if (action === "reject") {
      if (!["pending", "approved"].includes(wr.status)) {
        return new Response(
          JSON.stringify({ error: `Não é possível rejeitar uma solicitação com status '${wr.status}'` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const { error: updateError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "rejected",
          reviewed_by: adminUser.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: admin_notes ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal_id);

      if (updateError) {
        return new Response(
          JSON.stringify({ error: "Erro ao atualizar solicitação", details: updateError.message }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Notify doctor
      await supabase.from("notifications").insert({
        user_id: wr.user_id,
        title: "Saque rejeitado",
        message: `Seu saque de R$ ${Number(wr.amount).toFixed(2).replace(".", ",")} foi rejeitado.${admin_notes ? ` Motivo: ${admin_notes}` : ""}`,
        type: "financial",
        link: "/dashboard/earnings",
      });

      return new Response(
        JSON.stringify({ success: true, message: "Saque rejeitado" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // -----------------------------------------------------------------------
    // ACTION: process  (execute PIX payout via Asaas)
    // -----------------------------------------------------------------------
    if (action === "process") {
      if (wr.status !== "approved") {
        return new Response(
          JSON.stringify({ error: `O saque precisa estar com status 'approved' para ser processado. Status atual: '${wr.status}'` }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Mark as 'processing' immediately so a double-click won't re-submit
      await supabase
        .from("withdrawal_requests")
        .update({ status: "processing", updated_at: new Date().toISOString() })
        .eq("id", withdrawal_id);

      const baseUrl = getBaseUrl(ASAAS_API_KEY);
      const asaasHeaders: Record<string, string> = {
        "Content-Type": "application/json",
        accept: "application/json",
        access_token: ASAAS_API_KEY,
      };

      const pixKeyType = PIX_TYPE_MAP[wr.pix_key_type?.toLowerCase() ?? ""] ?? "EVP";

      const transferBody = {
        value: Number(wr.amount),
        pixAddressKey: wr.pix_key,
        pixAddressKeyType: pixKeyType,
        description: `Saque médico — solicitação ${withdrawal_id}`,
      };

      let transferData: Record<string, unknown>;
      let transferOk = false;

      try {
        const transferRes = await fetch(`${baseUrl}/transfers`, {
          method: "POST",
          headers: asaasHeaders,
          body: JSON.stringify(transferBody),
        });

        transferData = await transferRes.json() as Record<string, unknown>;
        transferOk = transferRes.ok;
      } catch (fetchErr: unknown) {
        const errMsg = fetchErr instanceof Error ? fetchErr.message : "Erro de rede ao chamar Asaas";
        await supabase
          .from("withdrawal_requests")
          .update({
            status: "failed",
            admin_notes: `Erro de conexão com Asaas: ${errMsg}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", withdrawal_id);

        return new Response(
          JSON.stringify({ error: errMsg }),
          { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!transferOk) {
        // Extract human-readable error from Asaas response
        const asaasErrors = (transferData.errors as Array<{ description?: string }> | undefined) ?? [];
        const errMsg = asaasErrors[0]?.description ?? (transferData.message as string | undefined) ?? "Erro ao criar transferência no Asaas";

        await supabase
          .from("withdrawal_requests")
          .update({
            status: "failed",
            admin_notes: `Asaas error: ${errMsg}`,
            updated_at: new Date().toISOString(),
          })
          .eq("id", withdrawal_id);

        // Notify doctor of failure
        await supabase.from("notifications").insert({
          user_id: wr.user_id,
          title: "Erro no processamento do saque",
          message: `Houve um problema ao processar seu saque de R$ ${Number(wr.amount).toFixed(2).replace(".", ",")}. Nossa equipe irá analisar e entrar em contato.`,
          type: "financial",
          link: "/dashboard/earnings",
        });

        return new Response(
          JSON.stringify({ error: errMsg, asaas_response: transferData }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // --- Payout succeeded ---

      // 1. Mark withdrawal as completed
      const { error: completeError } = await supabase
        .from("withdrawal_requests")
        .update({
          status: "completed",
          processed_by: adminUser.id,
          processed_at: new Date().toISOString(),
          admin_notes: admin_notes ?? null,
          updated_at: new Date().toISOString(),
        })
        .eq("id", withdrawal_id);

      if (completeError) {
        console.error("Error marking withdrawal completed:", completeError);
      }

      // 2. Deduct from wallet_transactions (negative entry)
      const { error: walletError } = await supabase
        .from("wallet_transactions")
        .insert({
          user_id: wr.user_id,
          amount: -Math.abs(Number(wr.amount)),
          type: "withdrawal",
          description: `Saque via PIX processado — ID ${withdrawal_id}`,
          reference_id: withdrawal_id,
          reference_type: "withdrawal_request",
        });

      if (walletError) {
        // Non-fatal: log but don't fail the response — money already moved
        console.error("Error inserting wallet debit transaction:", walletError);
      }

      // 3. Notify doctor of successful payout
      await supabase.from("notifications").insert({
        user_id: wr.user_id,
        title: "Saque realizado com sucesso!",
        message: `Seu saque de R$ ${Number(wr.amount).toFixed(2).replace(".", ",")} foi enviado para sua chave PIX (${wr.pix_key}). Pode levar alguns minutos para aparecer em sua conta.`,
        type: "financial",
        link: "/dashboard/earnings",
      });

      return new Response(
        JSON.stringify({
          success: true,
          message: "Saque processado com sucesso",
          transfer_id: transferData.id ?? null,
          transfer_status: transferData.status ?? null,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Unknown action
    return new Response(
      JSON.stringify({ error: `Ação desconhecida: '${action}'. Use 'approve', 'reject' ou 'process'.` }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("process-withdrawal error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro interno" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
