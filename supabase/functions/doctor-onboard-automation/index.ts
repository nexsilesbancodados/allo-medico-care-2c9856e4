import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface DoctorRegistrationRequest {
  email: string;
  full_name: string;
  crm: string;
  crm_state: string;
  phone?: string;
  specialty?: string;
}

function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const segments = [];
  for (let s = 0; s < 2; s++) {
    let seg = "";
    for (let i = 0; i < 4; i++) {
      const randomBytes = new Uint8Array(1);
      crypto.getRandomValues(randomBytes);
      seg += chars[randomBytes[0] % chars.length];
    }
    segments.push(seg);
  }
  return `MED-${segments[0]}-${segments[1]}`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify caller is admin
    const authHeader = req.headers.get("Authorization");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";

    // Create client with caller's token to verify admin
    const callerClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader || "" } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Não autenticado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use service role to check admin
    const adminClient = createClient(supabaseUrl, serviceKey);
    const { data: roleData } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Permissão negada. Apenas administradores." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body: DoctorRegistrationRequest = await req.json();
    const { email, full_name, crm, crm_state, phone, specialty } = body;

    // --- VALIDATION ---
    const errors: string[] = [];
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) errors.push("Email inválido");
    if (!full_name || full_name.trim().length < 3) errors.push("Nome completo é obrigatório (mín. 3 caracteres)");
    if (!crm || !/^\d{4,7}$/.test(crm.trim())) errors.push("CRM inválido (4-7 dígitos)");
    if (!crm_state || crm_state.trim().length !== 2) errors.push("UF do CRM inválida");

    if (errors.length > 0) {
      return new Response(JSON.stringify({ error: "Validação falhou", details: errors }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- CRM VERIFICATION ---
    let crmVerified = false;
    let crmVerificationDetails: Record<string, unknown> = {};
    try {
      const crmApiKey = Deno.env.get("CONSULTA_CRM_API_KEY");
      if (crmApiKey) {
        const crmRes = await fetch(
          `https://www.consultacrm.com.br/api/index.php?tipo=crm&q=${crm.trim()}&chave=${crmApiKey}&destino=json&uf=${crm_state.trim().toUpperCase()}`
        );
        const crmData = await crmRes.json();
        if (crmData?.item?.[0]) {
          const item = crmData.item[0];
          crmVerified = item.situacao?.toLowerCase().includes("regular") || item.situacao?.toLowerCase().includes("ativo");
          crmVerificationDetails = {
            nome: item.nome,
            situacao: item.situacao,
            especialidade: item.especialidade,
          };
        }
      }
    } catch (crmErr) {
      console.error("CRM verification error (non-blocking):", crmErr);
    }

    // --- CHECK DUPLICATES ---
    const { data: existingCode } = await adminClient
      .from("doctor_invite_codes")
      .select("id, code")
      .eq("is_used", false)
      .limit(1);

    // Check if email already has an account
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const emailExists = existingUsers?.users?.some(u => u.email === email.toLowerCase());

    if (emailExists) {
      return new Response(JSON.stringify({ error: "Este email já está cadastrado na plataforma." }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- GENERATE INVITE CODE ---
    const inviteCode = generateInviteCode();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7 days validity

    const { data: codeRecord, error: codeError } = await adminClient
      .from("doctor_invite_codes")
      .insert({
        code: inviteCode,
        created_by: caller.id,
        expires_at: expiresAt.toISOString(),
      })
      .select("id")
      .single();

    if (codeError) {
      console.error("Error creating invite code:", codeError);
      return new Response(JSON.stringify({ error: "Erro ao gerar código de convite" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- SEND EMAIL ---
    const nameParts = full_name.trim().split(" ");
    const firstName = nameParts[0];

    try {
      const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${serviceKey}`,
        },
        body: JSON.stringify({
          type: "doctor_invite",
          to: email,
          data: {
            name: firstName,
            full_name: full_name.trim(),
            crm: `${crm.trim()}/${crm_state.trim().toUpperCase()}`,
            invite_code: inviteCode,
            expires_at: expiresAt.toLocaleDateString("pt-BR"),
            crm_status: crmVerified ? "✅ Verificado" : "⏳ Verificação pendente",
            signup_url: `https://allo-medico-care.lovable.app/medico`,
          },
        }),
      });
      const emailResult = await emailRes.json();
      console.log("Email sent:", emailResult);
    } catch (emailErr) {
      console.error("Email send error (non-blocking):", emailErr);
    }

    // --- LOG ACTIVITY ---
    try {
      await adminClient.from("activity_logs").insert({
        user_id: caller.id,
        performed_by: caller.id,
        action: "doctor_onboard_initiated",
        entity_type: "doctor_invite_codes",
        entity_id: codeRecord.id,
        details: {
          doctor_email: email,
          doctor_name: full_name,
          crm: `${crm}/${crm_state}`,
          crm_verified: crmVerified,
          invite_code: inviteCode,
        },
      });
    } catch (logErr) {
      console.error("Activity log error (non-blocking):", logErr);
    }

    // --- NOTIFY ADMIN VIA NOTIFICATION ---
    try {
      await adminClient.from("notifications").insert({
        user_id: caller.id,
        title: "Médico convidado",
        message: `Convite enviado para ${full_name} (${crm}/${crm_state}) — código: ${inviteCode}`,
        type: "info",
        link: "/dashboard?tab=approvals",
      });
    } catch (notifErr) {
      console.error("Notification error (non-blocking):", notifErr);
    }

    return new Response(
      JSON.stringify({
        success: true,
        invite_code: inviteCode,
        code_id: codeRecord.id,
        expires_at: expiresAt.toISOString(),
        crm_verified: crmVerified,
        crm_details: crmVerificationDetails,
        email_sent: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("doctor-onboard-automation error:", err);
    return new Response(JSON.stringify({ error: "Erro interno no servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
