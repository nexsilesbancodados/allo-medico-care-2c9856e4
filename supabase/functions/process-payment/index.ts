import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

/**
 * process-payment: Creates a subscription record AFTER payment is confirmed via Asaas webhook.
 * This function is called internally or from the frontend after Asaas payment confirmation.
 * It validates the plan, applies coupons atomically, creates the subscription, and sends notifications.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { plan_id, user_id, payment_method, coupon_code, asaas_payment_id } = await req.json();

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

    // Apply coupon atomically using the database function
    if (coupon_code) {
      const { data: couponValid } = await supabase.rpc("fn_increment_coupon_usage_atomic", {
        p_code: coupon_code.toUpperCase(),
      });

      if (couponValid) {
        const { data: coupon } = await supabase
          .from("coupons")
          .select("discount_percentage")
          .eq("code", coupon_code.toUpperCase())
          .single();

        if (coupon) {
          finalAmount = plan.price * (1 - coupon.discount_percentage / 100);
        }
      }
    }

    // Calculate expiration
    const startsAt = new Date();
    const expiresAt = new Date();
    if (plan.interval === "yearly") {
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

    // Create new subscription
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
        notes: `Pagamento: R$${finalAmount.toFixed(2)} via ${payment_method}${asaas_payment_id ? ` | Asaas: ${asaas_payment_id}` : ""}`,
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
        asaas_payment_id: asaas_payment_id || null,
      },
    });

    // Send confirmation email + notification
    try {
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name")
        .eq("user_id", user_id)
        .single();

      const { data: userAuth } = await supabase.auth.admin.getUserById(user_id);
      const patientName = profile ? `${profile.first_name} ${profile.last_name}` : "Paciente";

      // In-app notification
      await supabase.from("notifications").insert({
        user_id,
        title: "🎉 Plano Ativado!",
        message: `Seu plano ${plan.name} foi ativado com sucesso.`,
        type: "billing",
        link: "/dashboard",
      });

      // Email
      if (userAuth?.user?.email) {
        const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
        const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
          body: JSON.stringify({
            type: "subscription_activated",
            to: userAuth.user.email,
            data: {
              patient_name: patientName,
              plan_name: plan.name,
              expires_at: expiresAt.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
            },
          }),
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
  } catch (error: unknown) {
    console.error("Payment error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Erro desconhecido" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
