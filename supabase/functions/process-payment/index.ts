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
    const { plan_id, user_id, payment_method, amount, coupon_code } = await req.json();

    if (!plan_id || !user_id || !payment_method) {
      return new Response(
        JSON.stringify({ error: "plan_id, user_id, and payment_method are required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Validate plan
    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("*")
      .eq("id", plan_id)
      .eq("is_active", true)
      .single();

    if (planError || !plan) {
      return new Response(
        JSON.stringify({ error: "Plano não encontrado ou inativo" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let finalAmount = plan.price;

    // Apply coupon if provided
    if (coupon_code) {
      const { data: coupon } = await supabase
        .from("coupons")
        .select("*")
        .eq("code", coupon_code.toUpperCase())
        .eq("is_active", true)
        .single();

      if (coupon) {
        const isExpired = coupon.expires_at && new Date(coupon.expires_at) < new Date();
        const isMaxUsed = coupon.max_uses && coupon.times_used >= coupon.max_uses;

        if (!isExpired && !isMaxUsed) {
          finalAmount = plan.price * (1 - coupon.discount_percentage / 100);
          // Increment coupon usage
          await supabase
            .from("coupons")
            .update({ times_used: coupon.times_used + 1 })
            .eq("id", coupon.id);
        }
      }
    }

    // Create subscription
    const startsAt = new Date();
    const expiresAt = new Date();
    if (plan.interval === "monthly") {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    } else if (plan.interval === "yearly") {
      expiresAt.setFullYear(expiresAt.getFullYear() + 1);
    } else {
      expiresAt.setMonth(expiresAt.getMonth() + 1);
    }

    // Cancel existing active subscriptions
    await supabase
      .from("subscriptions")
      .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
      .eq("user_id", user_id)
      .eq("status", "active");

    const { data: subscription, error: subError } = await supabase
      .from("subscriptions")
      .insert({
        user_id,
        plan_id,
        status: "active",
        starts_at: startsAt.toISOString(),
        expires_at: expiresAt.toISOString(),
        current_period_end: expiresAt.toISOString(),
        payment_method,
        notes: `Pagamento: R$${finalAmount.toFixed(2)} via ${payment_method}`,
      })
      .select("id")
      .single();

    if (subError) {
      console.error("Subscription error:", subError);
      return new Response(
        JSON.stringify({ error: "Erro ao criar assinatura" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Log activity
    await supabase.from("activity_logs").insert({
      action: "subscription_created",
      entity_type: "subscription",
      entity_id: subscription.id,
      user_id,
      details: {
        plan_name: plan.name,
        amount: finalAmount,
        payment_method,
        coupon_code: coupon_code || null,
      },
    });

    // Send confirmation email
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name")
        .eq("user_id", user_id)
        .single();

      const { data: userAuth } = await supabase.auth.admin.getUserById(user_id);

      if (userAuth?.user?.email) {
        await supabase.functions.invoke("send-email", {
          body: {
            type: "welcome",
            to: userAuth.user.email,
            data: { name: profile?.first_name || "Paciente" },
          },
        });
      }
    } catch (emailErr) {
      console.error("Email notification failed:", emailErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        subscription_id: subscription.id,
        amount: finalAmount,
        expires_at: expiresAt.toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Payment error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
