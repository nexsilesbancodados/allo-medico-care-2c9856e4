import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface EmailRequest {
  type: "appointment_confirmation" | "appointment_reminder" | "prescription_sent" | "welcome";
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
        <p>Acesse a plataforma para visualizar e baixar sua receita em PDF.</p>
        <p style="color:#666;font-size:12px;">AloClinica — Telemedicina</p>
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
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      // If no API key, log the email that would be sent (dev mode)
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
        from: Deno.env.get("EMAIL_FROM") || "AloClinica <noreply@aloclinica.com>",
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