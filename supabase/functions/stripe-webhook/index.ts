import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, stripe-signature, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/** Verify Stripe webhook signature using HMAC-SHA256 via Web Crypto API */
async function verifyStripeSignature(
  body: string,
  sigHeader: string,
  secret: string
): Promise<boolean> {
  const parts = sigHeader.split(",").reduce((acc, part) => {
    const [key, value] = part.split("=");
    acc[key.trim()] = value;
    return acc;
  }, {} as Record<string, string>);

  const timestamp = parts["t"];
  const v1Signature = parts["v1"];
  if (!timestamp || !v1Signature) return false;

  // Reject timestamps older than 5 minutes
  const age = Math.floor(Date.now() / 1000) - parseInt(timestamp);
  if (Math.abs(age) > 300) {
    console.warn("Stripe webhook timestamp too old:", age, "seconds");
    return false;
  }

  const signedPayload = `${timestamp}.${body}`;
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signatureBytes = await crypto.subtle.sign("HMAC", key, encoder.encode(signedPayload));
  const expectedSig = Array.from(new Uint8Array(signatureBytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return expectedSig === v1Signature;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const STRIPE_WEBHOOK_SECRET = Deno.env.get("STRIPE_WEBHOOK_SECRET");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const signature = req.headers.get("stripe-signature");
    const body = await req.text();

    if (!signature) {
      return new Response(JSON.stringify({ error: "No signature" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify signature if secret is configured
    if (STRIPE_WEBHOOK_SECRET) {
      const isValid = await verifyStripeSignature(body, signature, STRIPE_WEBHOOK_SECRET);
      if (!isValid) {
        console.error("Stripe webhook signature verification failed");
        return new Response(JSON.stringify({ error: "Invalid signature" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      console.warn("STRIPE_WEBHOOK_SECRET not configured — skipping signature verification");
    }

    const event = JSON.parse(body);
    const supabase = createClient(supabaseUrl, serviceKey);

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const metadata = session.metadata || {};
      const { mode, appointmentId, planId, userId } = metadata;

      console.log("Checkout completed:", { mode, appointmentId, planId, userId });

      if (mode === "payment" && appointmentId) {
        await supabase.from("appointments").update({
          status: "confirmed",
          payment_status: "approved",
          payment_confirmed_at: new Date().toISOString(),
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

    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      await supabase.from("subscriptions")
        .update({ status: subscription.status })
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