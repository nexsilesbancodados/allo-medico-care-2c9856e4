import { supabase } from "@/integrations/supabase/client";

/**
 * Notify appointment cancellation via Email + WhatsApp + In-App
 */
export const notifyAppointmentCancelled = async (
  appointmentId: string,
  cancelledByName: string,
  reason?: string
) => {
  try {
    const { data: appt } = await supabase
      .from("appointments")
      .select("id, scheduled_at, patient_id, doctor_id, guest_patient_id")
      .eq("id", appointmentId)
      .single();
    if (!appt) return;

    const scheduledAt = new Date(appt.scheduled_at);
    const dateStr = scheduledAt.toLocaleDateString("pt-BR");
    const timeStr = scheduledAt.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

    // Get doctor name
    const { data: docProfile } = await supabase
      .from("doctor_profiles").select("user_id").eq("id", appt.doctor_id).single();
    let doctorName = "Médico";
    let doctorPhone = "";
    if (docProfile) {
      const { data: dp } = await supabase
        .from("profiles").select("first_name, last_name, phone").eq("user_id", docProfile.user_id).single();
      if (dp) {
        doctorName = `Dr(a). ${dp.first_name} ${dp.last_name}`;
        doctorPhone = dp.phone || "";
      }
    }

    // Get patient info
    let patientName = "Paciente";
    let patientPhone = "";
    let patientEmail = "";
    let patientUserId = appt.patient_id;

    if (appt.guest_patient_id) {
      const { data: guest } = await supabase
        .from("guest_patients").select("full_name, phone, email").eq("id", appt.guest_patient_id).single();
      if (guest) {
        patientName = guest.full_name;
        patientPhone = guest.phone;
        patientEmail = guest.email;
      }
    } else if (appt.patient_id) {
      const { data: profile } = await supabase
        .from("profiles").select("first_name, last_name, phone").eq("user_id", appt.patient_id).single();
      if (profile) {
        patientName = `${profile.first_name} ${profile.last_name}`;
        patientPhone = profile.phone || "";
      }
    }

    // Email to patient
    supabase.functions.invoke("send-email", {
      body: {
        type: "appointment_cancelled",
        to: patientEmail || "skip",
        data: { patient_name: patientName, doctor_name: doctorName, date: dateStr, time: timeStr, reason: reason || "", cancelled_by: cancelledByName },
      },
    }).catch(console.error);

    // WhatsApp to patient
    if (patientPhone) {
      supabase.functions.invoke("send-whatsapp", {
        body: {
          phone: patientPhone,
          message: `❌ *Consulta Cancelada*\n\nOlá ${patientName},\nSua consulta com ${doctorName} em ${dateStr} às ${timeStr} foi cancelada.\n${reason ? `📝 Motivo: ${reason}\n` : ""}\nDeseja reagendar? Acesse a plataforma. 💚`,
        },
      }).catch(console.error);
    }

    // WhatsApp to doctor
    if (doctorPhone) {
      supabase.functions.invoke("send-whatsapp", {
        body: {
          phone: doctorPhone,
          message: `❌ *Consulta Cancelada*\n\n${doctorName}, a consulta com ${patientName} em ${dateStr} às ${timeStr} foi cancelada.\n${reason ? `Motivo: ${reason}` : ""}`,
        },
      }).catch(console.error);
    }

    // In-app notifications
    if (patientUserId) {
      supabase.from("notifications").insert({
        user_id: patientUserId,
        title: "❌ Consulta Cancelada",
        message: `Sua consulta com ${doctorName} em ${dateStr} às ${timeStr} foi cancelada.${reason ? ` Motivo: ${reason}` : ""}`,
        type: "appointment",
        link: "/dashboard/appointments?role=patient",
      }).then(() => {});
    }
    if (docProfile) {
      supabase.from("notifications").insert({
        user_id: docProfile.user_id,
        title: "❌ Consulta Cancelada",
        message: `Consulta com ${patientName} em ${dateStr} às ${timeStr} foi cancelada.`,
        type: "appointment",
        link: "/dashboard/doctor/consultations?role=doctor",
      }).then(() => {});
    }
  } catch (err) {
    console.error("notifyAppointmentCancelled error:", err);
  }
};

