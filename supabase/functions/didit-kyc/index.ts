import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const DIDIT_API_KEY = Deno.env.get("DIDIT_API_KEY");
  const DIDIT_WORKFLOW_ID = Deno.env.get("DIDIT_WORKFLOW_ID");

  if (!DIDIT_API_KEY || !DIDIT_WORKFLOW_ID) {
    return new Response(
      JSON.stringify({ error: "Didit not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  try {
    const url = new URL(req.url);
    const path = url.pathname.split("/").pop();

    // POST /didit-kyc — create session
    if (req.method === "POST" && (!path || path === "didit-kyc")) {
      // Authenticate user
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const token = authHeader.replace("Bearer ", "");
      const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
      if (claimsError || !claimsData?.claims) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const userId = claimsData.claims.sub as string;
      const body = await req.json().catch(() => ({}));
      const callbackUrl = body.callback || `${req.headers.get("origin") || "https://allo-medico-care.lovable.app"}/dashboard/profile?role=patient&kyc=complete`;

      // Get user info for prefill
      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, last_name, email, phone, cpf, date_of_birth")
        .eq("user_id", userId)
        .maybeSingle();

      // Create Didit session
      const sessionPayload: Record<string, unknown> = {
        workflow_id: DIDIT_WORKFLOW_ID,
        callback: callbackUrl,
        vendor_data: userId,
      };

      if (profile) {
        sessionPayload.expected_details = {
          ...(profile.first_name && { first_name: profile.first_name }),
          ...(profile.last_name && { last_name: profile.last_name }),
          ...(profile.date_of_birth && { date_of_birth: profile.date_of_birth }),
        };
        const email = profile.email || claimsData.claims.email;
        if (email) {
          sessionPayload.contact_details = {
            email,
            email_lang: "pt",
            send_notification_emails: true,
            ...(profile.phone && { phone: profile.phone }),
          };
        }
      }

      const diditRes = await fetch("https://verification.didit.me/v3/session/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": DIDIT_API_KEY,
        },
        body: JSON.stringify(sessionPayload),
      });

      if (!diditRes.ok) {
        const errText = await diditRes.text();
        console.error("[didit-kyc] Create session error:", diditRes.status, errText);
        return new Response(
          JSON.stringify({ error: "Failed to create Didit session", details: errText }),
          { status: diditRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const session = await diditRes.json();

      // Log the session creation
      await supabase.from("activity_logs").insert({
        action: "kyc_session_created",
        entity_type: "kyc",
        entity_id: session.session_id,
        user_id: userId,
        details: { provider: "didit", session_id: session.session_id, status: session.status },
      });

      return new Response(
        JSON.stringify({
          session_id: session.session_id,
          verification_url: session.verification_url,
          session_token: session.session_token,
          status: session.status,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // GET /didit-kyc?session_id=xxx — retrieve session status
    if (req.method === "GET") {
      const sessionId = url.searchParams.get("session_id");
      if (!sessionId) {
        return new Response(JSON.stringify({ error: "session_id required" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const diditRes = await fetch(`https://verification.didit.me/v3/session/${sessionId}`, {
        headers: { "x-api-key": DIDIT_API_KEY },
      });

      if (!diditRes.ok) {
        return new Response(
          JSON.stringify({ error: "Failed to retrieve session" }),
          { status: diditRes.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const result = await diditRes.json();

      return new Response(
        JSON.stringify({
          session_id: result.session_id,
          status: result.status,
          decision: result.decision,
          vendor_data: result.vendor_data,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("[didit-kyc] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
