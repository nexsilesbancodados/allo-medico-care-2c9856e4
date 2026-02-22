import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  type: string;
  to: string;
  data: Record<string, string>;
}

const templates: Record<string, (data: Record<string, string>) => { subject: string; html: string }> = {
  appointment_confirmation: (d) => ({
    subject: "✅ Consulta Confirmada — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Consulta Confirmada!</h2>
        <p>Olá <strong>${d.patient_name}</strong>,</p>
        <p>Sua consulta com <strong>${d.doctor_name}</strong> foi confirmada.</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
          <p><strong>📅 Data:</strong> ${d.date}</p>
          <p><strong>⏰ Horário:</strong> ${d.time}</p>
          <p><strong>🩺 Especialidade:</strong> ${d.specialty || "Clínica Geral"}</p>
        </div>
        <p>Acesse a plataforma 5 minutos antes para entrar na sala de espera virtual.</p>
        <p style="color:#666;font-size:12px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  appointment_reminder: (d) => ({
    subject: `⏰ Lembrete: Consulta em ${d.time_until} — AloClinica`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Lembrete de Consulta</h2>
        <p>Olá <strong>${d.patient_name}</strong>,</p>
        <p>Sua consulta com <strong>${d.doctor_name}</strong> acontece em <strong>${d.time_until}</strong>.</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;">
          <p><strong>📅 Data:</strong> ${d.date}</p>
          <p><strong>⏰ Horário:</strong> ${d.time}</p>
        </div>
        <p>Prepare-se para acessar a plataforma no horário agendado.</p>
        <p style="color:#666;font-size:12px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  prescription_sent: (d) => ({
    subject: "💊 Nova Receita Médica — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Nova Receita Médica</h2>
        <p>Olá <strong>${d.patient_name}</strong>,</p>
        <p>O(a) <strong>${d.doctor_name}</strong> emitiu uma nova receita para você.</p>
        ${d.diagnosis ? `<div style="background:#fff8f0;padding:12px;border-radius:8px;margin:12px 0;"><strong>Diagnóstico:</strong> ${d.diagnosis}</div>` : ""}
        ${d.medications ? `<div style="background:white;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #e2e8f0;"><strong>Medicamentos:</strong><pre style="white-space:pre-wrap;font-family:sans-serif;font-size:14px;margin-top:8px;">${d.medications}</pre></div>` : ""}
        <p>Acesse a plataforma para visualizar e baixar sua receita completa em PDF.</p>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  welcome: (d) => ({
    subject: "🎉 Bem-vindo(a) à AloClinica!",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#1a6fc4;">Bem-vindo(a) à AloClinica!</h2>
        <p>Olá <strong>${d.name}</strong>,</p>
        <p>Sua conta foi criada com sucesso. Agora você pode:</p>
        <ul>
          <li>Buscar médicos por especialidade</li>
          <li>Agendar consultas online</li>
          <li>Receber receitas e atestados digitais</li>
        </ul>
        <p>Acesse a plataforma e comece agora!</p>
        <p style="color:#666;font-size:12px;">AloClinica — Telemedicina</p>
      </div>
    `,
  }),
  affiliate_approved: (d) => ({
    subject: "✅ Afiliação Aprovada — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#22c55e;">🎉 Parabéns, ${d.name}!</h2>
        <p>Sua solicitação de afiliação à <strong>AloClinica</strong> foi <strong style="color:#22c55e;">APROVADA</strong>!</p>
        <div style="background:white;padding:16px;border-radius:8px;margin:16px 0;border:1px solid #e2e8f0;">
          <p><strong>💰 Comissão:</strong> 2% sobre todos os ganhos dos pacientes indicados por você</p>
          <p><strong>🔄 Recorrência:</strong> Comissão em assinaturas mensais e consultas avulsas</p>
          <p><strong>💳 Saque:</strong> Solicite saques diretamente pelo painel</p>
        </div>
        <p>Acesse o portal de afiliados para gerar seu link de indicação e começar a ganhar!</p>
        <a href="${d.login_url}" style="display:inline-block;background:#1a6fc4;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;font-weight:bold;margin-top:8px;">Acessar Painel de Afiliado</a>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Programa de Afiliados</p>
      </div>
    `,
  }),
  affiliate_rejected: (d) => ({
    subject: "❌ Solicitação de Afiliação — AloClinica",
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto;padding:24px;background:#f8fafc;border-radius:12px;">
        <h2 style="color:#ef4444;">Solicitação não aprovada</h2>
        <p>Olá <strong>${d.name}</strong>,</p>
        <p>Infelizmente, sua solicitação de afiliação à AloClinica <strong style="color:#ef4444;">não foi aprovada</strong> neste momento.</p>
        ${d.reason ? `<div style="background:#fef2f2;padding:12px;border-radius:8px;margin:12px 0;"><strong>Motivo:</strong> ${d.reason}</div>` : ""}
        <p>Se você acredita que houve um engano, entre em contato com nosso suporte.</p>
        <p style="color:#666;font-size:12px;margin-top:24px;">AloClinica — Programa de Afiliados</p>
      </div>
    `,
  }),
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      const body: EmailRequest = await req.json();
      console.log("[DEV] Email would be sent:", JSON.stringify(body));
      return new Response(
        JSON.stringify({ success: true, dev: true, message: "Email logged (no RESEND_API_KEY configured)" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body: EmailRequest = await req.json();
    const { type, to, data } = body;

    const template = templates[type];
    if (!template) {
      return new Response(JSON.stringify({ error: "Unknown email type" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = template(data);

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: Deno.env.get("EMAIL_FROM") || "AloClinica <onboarding@resend.dev>",
        to: [to],
        subject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: "Failed to send email", details: result }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
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