/**
 * Notify certificate issued via Email + WhatsApp
 */
export const notifyCertificateSent = async (
  patientName: string,
  patientCpf: string,
  doctorName: string,
  certType: string,
  verificationCode: string,
  days?: number
) => {
  // We don't have patient email/phone easily here, so we send via edge function  
  // This is a fire-and-forget notification
  try {
    // Try to find patient by name + CPF to get phone/email
    if (patientCpf) {
      const { data: profile } = await supabase
        .from("profiles").select("user_id, phone, first_name").eq("cpf", patientCpf.replace(/\D/g, "")).single();
      
      if (profile) {
        // Email  
        supabase.functions.invoke("send-email", {
          body: {
            type: "certificate_sent",
            to: "resolve-from-user",
            data: {
              patient_name: patientName,
              doctor_name: doctorName,
              cert_type: certType,
              verification_code: verificationCode,
              days: days?.toString() || "",
            },
          },
        }).catch(console.error);

        // WhatsApp
        if (profile.phone) {
          supabase.functions.invoke("send-whatsapp", {
            body: {
              phone: profile.phone,
              message: `📋 *Atestado Médico Emitido*\n\nOlá ${patientName},\n${doctorName} emitiu um ${certType} para você.\n\n🔐 Código de verificação: ${verificationCode}\n${days ? `📅 Dias de afastamento: ${days}\n` : ""}\nAcesse a plataforma para baixar o PDF. 💚`,
            },
          }).catch(console.error);
        }

        // In-app
        supabase.from("notifications").insert({
          user_id: profile.user_id,
          title: "📋 Atestado Emitido",
          message: `${doctorName} emitiu um ${certType}. Código: ${verificationCode}`,
          type: "document",
          link: "/dashboard/patient/documents?role=patient",
        }).then(() => {});
      }
    }
  } catch (err) {
    console.error("notifyCertificateSent error:", err);
  }
};

/**
 * Notify doctor approved/rejected
 */
export const notifyDoctorApproval = async (
  doctorUserId: string,
  doctorName: string,
  approved: boolean,
  reason?: string
) => {
  try {
    const emailType = approved ? "doctor_approved" : "doctor_rejected";
    
    supabase.functions.invoke("send-email", {
      body: {
        type: emailType,
        to: "resolve-from-user",
        data: {
          name: doctorName,
          reason: reason || "",
          login_url: `${window.location.origin}/medico`,
        },
      },
    }).catch(console.error);

    // In-app notification
    supabase.from("notifications").insert({
      user_id: doctorUserId,
      title: approved ? "✅ Cadastro Aprovado!" : "❌ Cadastro Não Aprovado",
      message: approved
        ? "Seu cadastro médico foi aprovado! Configure sua disponibilidade e comece a atender."
        : `Seu cadastro não foi aprovado.${reason ? ` Motivo: ${reason}` : ""}`,
      type: approved ? "success" : "warning",
      link: approved ? "/dashboard?role=doctor" : undefined,
    }).then(() => {});
  } catch (err) {
    console.error("notifyDoctorApproval error:", err);
  }
};

/**
 * Notify consultation started (doctor entered room)
 */
