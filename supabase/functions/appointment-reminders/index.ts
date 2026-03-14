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

    // Windows: 1h, 30min, 15min before appointment
    const windows = [
      { min: 55, max: 65, label: "1 hora" },
      { min: 28, max: 33, label: "30 minutos" },
      { min: 13, max: 18, label: "15 minutos" },
    ];

    const orClauses = windows.map(w => {
      const from = new Date(now.getTime() + w.min * 60 * 1000);
      const to = new Date(now.getTime() + w.max * 60 * 1000);
      return `and(scheduled_at.gte.${from.toISOString()},scheduled_at.lt.${to.toISOString()})`;
    }).join(",");

    const { data: appointments } = await supabase
      .from("appointments")
      .select("id, scheduled_at, patient_id, doctor_id, status, jitsi_link, guest_patient_id")
      .in("status", ["scheduled", "confirmed"])
      .or(orClauses);

    if (!appointments || appointments.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const patientIds = [...new Set(appointments.map(a => a.patient_id).filter(Boolean))];
    const doctorIds = [...new Set(appointments.map(a => a.doctor_id))];

    const [patientsRes, doctorsRes] = await Promise.all([
      patientIds.length > 0
        ? supabase.from("profiles").select("user_id, first_name, last_name, phone").in("user_id", patientIds)
        : { data: [] },
      supabase.from("doctor_profiles").select("id, user_id").in("id", doctorIds),
    ]);

    const patientMap = new Map((patientsRes.data ?? []).map(p => [p.user_id, p]));

    const docUserIds = (doctorsRes.data ?? []).map(d => d.user_id);
    const { data: docProfiles } = docUserIds.length > 0
      ? await supabase.from("profiles").select("user_id, first_name, last_name, phone").in("user_id", docUserIds)
      : { data: [] };
    const docNameMap = new Map<string, string>();
    const docProfileMap = new Map<string, any>();
    (doctorsRes.data ?? []).forEach(d => {
      const p = docProfiles?.find(pr => pr.user_id === d.user_id);
      if (p) {
        docNameMap.set(d.id, `Dr(a). ${p.first_name} ${p.last_name}`);
        docProfileMap.set(d.id, { ...p, doctor_profile_id: d.id });
      }
    });

    let sent = 0;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const sendEmailUrl = `${supabaseUrl}/functions/v1/send-email`;
    const sendWhatsAppUrl = `${supabaseUrl}/functions/v1/send-whatsapp`;
    const sendPushUrl = `${supabaseUrl}/functions/v1/send-push-notification`;

    for (const appt of appointments) {
      if (!appt.patient_id) continue;

      const { data: authUser } = await supabase.auth.admin.getUserById(appt.patient_id);
      if (!authUser?.user?.email) continue;

      const patient = patientMap.get(appt.patient_id);
      const scheduledAt = new Date(appt.scheduled_at);
      const diffMin = Math.round((scheduledAt.getTime() - now.getTime()) / 60000);
      const timeUntil = diffMin <= 18 ? "15 minutos" : diffMin <= 33 ? "30 minutos" : "1 hora";
      const jitsiLink = appt.jitsi_link || `https://meet.jit.si/allo-medico-${appt.id}`;
      const patientName = patient ? `${patient.first_name} ${patient.last_name}` : "Paciente";
      const doctorName = docNameMap.get(appt.doctor_id) ?? "Médico";

      const headers = { "Content-Type": "application/json", Authorization: `Bearer ${anonKey}` };

      // 1. Email reminder
      try {
        await fetch(sendEmailUrl, {
          method: "POST", headers,
          body: JSON.stringify({
            type: "appointment_reminder",
            to: authUser.user.email,
            data: {
              patient_name: patientName,
              doctor_name: doctorName,
              date: scheduledAt.toLocaleDateString("pt-BR"),
              time: scheduledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }),
              time_until: timeUntil,
            },
          }),
        });
        sent++;
      } catch (e) {
        console.error(`Email fail ${appt.id}:`, e);
      }

      // 2. WhatsApp reminder to patient
      if (patient?.phone) {
        try {
          const msg = `⏰ *Lembrete: consulta em ${timeUntil}!*\n\nOlá ${patient.first_name},\nSua consulta com ${doctorName} ${diffMin <= 18 ? "está prestes a começar" : `é em ${timeUntil}`}.\n\n📹 Sala: ${jitsiLink}\n\nEntre com antecedência. 🏥`;
          await fetch(sendWhatsAppUrl, { method: "POST", headers, body: JSON.stringify({ phone: patient.phone, message: msg }) });
        } catch (e) {
          console.error(`WhatsApp patient fail ${appt.id}:`, e);
        }
      }

      // 3. WhatsApp reminder to doctor
      const docProfile = docProfileMap.get(appt.doctor_id);
      if (docProfile?.phone) {
        try {
          const msg = `⏰ *Lembrete: consulta em ${timeUntil}!*\n\nDr(a). ${docProfile.first_name},\nSua consulta com ${patientName} ${diffMin <= 18 ? "está prestes a começar" : `é em ${timeUntil}`}.\n\n📹 Sala: ${jitsiLink}`;
          await fetch(sendWhatsAppUrl, { method: "POST", headers, body: JSON.stringify({ phone: docProfile.phone, message: msg }) });
        } catch (e) {
          console.error(`WhatsApp doctor fail ${appt.id}:`, e);
        }
      }

      // 4. Push notification to patient
      try {
        await fetch(sendPushUrl, {
          method: "POST", headers,
          body: JSON.stringify({
            user_id: appt.patient_id,
            title: `⏰ Consulta em ${timeUntil}`,
            body: `Sua consulta com ${doctorName} é em ${timeUntil}. Prepare-se!`,
            url: `/dashboard/consultation/${appt.id}`,
          }),
        });
      } catch (e) {
        console.error(`Push patient fail ${appt.id}:`, e);
      }

      // 5. Push notification to doctor
      const doctorData = doctorsRes.data?.find(d => d.id === appt.doctor_id);
      if (doctorData) {
        try {
          await fetch(sendPushUrl, {
            method: "POST", headers,
            body: JSON.stringify({
              user_id: doctorData.user_id,
              title: `⏰ Consulta em ${timeUntil}`,
              body: `Consulta com ${patientName} em ${timeUntil}.`,
              url: `/dashboard/consultation/${appt.id}`,
            }),
          });
        } catch (e) {
          console.error(`Push doctor fail ${appt.id}:`, e);
        }
      }

      // 6. In-app notification
      try {
        await supabase.from("notifications").insert([
          {
            user_id: appt.patient_id,
            title: `⏰ Consulta em ${timeUntil}`,
            message: `Sua consulta com ${doctorName} é em ${timeUntil}. Acesse a sala de espera.`,
            type: "reminder",
            link: `/dashboard/consultation/${appt.id}`,
          },
          ...(doctorData ? [{
            user_id: doctorData.user_id,
            title: `⏰ Consulta em ${timeUntil}`,
            message: `Consulta com ${patientName} em ${timeUntil}.`,
            type: "reminder",
            link: `/dashboard/consultation/${appt.id}`,
          }] : []),
        ]);
      } catch (e) {
        console.error(`In-app notification fail ${appt.id}:`, e);
      }
    }

    console.log(`Sent ${sent} reminder sets (email+whatsapp+push+in-app)`);
    return new Response(JSON.stringify({ sent, appointments: appointments.length }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
