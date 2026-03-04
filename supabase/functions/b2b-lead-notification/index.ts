import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "npm:resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { company_name, contact_name, email, phone, company_type, services_interested, message } = await req.json();

    const resendKey = Deno.env.get("RESEND_API_KEY");
    if (!resendKey) throw new Error("RESEND_API_KEY not configured");

    const resend = new Resend(resendKey);

    const servicesText = Array.isArray(services_interested) ? services_interested.join(", ") : "Não especificado";

    await resend.emails.send({
      from: "AloClinica <noreply@aloclinica.com.br>",
      to: ["plenasaudebv@gmail.com"],
      subject: `🏢 Novo Lead B2B: ${company_name}`,
      html: `
        <h2>Novo Lead B2B recebido!</h2>
        <table style="border-collapse:collapse;width:100%">
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Empresa</td><td style="padding:8px;border:1px solid #ddd">${company_name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Contato</td><td style="padding:8px;border:1px solid #ddd">${contact_name}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Email</td><td style="padding:8px;border:1px solid #ddd">${email}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Telefone</td><td style="padding:8px;border:1px solid #ddd">${phone || "N/A"}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Tipo</td><td style="padding:8px;border:1px solid #ddd">${company_type}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Serviços</td><td style="padding:8px;border:1px solid #ddd">${servicesText}</td></tr>
          <tr><td style="padding:8px;border:1px solid #ddd;font-weight:bold">Mensagem</td><td style="padding:8px;border:1px solid #ddd">${message || "N/A"}</td></tr>
        </table>
      `,
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("B2B notification error:", error);
    return new Response(JSON.stringify({ error: msg }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