export const notifyConsultationStarted = async (
  appointmentId: string,
  doctorName: string
) => {
  try {
    const { data: appt } = await supabase
      .from("appointments")
      .select("patient_id, guest_patient_id, scheduled_at")
      .eq("id", appointmentId)
      .single();
    if (!appt) return;

    const consultationUrl = `${window.location.origin}/dashboard/consultation/${appointmentId}`;

    if (appt.patient_id) {
      const { data: profile } = await supabase
        .from("profiles").select("first_name, phone").eq("user_id", appt.patient_id).single();
      const patientName = profile?.first_name || "Paciente";

      // WhatsApp
      if (profile?.phone) {
        supabase.functions.invoke("send-whatsapp", {
          body: {
            phone: profile.phone,
            message: `📹 *${doctorName} está na sala!*\n\nOlá ${patientName}, seu médico já está aguardando na sala de consulta.\n\n🔗 Acesse agora: ${consultationUrl}\n\nEntre o mais rápido possível! 💚`,
          },
        }).catch(console.error);
      }

      // Push notification
      supabase.functions.invoke("send-push-notification", {
        body: {
          user_id: appt.patient_id,
          title: `📹 ${doctorName} está na sala!`,
          body: "Seu médico já está aguardando. Acesse agora!",
          url: `/dashboard/consultation/${appointmentId}`,
        },
      }).catch(console.error);

      // In-app
      supabase.from("notifications").insert({
        user_id: appt.patient_id,
        title: `📹 ${doctorName} está na sala!`,
        message: "Seu médico já está aguardando na sala de consulta virtual. Acesse agora!",
        type: "consultation",
        link: `/dashboard/consultation/${appointmentId}`,
      }).then(() => {});
    }

    // Guest patient
    if (appt.guest_patient_id) {
      const { data: guest } = await supabase
        .from("guest_patients").select("phone, full_name").eq("id", appt.guest_patient_id).single();
      if (guest?.phone) {
        supabase.functions.invoke("send-whatsapp", {
          body: {
            phone: guest.phone,
            message: `📹 *${doctorName} está na sala!*\n\nOlá ${guest.full_name}, seu médico já está aguardando.\n\n🔗 Acesse: ${consultationUrl}`,
          },
        }).catch(console.error);
      }
    }
  } catch (err) {
    console.error("notifyConsultationStarted error:", err);
  }
};

/**
 * Notify document uploaded by doctor
 */
export const notifyDocumentUploaded = async (
  patientId: string,
  doctorName: string,
  fileName: string,
  description?: string
) => {
  try {
    const { data: profile } = await supabase
      .from("profiles").select("first_name, phone").eq("user_id", patientId).single();
    const patientName = profile?.first_name || "Paciente";

    // Email
    supabase.functions.invoke("send-email", {
      body: {
        type: "document_uploaded",
        to: "resolve-from-user",
        data: {
          patient_name: patientName,
          doctor_name: doctorName,
          file_name: fileName,
          description: description || "",
        },
      },
    }).catch(console.error);

    // WhatsApp
    if (profile?.phone) {
      supabase.functions.invoke("send-whatsapp", {
        body: {
          phone: profile.phone,
          message: `📎 *Novo Documento Disponível*\n\nOlá ${patientName},\n${doctorName} enviou um novo documento: ${fileName}\n${description ? `📝 ${description}\n` : ""}\nAcesse a plataforma para baixar. 💚`,
        },
      }).catch(console.error);
    }

    // In-app
    supabase.from("notifications").insert({
      user_id: patientId,
      title: "📎 Novo Documento",
      message: `${doctorName} enviou: ${fileName}`,
      type: "document",
      link: "/dashboard/patient/documents?role=patient",
    }).then(() => {});
  } catch (err) {
    console.error("notifyDocumentUploaded error:", err);
  }
};

/**
 * Notify prescription sent to patient via Email + WhatsApp + Push + In-App
 */
