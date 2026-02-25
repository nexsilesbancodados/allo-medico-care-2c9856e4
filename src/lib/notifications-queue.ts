import { supabase } from "@/integrations/supabase/client";

/**
 * Notify on-duty doctors via Push + In-App when a patient enters the urgent care queue
 */
export const notifyDoctorsNewQueueEntry = async (
  patientName: string,
  shift: string,
  price: number
) => {
  try {
    const shiftLabels: Record<string, string> = { day: "Diurno", night: "Noturno", dawn: "Madrugada" };
    const shiftLabel = shiftLabels[shift] || shift;

    // Get all doctors with role 'doctor'
    const { data: doctorRoles } = await supabase
      .from("user_roles")
      .select("user_id")
      .eq("role", "doctor");

    if (!doctorRoles?.length) return;

    // Notify each doctor
    for (const dr of doctorRoles) {
      // In-app notification
      supabase.from("notifications").insert({
        user_id: dr.user_id,
        title: "🚨 Novo paciente no Plantão 24h",
        message: `${patientName} entrou na fila do plantão ${shiftLabel} (R$ ${price.toFixed(2)}). Atenda agora!`,
        type: "urgent",
        link: "/dashboard/doctor/on-duty?role=doctor",
      }).then(() => {});

      // Push notification
      supabase.functions.invoke("send-push-notification", {
        body: {
          user_id: dr.user_id,
          title: "🚨 Novo paciente no Plantão!",
          message: `${patientName} está aguardando atendimento (${shiftLabel}). Acesse o painel de plantão.`,
          link: "/dashboard/doctor/on-duty?role=doctor",
        },
      }).catch(console.error);
    }
  } catch (err) {
    console.error("notifyDoctorsNewQueueEntry error:", err);
  }
};

/**
 * Notify patient via Email + WhatsApp + In-App when prescription renewal is approved
 */
export const notifyRenewalApproved = async (
  patientId: string,
  doctorName: string
) => {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, phone")
      .eq("user_id", patientId)
      .single();
    const patientName = profile?.first_name || "Paciente";

    // Email
    supabase.functions.invoke("send-email", {
      body: {
        type: "renewal_approved",
        to: "resolve-from-user",
        data: {
          patient_name: patientName,
          doctor_name: doctorName,
        },
      },
    }).catch(console.error);

    // WhatsApp
    if (profile?.phone) {
      supabase.functions.invoke("send-whatsapp", {
        body: {
          phone: profile.phone,
          message: `✅ *Receita Renovada!*\n\nOlá ${patientName},\n${doctorName} aprovou a renovação da sua receita.\n\nAcesse a plataforma para baixar a nova receita. 💚`,
        },
      }).catch(console.error);
    }

    // In-app
    supabase.from("notifications").insert({
      user_id: patientId,
      title: "✅ Receita Renovada!",
      message: `${doctorName} aprovou a renovação da sua receita. Acesse para baixar.`,
      type: "prescription",
      link: "/dashboard/prescription-renewal?role=patient",
    }).then(() => {});

    // Push
    supabase.functions.invoke("send-push-notification", {
      body: {
        user_id: patientId,
        title: "✅ Receita Renovada!",
        message: `${doctorName} aprovou sua renovação de receita.`,
        link: "/dashboard/prescription-renewal?role=patient",
      },
    }).catch(console.error);
  } catch (err) {
    console.error("notifyRenewalApproved error:", err);
  }
};

/**
 * Notify patient via Email + In-App when prescription renewal is rejected
 */
export const notifyRenewalRejected = async (
  patientId: string,
  doctorName: string,
  reason: string
) => {
  try {
    const { data: profile } = await supabase
      .from("profiles")
      .select("first_name, phone")
      .eq("user_id", patientId)
      .single();
    const patientName = profile?.first_name || "Paciente";

    // WhatsApp
    if (profile?.phone) {
      supabase.functions.invoke("send-whatsapp", {
        body: {
          phone: profile.phone,
          message: `❌ *Renovação Não Aprovada*\n\nOlá ${patientName},\nInfelizmente sua renovação de receita não foi aprovada.\n\n📝 Motivo: ${reason}\n\nRecomendamos agendar uma teleconsulta. 💚`,
        },
      }).catch(console.error);
    }

    // In-app
    supabase.from("notifications").insert({
      user_id: patientId,
      title: "❌ Renovação Não Aprovada",
      message: `Sua renovação não foi aprovada. Motivo: ${reason}`,
      type: "warning",
      link: "/dashboard/prescription-renewal?role=patient",
    }).then(() => {});
  } catch (err) {
    console.error("notifyRenewalRejected error:", err);
  }
};
