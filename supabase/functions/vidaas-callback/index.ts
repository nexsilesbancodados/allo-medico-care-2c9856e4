import { serve } from "https://deno.land/std@0.208.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const error = url.searchParams.get("error");

  if (error) {
    return new Response(null, {
      status: 302,
      headers: { Location: `/dashboard?vidaas_error=${error}` },
    });
  }

  if (code) {
    return new Response(null, {
      status: 302,
      headers: { Location: `/dashboard?vidaas_code=${code}` },
    });
  }

  return new Response(JSON.stringify({ error: "No code received" }), {
    status: 400,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
});