export const notifyPrescriptionSent = async (
  patientId: string,
  doctorName: string,
  diagnosis?: string,
  medicationsSummary?: string
) => {
  try {
    const { data: profile } = await supabase
      .from("profiles").select("first_name, phone").eq("user_id", patientId).single();
    const patientName = profile?.first_name || "Paciente";

    // Email
    supabase.functions.invoke("send-email", {
      body: {
        type: "prescription_sent",
        to: "resolve-from-user",
        data: {
          patient_name: patientName,
          doctor_name: doctorName,
          diagnosis: diagnosis || "",
          medications: medicationsSummary || "",
        },
      },
    }).catch(console.error);

    // WhatsApp
    if (profile?.phone) {
      supabase.functions.invoke("send-whatsapp", {
        body: {
          phone: profile.phone,
          message: `💊 *Nova Receita Médica*\n\nOlá ${patientName},\n${doctorName} emitiu uma nova receita para você.\n${diagnosis ? `📋 Diagnóstico: ${diagnosis}\n` : ""}\nAcesse a plataforma para baixar o PDF. 💚`,
        },
      }).catch(console.error);
    }

    // Push
    supabase.functions.invoke("send-push-notification", {
      body: {
        user_id: patientId,
        title: `💊 Nova Receita de ${doctorName}`,
        message: "Uma nova receita médica foi emitida. Acesse para visualizar.",
        link: "/dashboard/patient/health?role=patient",
      },
    }).catch(console.error);

    // In-app
    supabase.from("notifications").insert({
      user_id: patientId,
      title: "💊 Nova Receita Médica",
      message: `${doctorName} emitiu uma nova receita.${diagnosis ? ` Diagnóstico: ${diagnosis}` : ""}`,
      type: "prescription",
      link: "/dashboard/patient/health?role=patient",
    }).then(() => {});
  } catch (err) {
    console.error("notifyPrescriptionSent error:", err);
  }
};

/**
 * Notify appointment rescheduled via Email + WhatsApp + In-App
 */
export const notifyAppointmentRescheduled = async (
  appointmentId: string,
  newDate: string,
  newTime: string
) => {
  try {
    const { data: appt } = await supabase
      .from("appointments")
      .select("patient_id, doctor_id, guest_patient_id")
      .eq("id", appointmentId)
      .single();
    if (!appt) return;

    // Get doctor name
    const { data: docProfile } = await supabase
      .from("doctor_profiles").select("user_id").eq("id", appt.doctor_id).single();
    let doctorName = "Médico";
    if (docProfile) {
      const { data: dp } = await supabase
        .from("profiles").select("first_name, last_name").eq("user_id", docProfile.user_id).single();
      if (dp) doctorName = `Dr(a). ${dp.first_name} ${dp.last_name}`;
    }

    // Get patient info
    let patientName = "Paciente";
    let patientPhone = "";
    let patientUserId = appt.patient_id;

    if (appt.guest_patient_id) {
      const { data: guest } = await supabase
        .from("guest_patients").select("full_name, phone").eq("id", appt.guest_patient_id).single();
      if (guest) { patientName = guest.full_name; patientPhone = guest.phone; }
    } else if (appt.patient_id) {
      const { data: profile } = await supabase
        .from("profiles").select("first_name, last_name, phone").eq("user_id", appt.patient_id).single();
      if (profile) { patientName = `${profile.first_name} ${profile.last_name}`; patientPhone = profile.phone || ""; }
    }

    // Email
    supabase.functions.invoke("send-email", {
      body: {
        type: "appointment_rescheduled",
        to: "resolve-from-user",
        data: { patient_name: patientName, doctor_name: doctorName, new_date: newDate, new_time: newTime },
      },
    }).catch(console.error);

    // WhatsApp
    if (patientPhone) {
      supabase.functions.invoke("send-whatsapp", {
        body: {
          phone: patientPhone,
          message: `🔄 *Consulta Reagendada*\n\nOlá ${patientName},\nSua consulta com ${doctorName} foi reagendada.\n\n📅 Nova data: *${newDate}*\n⏰ Novo horário: *${newTime}*\n\nAcesse a plataforma para mais detalhes. 💚`,
        },
      }).catch(console.error);
    }

    // In-app
    if (patientUserId) {
      supabase.from("notifications").insert({
        user_id: patientUserId,
        title: "🔄 Consulta Reagendada",
        message: `Sua consulta com ${doctorName} foi reagendada para ${newDate} às ${newTime}.`,
        type: "appointment",
        link: "/dashboard/appointments?role=patient",
      }).then(() => {});
    }
  } catch (err) {
    console.error("notifyAppointmentRescheduled error:", err);
  }
};

