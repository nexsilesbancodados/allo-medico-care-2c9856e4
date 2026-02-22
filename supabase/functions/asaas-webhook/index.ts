import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json();
    const event = body.event;
    const payment = body.payment;

    console.log(`[Asaas Webhook] Event: ${event}, Payment ID: ${payment?.id}`);

    if (!payment) {
      return new Response(JSON.stringify({ received: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const appointmentId = payment.externalReference;

    // Map Asaas events to our payment statuses
    const statusMap: Record<string, string> = {
      PAYMENT_CONFIRMED: "approved",
      PAYMENT_RECEIVED: "approved",
      PAYMENT_OVERDUE: "overdue",
      PAYMENT_DELETED: "cancelled",
      PAYMENT_REFUNDED: "refunded",
      PAYMENT_CREATED: "pending",
      PAYMENT_UPDATED: "pending",
    };

    const newStatus = statusMap[event];

    if (newStatus && appointmentId) {
      const { error } = await supabase
        .from("appointments")
        .update({
          payment_status: newStatus,
          ...(newStatus === "approved" ? { payment_confirmed_at: new Date().toISOString() } : {}),
        })
        .eq("id", appointmentId);

      if (error) {
        console.error("Error updating appointment:", error);
      } else {
        console.log(`Appointment ${appointmentId} payment updated to ${newStatus}`);
      }

      // Log the event
      await supabase.from("activity_logs").insert({
        action: `asaas_${event.toLowerCase()}`,
        entity_type: "payment",
        entity_id: payment.id,
        details: {
          appointment_id: appointmentId,
          billing_type: payment.billingType,
          value: payment.value,
          status: newStatus,
        },
      });
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Webhook error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
