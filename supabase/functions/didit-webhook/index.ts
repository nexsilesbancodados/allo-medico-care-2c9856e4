import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    console.log("[didit-webhook] Received:", JSON.stringify(body));

    const sessionId = body.session_id;
    const status = body.status;
    const decision = body.decision;
    const vendorData = body.vendor_data; // This is the user_id

    if (!sessionId || !vendorData) {
      return new Response(JSON.stringify({ error: "Invalid payload" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Log the webhook
    await supabase.from("activity_logs").insert({
      action: "kyc_webhook_received",
      entity_type: "kyc",
      entity_id: sessionId,
      user_id: vendorData,
      details: { provider: "didit", status, decision, session_id: sessionId },
    });

    // If approved, update KYC status
    if (status === "Completed" && decision === "Approved") {
      // Check if user is a doctor — update kyc_status
      const { data: doctorProfile } = await supabase
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", vendorData)
        .maybeSingle();

      if (doctorProfile) {
        await supabase
          .from("doctor_profiles")
          .update({
            kyc_status: "approved",
            kyc_verified_at: new Date().toISOString(),
            kyc_face_match_score: body.face_match_score || null,
          })
          .eq("user_id", vendorData);
      }

      // Notify user
      await supabase.from("notifications").insert({
        user_id: vendorData,
        title: "✅ Identidade verificada!",
        message: "Sua verificação de identidade foi aprovada com sucesso.",
        type: "info",
        link: "/dashboard",
      });

      console.log(`[didit-webhook] KYC approved for user ${vendorData}`);
    } else if (status === "Completed" && decision === "Declined") {
      // Notify user of rejection
      await supabase.from("notifications").insert({
        user_id: vendorData,
        title: "❌ Verificação não aprovada",
        message: "Sua verificação de identidade não foi aprovada. Tente novamente com documentos válidos.",
        type: "warning",
        link: "/dashboard/profile?kyc=open",
      });

      if (await isDoctorUser(supabase, vendorData)) {
        await supabase
          .from("doctor_profiles")
          .update({ kyc_status: "rejected" })
          .eq("user_id", vendorData);
      }

      console.log(`[didit-webhook] KYC declined for user ${vendorData}`);
    }

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[didit-webhook] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});

async function isDoctorUser(supabase: any, userId: string): Promise<boolean> {
  const { data } = await supabase
    .from("doctor_profiles")
    .select("id")
    .eq("user_id", userId)
    .maybeSingle();
  return !!data;
}
