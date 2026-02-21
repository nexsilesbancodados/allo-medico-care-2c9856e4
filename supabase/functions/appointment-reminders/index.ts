import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const now = new Date();

    // Find appointments in the next 1h and 15min windows
    const in1h = new Date(now.getTime() + 60 * 60 * 1000);
    const in1h5 = new Date(now.getTime() + 65 * 60 * 1000);
    const in15 = new Date(now.getTime() + 15 * 60 * 1000);
    const in20 = new Date(now.getTime() + 20 * 60 * 1000);

    // Get appointments in both windows
    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, scheduled_at, patient_id, doctor_id, status, jitsi_link, guest_patient_id")
      .in("status", ["scheduled", "confirmed"])
      .or(
        `and(scheduled_at.gte.${in1h.toISOString()},scheduled_at.lt.${in1h5.toISOString()}),and(scheduled_at.gte.${in15.toISOString()},scheduled_at.lt.${in20.toISOString()})`
      );

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get patient and doctor info
    const patientIds = [...new Set(appointments.map(a => a.patient_id).filter(Boolean))];
    const doctorIds = [...new Set(appointments.map(a => a.doctor_id))];

    const [patientsRes, doctorsRes] = await Promise.all([
      patientIds.length > 0
        ? supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", patientIds)
        : { data: [] },
      supabase.from("doctor_profiles").select("id, user_id").in("id", doctorIds),
    ]);

    const patientMap = new Map((patientsRes.data ?? []).map(p => [p.user_id, p]));
    
    // Get doctor names
    const docUserIds = (doctorsRes.data ?? []).map(d => d.user_id);
    const { data: docProfiles } = docUserIds.length > 0
      ? await supabase.from("profiles").select("user_id, first_name, last_name").in("user_id", docUserIds)
      : { data: [] };
    const docNameMap = new Map<string, string>();
    (doctorsRes.data ?? []).forEach(d => {
      const p = docProfiles?.find(pr => pr.user_id === d.user_id);
      if (p) docNameMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
    });

    // Get patient emails from auth
    let sent = 0;
    const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    for (const appt of appointments) {
      if (!appt.patient_id) continue;

      // Get email from auth.users
      const { data: authUser } = await supabase.auth.admin.getUserById(appt.patient_id);
      if (!authUser?.user?.email) continue;

      const patient = patientMap.get(appt.patient_id);
      const scheduledAt = new Date(appt.scheduled_at);
      const diffMin = Math.round((scheduledAt.getTime() - now.getTime()) / 60000);
      const timeUntil = diffMin <= 20 ? "15 minutos" : "1 hora";

      const emailData = {
        type: "appointment_reminder",
        to: authUser.user.email,
        data: {
          patient_name: patient ? `${patient.first_name} ${patient.last_name}` : "Paciente",
          doctor_name: docNameMap.get(appt.doctor_id) ?? "Médico",
          date: scheduledAt.toLocaleDateString("pt-BR"),
          time: scheduledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
          time_until: timeUntil,
        },
      };

      try {
        await fetch(sendEmailUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${anonKey}`,
          },
          body: JSON.stringify(emailData),
        });
        sent++;
      } catch (e) {
        console.error(`Failed to send email reminder for appointment ${appt.id}:`, e);
      }

      // Send WhatsApp reminder with Jitsi link
      const patientProfile = patientMap.get(appt.patient_id);
      const patientPhone = patientProfile?.phone;
      if (patientPhone) {
        try {
          const jitsiLink = appt.jitsi_link || `https://meet.jit.si/allo-medico-${appt.id}`;
          const whatsappMsg = diffMin <= 20
            ? `⏰ *Lembrete: sua consulta começa em 15 minutos!*\n\nOlá ${patientProfile.first_name},\nSua consulta com ${docNameMap.get(appt.doctor_id) ?? "seu médico"} está prestes a começar.\n\n📹 Acesse a sala:\n${jitsiLink}\n\nEntre com 5 minutos de antecedência. 🏥`
            : `📋 *Lembrete de Consulta*\n\nOlá ${patientProfile.first_name},\nSua consulta com ${docNameMap.get(appt.doctor_id) ?? "seu médico"} é em 1 hora.\n\n📅 ${scheduledAt.toLocaleDateString("pt-BR")} às ${scheduledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}\n\n📹 Link da sala: ${jitsiLink}\n\nPrepare-se! 🏥`;

          await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${anonKey}`,
            },
            body: JSON.stringify({ phone: patientPhone, message: whatsappMsg }),
          });
        } catch (e) {
          console.error(`Failed to send WhatsApp reminder for appointment ${appt.id}:`, e);
        }
      }
    }

    console.log(`Sent ${sent} reminder emails`);
    return new Response(JSON.stringify({ sent }), {
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
