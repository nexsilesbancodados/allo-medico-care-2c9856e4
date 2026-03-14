import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    // Get current hour in Brasilia timezone
    const now = new Date();
    const brasiliaOffset = -3;
    const utcHours = now.getUTCHours();
    const brasiliaHour = (utcHours + brasiliaOffset + 24) % 24;

    let shift: string;
    let price: number;
    let label: string;

    if (brasiliaHour >= 7 && brasiliaHour < 19) {
      shift = "day";
      price = 75;
      label = "Diurno (07h–19h)";
    } else if (brasiliaHour >= 19 || brasiliaHour < 0) {
      shift = "night";
      price = 100;
      label = "Noturno (19h–00h)";
    } else {
      shift = "dawn";
      price = 120;
      label = "Madrugada (00h–07h)";
    }

    return new Response(JSON.stringify({ shift, price, label, hour: brasiliaHour }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
