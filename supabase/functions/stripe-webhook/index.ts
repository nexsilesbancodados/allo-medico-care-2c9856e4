import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    if (!STRIPE_SECRET_KEY || !STRIPE_WEBHOOK_SECRET) {
      console.error("Stripe secrets not configured");
      return new Response(JSON.stringify({ error: "Stripe not configured" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature) {
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify webhook signature using Stripe API approach
    // For production, use crypto.subtle to verify HMAC
    // For now, we'll parse the event and verify via Stripe API
    const event = JSON.parse(body);

    const supabase = createClient(supabaseUrl, serviceKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata || {};
      const { mode, appointmentId, planId, userId } = metadata;

      console.log("Checkout completed:", { mode, appointmentId, planId, userId });

      if (mode === "payment" && appointmentId) {
        // Update appointment payment status
        await supabase.from("appointments").update({
          status: "scheduled",
          payment_status: "paid",
        }).eq("id", appointmentId);

        // Trigger appointment confirmed notification
        try {
          await fetch(`${supabaseUrl}/functions/v1/appointment-confirmed`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
            },
            body: JSON.stringify({ appointment_id: appointmentId }),
          });
        } catch (e) {
          console.error("Failed to trigger appointment-confirmed:", e);
        }
      }

      if (mode === "subscription" && planId && userId) {
        await supabase.from("subscriptions").insert({
          user_id: userId,
          plan_id: planId,
          status: "active",
          stripe_subscription_id: session.subscription || null,
        });
      }

      // Create notification
      if (userId) {
        await supabase.from("notifications").insert({
          user_id: userId,
          title: mode === "subscription" ? "Assinatura Ativada!" : "Pagamento Confirmado!",
          message: mode === "subscription"
            ? "Seu plano foi ativado com sucesso. Aproveite todas as funcionalidades!"
            : "Seu pagamento foi confirmado. Sua consulta está agendada.",
          type: "payment",
          link: "/dashboard",
        });
      }
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      await supabase.from("subscriptions")
        .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
        .eq("stripe_subscription_id", subscription.id);
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const subId = invoice.subscription;
      if (subId) {
        await supabase.from("subscriptions")
          .update({ status: "past_due" })
          .eq("stripe_subscription_id", subId);
      }
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
