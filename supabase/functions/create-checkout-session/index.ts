import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const STRIPE_SECRET_KEY = Deno.env.get("STRIPE_SECRET_KEY");
    if (!STRIPE_SECRET_KEY) {
      console.log("[DEV] Stripe not configured — returning fallback");
      return new Response(
        JSON.stringify({ error: "Stripe not configured", dev: true }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { mode, priceId, appointmentId, planId, successUrl, cancelUrl } = await req.json();

    if (!mode || !successUrl || !cancelUrl) {
      return new Response(
        JSON.stringify({ error: "mode, successUrl, and cancelUrl are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Get user from auth header
    const authHeader = req.headers.get("Authorization");
    let userId = "anonymous";
    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const payload = JSON.parse(atob(token.split(".")[1]));
        userId = payload.sub || "anonymous";
      } catch {}
    }

    const metadata: Record<string, string> = { userId, mode };
    if (appointmentId) metadata.appointmentId = appointmentId;
    if (planId) metadata.planId = planId;

    let sessionParams: Record<string, any>;

    if (mode === "subscription" && priceId) {
      sessionParams = {
        mode: "subscription",
        line_items: [{ price: priceId, quantity: 1 }],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata,
      };
    } else {
      // Payment mode — dynamic price
      const amount = 8900; // R$89.00 default, could be dynamic
      sessionParams = {
        mode: "payment",
        line_items: [{
          price_data: {
            currency: "brl",
            product_data: { name: "Consulta Médica — AloClinica" },
            unit_amount: amount,
          },
          quantity: 1,
        }],
        success_url: `${successUrl}?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl,
        metadata,
      };
    }

    // Create Stripe Checkout Session
    const params = new URLSearchParams();
    params.append("mode", sessionParams.mode);
    params.append("success_url", sessionParams.success_url);
    params.append("cancel_url", sessionParams.cancel_url);

    sessionParams.line_items.forEach((item: any, i: number) => {
      if (item.price) {
        params.append(`line_items[${i}][price]`, item.price);
        params.append(`line_items[${i}][quantity]`, String(item.quantity));
      } else if (item.price_data) {
        params.append(`line_items[${i}][price_data][currency]`, item.price_data.currency);
        params.append(`line_items[${i}][price_data][product_data][name]`, item.price_data.product_data.name);
        params.append(`line_items[${i}][price_data][unit_amount]`, String(item.price_data.unit_amount));
        params.append(`line_items[${i}][quantity]`, String(item.quantity));
      }
    });

    Object.entries(metadata).forEach(([key, value]) => {
      params.append(`metadata[${key}]`, value);
    });

    const stripeRes = await fetch("https://api.stripe.com/v1/checkout/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${STRIPE_SECRET_KEY}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: params.toString(),
    });

    const session = await stripeRes.json();

    if (!stripeRes.ok) {
      console.error("Stripe error:", session);
      return new Response(
        JSON.stringify({ error: session.error?.message || "Stripe error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ sessionUrl: session.url, sessionId: session.id }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
