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

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  try {
    const body = await req.json();
    const event = body.event;
    const payment = body.payment;

    console.log(`[Asaas Webhook] Event: ${event}, Payment ID: ${payment?.id}, ExternalRef: ${payment?.externalReference}`);

    if (!payment) {
      return new Response(JSON.stringify({ received: true, message: "No payment data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const appointmentId = payment.externalReference;

    // Map Asaas events to internal payment statuses
    const statusMap: Record<string, string> = {
      PAYMENT_CONFIRMED: "approved",
      PAYMENT_RECEIVED: "approved",
      PAYMENT_CREDIT_CARD_CAPTURE_REFUSED: "refused",
      PAYMENT_OVERDUE: "overdue",
      PAYMENT_DELETED: "cancelled",
      PAYMENT_RESTORED: "pending",
      PAYMENT_REFUNDED: "refunded",
      PAYMENT_PARTIALLY_REFUNDED: "partially_refunded",
      PAYMENT_CREATED: "pending",
      PAYMENT_UPDATED: "pending",
      PAYMENT_AWAITING_RISK_ANALYSIS: "analyzing",
      PAYMENT_APPROVED_BY_RISK_ANALYSIS: "approved",
      PAYMENT_REPROVED_BY_RISK_ANALYSIS: "refused",
      PAYMENT_CHARGEBACK_REQUESTED: "chargeback",
      PAYMENT_CHARGEBACK_DISPUTE: "chargeback",
      PAYMENT_AWAITING_CHARGEBACK_REVERSAL: "chargeback",
      PAYMENT_DUNNING_RECEIVED: "approved",
      PAYMENT_DUNNING_REQUESTED: "overdue",
    };

    const newPaymentStatus = statusMap[event];

    if (!newPaymentStatus) {
      console.log(`[Asaas Webhook] Unhandled event: ${event}`);
      return new Response(JSON.stringify({ received: true, message: "Event not mapped" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ─── Update appointment payment status ───
    if (appointmentId) {
      const updateData: Record<string, any> = {
        payment_status: newPaymentStatus,
      };

      // On approval: confirm appointment + timestamp
      if (newPaymentStatus === "approved") {
        updateData.payment_confirmed_at = new Date().toISOString();
        updateData.status = "confirmed";
      }

      // On refund/chargeback: cancel appointment
      if (["refunded", "chargeback", "cancelled"].includes(newPaymentStatus)) {
        updateData.status = "cancelled";
        updateData.cancel_reason = `Pagamento ${newPaymentStatus === "refunded" ? "reembolsado" : newPaymentStatus === "chargeback" ? "contestado (chargeback)" : "cancelado"} via Asaas`;
      }

      // On refused: mark as failed
      if (newPaymentStatus === "refused") {
        updateData.payment_status = "refused";
      }

      const { data: appointment, error: updateError } = await supabase
        .from("appointments")
        .update(updateData)
        .eq("id", appointmentId)
        .select("id, patient_id, guest_patient_id, doctor_id, scheduled_at, status")
        .single();

      if (updateError) {
        console.error("Error updating appointment:", updateError);
      } else {
        console.log(`[Asaas Webhook] Appointment ${appointmentId} → payment_status: ${newPaymentStatus}, status: ${updateData.status || "(unchanged)"}`);

        // ─── Notifications on payment confirmation ───
        if (newPaymentStatus === "approved" && appointment) {
          const scheduledDate = new Date(appointment.scheduled_at).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo",
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          });

          // Notify patient (if registered)
          if (appointment.patient_id) {
            await supabase.from("notifications").insert({
              user_id: appointment.patient_id,
              title: "✅ Pagamento Confirmado!",
              message: `Seu pagamento foi aprovado. Consulta agendada para ${scheduledDate}.`,
              type: "payment",
              link: "/dashboard/appointments",
            });
          }

          // Notify doctor
          const { data: doctorProfile } = await supabase
            .from("doctor_profiles")
            .select("user_id")
            .eq("id", appointment.doctor_id)
            .single();

          if (doctorProfile?.user_id) {
            await supabase.from("notifications").insert({
              user_id: doctorProfile.user_id,
              title: "💰 Novo Pagamento Confirmado",
              message: `Pagamento confirmado para consulta em ${scheduledDate}.`,
              type: "payment",
              link: "/dashboard/appointments",
            });
          }

          // Send WhatsApp notification to patient
          try {
            let patientPhone: string | null = null;
            let patientName = "";

            if (appointment.patient_id) {
              const { data: profile } = await supabase
                .from("profiles")
                .select("phone, first_name")
                .eq("user_id", appointment.patient_id)
                .single();
              patientPhone = profile?.phone || null;
              patientName = profile?.first_name || "";
            } else if (appointment.guest_patient_id) {
              const { data: guest } = await supabase
                .from("guest_patients")
                .select("phone, full_name")
                .eq("id", appointment.guest_patient_id)
                .single();
              patientPhone = guest?.phone || null;
              patientName = guest?.full_name?.split(" ")[0] || "";
            }

            if (patientPhone) {
              const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
              const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
              const whatsappMsg = `✅ *Pagamento Confirmado!*\n\nOlá, ${patientName}!\nSeu pagamento foi aprovado com sucesso.\n\n📅 Consulta: ${scheduledDate}\n\nAcesse o link da consulta no horário marcado. Até lá! 💚\n\n_Alô Médico_`;

              await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${SERVICE_KEY}`,
                },
                body: JSON.stringify({ phone: patientPhone, message: whatsappMsg }),
              });
            }
          } catch (whatsErr) {
            console.warn("WhatsApp notification failed (non-blocking):", whatsErr);
          }

          // Send email notification
          try {
            let patientEmail: string | null = null;
            let patientName = "";

            if (appointment.guest_patient_id) {
              const { data: guest } = await supabase
                .from("guest_patients")
                .select("email, full_name")
                .eq("id", appointment.guest_patient_id)
                .single();
              patientEmail = guest?.email || null;
              patientName = guest?.full_name || "";
            }

            if (patientEmail) {
              const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
              const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

              await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${SERVICE_KEY}`,
                },
                body: JSON.stringify({
                  to: patientEmail,
                  subject: "✅ Pagamento Confirmado - Alô Médico",
                  html: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px">
                    <h2 style="color:#0ea5e9">Pagamento Confirmado! ✅</h2>
                    <p>Olá, <strong>${patientName}</strong>!</p>
                    <p>Seu pagamento foi aprovado com sucesso.</p>
                    <div style="background:#f0f9ff;padding:16px;border-radius:8px;margin:16px 0">
                      <p style="margin:4px 0"><strong>📅 Data:</strong> ${scheduledDate}</p>
                      <p style="margin:4px 0"><strong>💰 Valor:</strong> R$ ${payment.value?.toFixed(2) || "—"}</p>
                    </div>
                    <p>Acesse o link da consulta no horário marcado.</p>
                    <p style="color:#64748b;font-size:12px;margin-top:24px">Alô Médico — Cuidando de você 💚</p>
                  </div>`,
                }),
              });
            }
          } catch (emailErr) {
            console.warn("Email notification failed (non-blocking):", emailErr);
          }
        }

        // ─── Notifications on refund ───
        if (["refunded", "partially_refunded"].includes(newPaymentStatus) && appointment?.patient_id) {
          await supabase.from("notifications").insert({
            user_id: appointment.patient_id,
            title: "💸 Reembolso Processado",
            message: newPaymentStatus === "refunded"
              ? `Seu pagamento de R$ ${payment.value?.toFixed(2)} foi reembolsado integralmente.`
              : `Um reembolso parcial foi processado para sua consulta.`,
            type: "payment",
            link: "/dashboard/appointments",
          });
        }

        // ─── Notifications on refusal ───
        if (newPaymentStatus === "refused" && appointment?.patient_id) {
          await supabase.from("notifications").insert({
            user_id: appointment.patient_id,
            title: "❌ Pagamento Recusado",
            message: "Seu pagamento não foi aprovado. Tente novamente com outro método de pagamento.",
            type: "payment",
            link: "/dashboard/appointments",
          });
        }
      }
    }

    // ─── Activity log for every event ───
    await supabase.from("activity_logs").insert({
      action: `asaas_${event.toLowerCase()}`,
      entity_type: "payment",
      entity_id: payment.id,
      details: {
        appointment_id: appointmentId,
        billing_type: payment.billingType,
        value: payment.value,
        net_value: payment.netValue,
        payment_status: newPaymentStatus,
        asaas_status: payment.status,
        customer_id: payment.customer,
        due_date: payment.dueDate,
        confirmed_date: payment.confirmedDate,
        original_due_date: payment.originalDueDate,
        payment_date: payment.paymentDate,
        invoice_url: payment.invoiceUrl,
        bank_slip_url: payment.bankSlipUrl,
        refund_value: payment.refundedValue || null,
      },
    });

    return new Response(JSON.stringify({ received: true, status: newPaymentStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("[Asaas Webhook] Fatal error:", error);
    // Always return 200 to Asaas to prevent retry storms
    return new Response(JSON.stringify({ received: true, error: error.message }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
