import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface WhatsAppRequest {
  phone: string;
  message: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const EVOLUTION_API_URL = Deno.env.get("EVOLUTION_API_URL");
    const EVOLUTION_API_KEY = Deno.env.get("EVOLUTION_API_KEY");
    const EVOLUTION_INSTANCE_NAME = Deno.env.get("EVOLUTION_INSTANCE_NAME");

    if (!EVOLUTION_API_URL || !EVOLUTION_API_KEY || !EVOLUTION_INSTANCE_NAME) {
      console.log("[DEV] WhatsApp would be sent but Evolution API not configured");
      const body: WhatsAppRequest = await req.json();
      console.log("[DEV] Message:", JSON.stringify(body));
      return new Response(
        JSON.stringify({ success: true, dev: true, message: "WhatsApp logged (Evolution API not configured)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: WhatsAppRequest = await req.json();
    const { phone, message } = body;

    if (!phone || !message) {
      return new Response(JSON.stringify({ error: "phone and message are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Clean phone number - keep only digits
    const cleanPhone = phone.replace(/\D/g, "");
    // Add country code if not present
    const fullPhone = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

    const apiUrl = `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`;

    const res = await fetch(apiUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: fullPhone,
        text: message,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Evolution API error:", result);
      return new Response(JSON.stringify({ error: "Failed to send WhatsApp", details: result }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, data: result }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
