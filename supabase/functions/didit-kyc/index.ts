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

  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const DEEPSEEK_API_KEY = Deno.env.get("DEEPSEEK_API_KEY");
  if (!DEEPSEEK_API_KEY) {
    return new Response(JSON.stringify({ error: "DeepSeek API not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
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
    const body = await req.json();
    const { document_image, selfie_image } = body;

    if (!document_image || !selfie_image) {
      return new Response(JSON.stringify({ error: "document_image and selfie_image are required (base64)" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call DeepSeek Vision API via OpenRouter
    const aiResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${DEEPSEEK_API_KEY}`,
      },
      body: JSON.stringify({
        model: "deepseek/deepseek-chat-v3-0324:free",
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `Analise estas duas imagens. A primeira é um documento de identidade brasileiro e a segunda é uma selfie. Verifique se o rosto na selfie é o mesmo do documento. Extraia o Nome e o CPF do documento. Responda estritamente em JSON sem markdown: {"match": boolean, "score": 0-100, "nome": string, "cpf": string}. Se não conseguir identificar algum campo, use null.`
              },
              {
                type: "image_url",
                image_url: { url: document_image.startsWith("data:") ? document_image : `data:image/jpeg;base64,${document_image}` }
              },
              {
                type: "image_url",
                image_url: { url: selfie_image.startsWith("data:") ? selfie_image : `data:image/jpeg;base64,${selfie_image}` }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("[kyc-verify] AI API error:", aiResponse.status, errText);
      return new Response(
        JSON.stringify({ error: "AI verification failed", details: errText }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const rawContent = aiResult.choices?.[0]?.message?.content || "";
    console.log("[kyc-verify] AI raw response:", rawContent);

    // Parse JSON from response
    let verification: { match: boolean; score: number; nome: string | null; cpf: string | null };
    try {
      const jsonStr = rawContent.replace(/```json\s*/g, "").replace(/```/g, "").trim();
      verification = JSON.parse(jsonStr);
    } catch {
      console.error("[kyc-verify] Failed to parse AI response:", rawContent);
      return new Response(
        JSON.stringify({ error: "Failed to parse verification result", raw: rawContent }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use service role for writing
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Log the verification
    await supabaseAdmin.from("activity_logs").insert({
      action: verification.match ? "kyc_approved" : "kyc_rejected",
      entity_type: "kyc",
      entity_id: userId,
      user_id: userId,
      details: {
        provider: "deepseek_vision",
        match: verification.match,
        score: verification.score,
        nome: verification.nome,
        cpf: verification.cpf,
      },
    });

    // If match, update doctor KYC status
    if (verification.match && verification.score >= 60) {
      const { data: doctorProfile } = await supabaseAdmin
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (doctorProfile) {
        await supabaseAdmin
          .from("doctor_profiles")
          .update({
            kyc_status: "approved",
            kyc_verified_at: new Date().toISOString(),
            kyc_face_match_score: verification.score,
          })
          .eq("user_id", userId);
      }

      // Notify user
      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: "✅ Identidade verificada!",
        message: "Sua verificação biométrica foi aprovada com sucesso.",
        type: "info",
        link: "/dashboard",
      });
    } else {
      // Rejected
      const { data: doctorProfile } = await supabaseAdmin
        .from("doctor_profiles")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (doctorProfile) {
        await supabaseAdmin
          .from("doctor_profiles")
          .update({ kyc_status: "rejected" })
          .eq("user_id", userId);
      }

      await supabaseAdmin.from("notifications").insert({
        user_id: userId,
        title: "❌ Verificação não aprovada",
        message: "Não foi possível confirmar sua identidade. Tente novamente com fotos mais nítidas.",
        type: "warning",
        link: "/dashboard/profile?kyc=open",
      });
    }

    return new Response(
      JSON.stringify({
        match: verification.match,
        score: verification.score,
        nome: verification.nome,
        cpf: verification.cpf,
        status: verification.match && verification.score >= 60 ? "approved" : "rejected",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("[kyc-verify] Error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