/**
 * Notify doctor about a new appointment via WhatsApp + Push + In-App
 */
export const notifyNewAppointment = async (
  appointmentId: string,
  doctorProfileId: string,
  patientName: string,
  dateStr: string,
  timeStr: string
) => {
  try {
    const { data: docProfile } = await supabase
      .from("doctor_profiles").select("user_id").eq("id", doctorProfileId).single();
    if (!docProfile) return;

    const { data: docInfo } = await supabase
      .from("profiles").select("first_name, phone").eq("user_id", docProfile.user_id).single();

    // WhatsApp to doctor
    if (docInfo?.phone) {
      supabase.functions.invoke("send-whatsapp", {
        body: {
          phone: docInfo.phone,
          message: `📅 *Novo Agendamento*\n\nOlá Dr(a). ${docInfo.first_name},\nVocê tem uma nova consulta agendada!\n\n👤 Paciente: ${patientName}\n📅 Data: ${dateStr}\n⏰ Horário: ${timeStr}\n\nAcesse o painel para mais detalhes. 💚`,
        },
      }).catch(console.error);
    }

    // Push
    supabase.functions.invoke("send-push-notification", {
      body: {
        user_id: docProfile.user_id,
        title: "📅 Novo Agendamento",
        message: `${patientName} agendou uma consulta para ${dateStr} às ${timeStr}.`,
        link: "/dashboard/doctor/consultations?role=doctor",
      },
    }).catch(console.error);

    // In-app
    supabase.from("notifications").insert({
      user_id: docProfile.user_id,
      title: "📅 Novo Agendamento",
      message: `${patientName} agendou uma consulta para ${dateStr} às ${timeStr}.`,
      type: "appointment",
      link: "/dashboard/doctor/consultations?role=doctor",
    }).then(() => {});
  } catch (err) {
    console.error("notifyNewAppointment error:", err);
  }
};

/**
 * Notify patient about payment confirmation via WhatsApp + In-App
 */
export const notifyPaymentConfirmed = async (
  patientId: string,
  doctorName: string,
  dateStr: string,
  amount?: string
) => {
  try {
    const { data: profile } = await supabase
      .from("profiles").select("first_name, phone").eq("user_id", patientId).single();
    const patientName = profile?.first_name || "Paciente";

    // WhatsApp
    if (profile?.phone) {
      supabase.functions.invoke("send-whatsapp", {
        body: {
          phone: profile.phone,
          message: `✅ *Pagamento Confirmado*\n\nOlá ${patientName},\nSeu pagamento${amount ? ` de R$ ${amount}` : ""} para a consulta com ${doctorName} em ${dateStr} foi confirmado!\n\nSua consulta está garantida. 💚`,
        },
      }).catch(console.error);
    }

    // In-app
    supabase.from("notifications").insert({
      user_id: patientId,
      title: "✅ Pagamento Confirmado",
      message: `Pagamento${amount ? ` de R$ ${amount}` : ""} confirmado para consulta com ${doctorName}.`,
      type: "payment",
      link: "/dashboard/appointments?role=patient",
    }).then(() => {});
  } catch (err) {
    console.error("notifyPaymentConfirmed error:", err);
  }
};

/**
 * Notify clinic approved/rejected via Email + In-App
 */
