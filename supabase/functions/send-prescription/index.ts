import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface SendPrescriptionRequest {
  appointment_id: string;
  doctor_name: string;
  patient_name: string;
  medications: { name: string; dosage?: string; frequency?: string }[];
  diagnosis?: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: SendPrescriptionRequest = await req.json();
    const { appointment_id, doctor_name, patient_name, medications, diagnosis } = body;

    if (!appointment_id) {
      return new Response(JSON.stringify({ error: "appointment_id required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch appointment to get patient info
    const { data: appt } = await supabase
      .from("appointments")
      .select("patient_id, guest_patient_id")
      .eq("id", appointment_id)
      .single();

    if (!appt) {
      return new Response(JSON.stringify({ error: "Appointment not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let email: string | null = null;
    let phone: string | null = null;
    let recipientName = patient_name;

    // Guest patient
    if (appt.guest_patient_id) {
      const { data: guest } = await supabase
        .from("guest_patients")
        .select("email, phone, full_name")
        .eq("id", appt.guest_patient_id)
        .single();

      if (guest) {
        email = guest.email;
        phone = guest.phone;
        recipientName = guest.full_name;
      }
    }

    // Registered patient
    if (appt.patient_id) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("phone, first_name, last_name")
        .eq("user_id", appt.patient_id)
        .single();

      if (profile) {
        phone = profile.phone;
        recipientName = `${profile.first_name} ${profile.last_name}`;
      }

      // Get email from auth
      const { data: authUser } = await supabase.auth.admin.getUserById(appt.patient_id);
      if (authUser?.user?.email) {
        email = authUser.user.email;
      }
    }

    // Build medication list text
    const medList = medications
      .filter((m) => m.name)
      .map((m, i) => {
        let line = `${i + 1}. *${m.name}*`;
        if (m.dosage) line += ` — ${m.dosage}`;
        if (m.frequency) line += ` (${m.frequency})`;
        return line;
      })
      .join("\n");

    const results: { email?: unknown; whatsapp?: unknown } = {};

    // ─── Send Email ───
    if (email) {
      try {
        const emailRes = await fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            type: "prescription_sent",
            to: email,
            data: {
              patient_name: recipientName,
              doctor_name: doctor_name,
              medications: medList,
              diagnosis: diagnosis || "Não especificado",
            },
          }),
        });
        results.email = await emailRes.json();
        console.log("Email sent:", results.email);
      } catch (e: unknown) {
        console.error("Email send error:", e);
        results.email = { error: e instanceof Error ? e.message : String(e) };
      }
    }

    // ─── Send WhatsApp ───
    if (phone) {
      try {
        const whatsappMessage = [
          `🏥 *AloClinica — Receita Médica*`,
          ``,
          `Olá, *${recipientName}*!`,
          ``,
          `O(a) *${doctor_name}* prescreveu os seguintes medicamentos:`,
          ``,
          medList,
          diagnosis ? `\n📋 *Diagnóstico:* ${diagnosis}` : "",
          ``,
          `Acesse a plataforma para ver a receita completa e baixar o PDF.`,
          ``,
          `_Receita digital emitida pela AloClinica_`,
        ]
          .filter(Boolean)
          .join("\n");

        const whatsRes = await fetch(`${supabaseUrl}/functions/v1/send-whatsapp`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseKey}`,
          },
          body: JSON.stringify({
            phone,
            message: whatsappMessage,
          }),
        });
        results.whatsapp = await whatsRes.json();
        console.log("WhatsApp sent:", results.whatsapp);
      } catch (e: unknown) {
        console.error("WhatsApp send error:", e);
        results.whatsapp = { error: e instanceof Error ? e.message : String(e) };
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        sent_to: { email: !!email, whatsapp: !!phone },
        results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
