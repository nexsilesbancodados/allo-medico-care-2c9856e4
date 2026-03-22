import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
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
    const ASAAS_API_KEY = Deno.env.get("ASAAS_API_KEY");
    if (!ASAAS_API_KEY) {
      return new Response(
        JSON.stringify({ error: "Asaas not configured" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const { appointmentId, reason, refundType } = await req.json();

    if (!appointmentId) {
      return new Response(
        JSON.stringify({ error: "appointmentId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get appointment details
    const { data: appt, error: apptError } = await supabase
      .from("appointments")
      .select("id, patient_id, guest_patient_id, doctor_id, price_at_booking, payment_status, status, cancelled_by, cancel_reason")
      .eq("id", appointmentId)
      .single();

    if (apptError || !appt) {
      return new Response(
        JSON.stringify({ error: "Consulta não encontrada" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Only refund if payment was approved
    if (!["approved", "confirmed", "received"].includes(appt.payment_status || "")) {
      return new Response(
        JSON.stringify({ error: "Pagamento não elegível para reembolso", status: appt.payment_status }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const baseUrl = ASAAS_API_KEY.includes("hmlg") || ASAAS_API_KEY.includes("sandbox")
      ? "https://api-sandbox.asaas.com/v3"
      : "https://api.asaas.com/v3";

    const headers = {
      "Content-Type": "application/json",
      accept: "application/json",
      access_token: ASAAS_API_KEY,
    };

    // Find payment by externalReference
    const searchRes = await fetch(
      `${baseUrl}/payments?externalReference=${appointmentId}&limit=1`,
      { headers }
    );
    const searchData = await searchRes.json();

    if (!searchData.data || searchData.data.length === 0) {
      // No Asaas payment found — mark as refunded internally
      await supabase.from("appointments").update({
        payment_status: "refunded",
      }).eq("id", appointmentId);

      return new Response(
        JSON.stringify({ success: true, message: "Reembolso registrado internamente (pagamento não encontrado no gateway)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const asaasPaymentId = searchData.data[0].id;
    const paymentValue = searchData.data[0].value;

    // Determine refund amount based on type
    let refundValue = paymentValue;
    if (refundType === "partial_50") {
      refundValue = Math.round(paymentValue * 0.5 * 100) / 100;
    } else if (refundType === "no_refund") {
      // Late cancellation — no refund, just update status
      await supabase.from("appointments").update({
        payment_status: "no_refund",
      }).eq("id", appointmentId);

      return new Response(
        JSON.stringify({ success: true, message: "Cancelamento tardio — sem reembolso" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Process refund via Asaas
    const refundRes = await fetch(`${baseUrl}/payments/${asaasPaymentId}/refund`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        value: refundValue,
        description: reason || "Reembolso — Consulta cancelada",
      }),
    });

    const refundData = await refundRes.json();

    if (!refundRes.ok) {
      console.error("Asaas refund error:", refundData);
      return new Response(
        JSON.stringify({ error: refundData.errors?.[0]?.description || "Erro ao processar reembolso" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update appointment
    await supabase.from("appointments").update({
      payment_status: refundType === "partial_50" ? "partially_refunded" : "refunded",
    }).eq("id", appointmentId);

    // Notify patient
    const patientId = appt.patient_id;
    if (patientId) {
      await supabase.from("notifications").insert({
        user_id: patientId,
        title: "💸 Reembolso Processado",
        message: `Seu reembolso de R$ ${refundValue.toFixed(2)} foi processado.${reason ? ` Motivo: ${reason}` : ""}`,
        type: "payment",
        link: "/dashboard/appointments",
      });

      // Send refund email
      try {
        const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", patientId).single();
        const { data: authUser } = await supabase.auth.admin.getUserById(patientId);
        if (authUser?.user?.email) {
          const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
          const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
            body: JSON.stringify({
              type: "refund_processed",
              to: authUser.user.email,
              data: {
                patient_name: profile ? `${profile.first_name} ${profile.last_name}` : "Paciente",
                amount: refundValue.toFixed(2),
                reason: reason || "Consulta cancelada",
              },
            }),
          });
        }
      } catch (emailErr) {
        console.warn("Refund email failed (non-blocking):", emailErr);
      }
    }

    // Activity log
    await supabase.from("activity_logs").insert({
      action: "refund_processed",
      entity_type: "payment",
      entity_id: asaasPaymentId,
      user_id: patientId,
      details: {
        appointment_id: appointmentId,
        refund_value: refundValue,
        original_value: paymentValue,
        refund_type: refundType || "full",
        reason,
      },
    });

    return new Response(
      JSON.stringify({
        success: true,
        refundValue,
        originalValue: paymentValue,
        refundType: refundType || "full",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: unknown) {
    console.error("Refund error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
