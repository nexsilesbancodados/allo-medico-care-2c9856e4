import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

/**
 * Scheduled tasks edge function — call via cron or manually.
 * Handles: subscription/card expiration, no-show marking, expiry notifications.
 */
serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const results: Record<string, any> = {};

  try {
    // 1. Expire subscriptions and discount cards (issues #6, #19)
    const { error: expireErr } = await supabase.rpc("expire_subscriptions_and_cards");
    results.expire_subscriptions = expireErr ? expireErr.message : "ok";

    // 2. Mark no-shows (issue #10)
    const { error: noShowErr } = await supabase.rpc("mark_no_shows");
    results.mark_no_shows = noShowErr ? noShowErr.message : "ok";

    // 3. Send 7-day expiry notifications
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const oneDayFromNow = new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString();
    const now = new Date().toISOString();

    // Subscriptions expiring in 7 days
    const { data: expiringSubs7 } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at")
      .eq("status", "active")
      .lte("expires_at", sevenDaysFromNow)
      .gt("expires_at", oneDayFromNow);

    for (const sub of expiringSubs7 ?? []) {
      const daysLeft = Math.ceil((new Date(sub.expires_at!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      await supabase.from("notifications").insert({
        user_id: sub.user_id,
        title: "⏳ Plano expirando",
        message: `Seu plano vence em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}. Renove para não perder acesso.`,
        type: "subscription",
        link: "/dashboard/plans",
      });
    }

    // Subscriptions expiring tomorrow
    const { data: expiringSubs1 } = await supabase
      .from("subscriptions")
      .select("user_id, expires_at")
      .eq("status", "active")
      .lte("expires_at", oneDayFromNow)
      .gt("expires_at", now);

    for (const sub of expiringSubs1 ?? []) {
      await supabase.from("notifications").insert({
        user_id: sub.user_id,
        title: "🚨 Plano vence amanhã!",
        message: "Seu plano vence amanhã. Renove agora para manter acesso às consultas.",
        type: "subscription",
        link: "/dashboard/plans",
      });
    }

    // Discount cards expiring in 7 days
    const { data: expiringCards } = await supabase
      .from("discount_cards")
      .select("user_id, valid_until")
      .eq("status", "active")
      .lte("valid_until", sevenDaysFromNow)
      .gt("valid_until", now);

    for (const card of expiringCards ?? []) {
      const daysLeft = Math.ceil((new Date(card.valid_until!).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      await supabase.from("notifications").insert({
        user_id: card.user_id,
        title: "⏳ Cartão de Benefícios expirando",
        message: `Seu cartão vence em ${daysLeft} dia${daysLeft > 1 ? "s" : ""}. Renove para manter os descontos.`,
        type: "subscription",
        link: "/dashboard/plans",
      });
    }

    results.notifications_sent = (expiringSubs7?.length ?? 0) + (expiringSubs1?.length ?? 0) + (expiringCards?.length ?? 0);

    console.log("[Scheduled Tasks] Results:", results);

    return new Response(JSON.stringify({ success: true, results }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[Scheduled Tasks] Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