export const notifyClinicApproval = async (
  clinicUserId: string,
  clinicName: string,
  approved: boolean,
  reason?: string
) => {
  try {
    supabase.functions.invoke("send-email", {
      body: {
        type: approved ? "clinic_approved" : "clinic_rejected",
        to: "resolve-from-user",
        data: {
          name: clinicName,
          clinic_name: clinicName,
          reason: reason || "",
          login_url: `${window.location.origin}/clinica`,
        },
      },
    }).catch(console.error);

    supabase.from("notifications").insert({
      user_id: clinicUserId,
      title: approved ? "✅ Clínica Aprovada!" : "❌ Clínica Não Aprovada",
      message: approved
        ? `Sua clínica ${clinicName} foi aprovada! Configure seus médicos e comece a operar.`
        : `Sua clínica ${clinicName} não foi aprovada.${reason ? ` Motivo: ${reason}` : ""}`,
      type: approved ? "success" : "warning",
      link: approved ? "/dashboard?role=clinic" : undefined,
    }).then(() => {});
  } catch (err) {
    console.error("notifyClinicApproval error:", err);
  }
};

/**
 * Notify consultation completed (post-consultation) via Email + WhatsApp + In-App
 */
export const notifyConsultationCompleted = async (
  appointmentId: string,
  doctorName: string
) => {
  try {
    const { data: appt } = await supabase
      .from("appointments")
      .select("patient_id, guest_patient_id")
      .eq("id", appointmentId)
      .single();
    if (!appt) return;

    if (appt.patient_id) {
      const { data: profile } = await supabase
        .from("profiles").select("first_name, phone").eq("user_id", appt.patient_id).single();
      const patientName = profile?.first_name || "Paciente";

      // Email
      supabase.functions.invoke("send-email", {
        body: {
          type: "consultation_completed",
          to: "resolve-from-user",
          data: { patient_name: patientName, doctor_name: doctorName },
        },
      }).catch(console.error);

      // WhatsApp
      if (profile?.phone) {
        supabase.functions.invoke("send-whatsapp", {
          body: {
            phone: profile.phone,
            message: `🎉 *Consulta Finalizada*\n\nOlá ${patientName},\nSua consulta com ${doctorName} foi concluída!\n\n⭐ Avalie sua experiência na plataforma.\n📋 Receitas e documentos já estão disponíveis no seu painel.\n\nObrigado por usar a AloClinica! 💚`,
          },
        }).catch(console.error);
      }

      // Push
      supabase.functions.invoke("send-push-notification", {
        body: {
          user_id: appt.patient_id,
          title: "🎉 Consulta Finalizada",
          message: `Avalie sua consulta com ${doctorName}!`,
          link: `/dashboard/rate/${appointmentId}`,
        },
      }).catch(console.error);

      // In-app
      supabase.from("notifications").insert({
        user_id: appt.patient_id,
        title: "🎉 Consulta Finalizada",
        message: `Sua consulta com ${doctorName} foi concluída. Avalie sua experiência!`,
        type: "consultation",
        link: `/dashboard/rate/${appointmentId}`,
      }).then(() => {});
    }
  } catch (err) {
    console.error("notifyConsultationCompleted error:", err);
  }
};

/**
 * Notify welcome patient via Email
 */
export const notifyWelcomePatient = async (
  patientName: string,
  email: string
) => {
  try {
    supabase.functions.invoke("send-email", {
      body: {
        type: "welcome",
        to: email,
        data: { name: patientName },
      },
    }).catch(console.error);
  } catch (err) {
    console.error("notifyWelcomePatient error:", err);
  }
};

/**
 * Notify welcome doctor via Email
 */
export const notifyWelcomeDoctor = async (
  doctorName: string,
  email: string,
  crm?: string
) => {
  try {
    supabase.functions.invoke("send-email", {
      body: {
        type: "welcome_doctor",
        to: email,
        data: { name: doctorName, crm: crm || "" },
      },
    }).catch(console.error);
  } catch (err) {
    console.error("notifyWelcomeDoctor error:", err);
  }
};
