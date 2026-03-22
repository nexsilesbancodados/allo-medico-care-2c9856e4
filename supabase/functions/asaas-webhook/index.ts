import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
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

    console.info(`[Asaas Webhook] Event: ${event}, Payment ID: ${payment?.id}, ExternalRef: ${payment?.externalReference}`);

    if (!payment) {
      return new Response(JSON.stringify({ received: true, message: "No payment data" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const externalRef = payment.externalReference || "";

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

    // ─── Handle subscription-related events ───
    const isCardSubscription = externalRef.startsWith("card_");
    
    if (isCardSubscription) {
      console.info(`[Asaas Webhook] Card subscription event: ${event}, ref: ${externalRef}`);
      
      // Parse: card_{planType}_{userId}
      const parts = externalRef.split("_");
      const planType = parts.slice(1, -1).join("_"); // everything between "card_" and last "_userId"
      const userId = parts[parts.length - 1];
      
      if (newPaymentStatus === "approved") {
        // Activate discount card
        const { data: existing } = await supabase
          .from("discount_cards")
          .select("id, status")
          .eq("user_id", userId)
          .eq("plan_type", planType)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        const validUntil = new Date();
        validUntil.setMonth(validUntil.getMonth() + 1);

        if (existing) {
          await supabase.from("discount_cards")
            .update({
              status: "active",
              valid_until: validUntil.toISOString(),
              payment_id: payment.id,
            })
            .eq("id", existing.id);
          console.info(`[Asaas Webhook] Renewed discount card ${existing.id}`);
        } else {
          // Determine price from plan type
          const priceMap: Record<string, number> = {
            prata_familiar: 47.9,
            ouro_individual: 37.9,
            ouro_familiar: 77.9,
            diamante_familiar: 157.9,
          };
          await supabase.from("discount_cards").insert({
            user_id: userId,
            plan_type: planType,
            price_monthly: priceMap[planType] || payment.value || 0,
            discount_percent: 30,
            status: "active",
            valid_until: validUntil.toISOString(),
            payment_id: payment.id,
          });
          console.info(`[Asaas Webhook] Created new discount card for user ${userId}`);
        }

        // Notify user (in-app)
        await supabase.from("notifications").insert({
          user_id: userId,
          title: "✅ Cartão de Benefícios Ativado!",
          message: "Seu pagamento foi confirmado e seu Cartão de Benefícios está ativo.",
          type: "payment",
          link: "/dashboard",
        });

        // Push notification
        try {
          const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
          const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
          await fetch(`${SUPABASE_URL}/functions/v1/send-push-notification`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
            body: JSON.stringify({
              user_id: userId,
              title: "✅ Cartão Ativado!",
              message: "Seu Cartão de Benefícios está ativo. Aproveite os descontos!",
              link: "/dashboard",
            }),
          });
        } catch (pushErr) {
          console.warn("Card activation push failed:", pushErr);
        }

        // WhatsApp notification for card activation
        try {
          const { data: profile } = await supabase.from("profiles").select("first_name, phone").eq("user_id", userId).single();
          if (profile?.phone) {
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
            const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            const planNames: Record<string, string> = {
              prata_familiar: "Mini Família",
              ouro_individual: "Solitário",
              ouro_familiar: "King Família",
              diamante_familiar: "Prime Família",
            };
            await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
              body: JSON.stringify({
                phone: profile.phone,
                message: `✅ *Cartão de Benefícios Ativado!*\n\nOlá ${profile.first_name},\nSeu plano *${planNames[planType] || planType}* está ativo!\n\n💳 Desconto de 30% em todas as consultas\n📅 Válido até ${validUntil.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" })}\n\nAproveite! 💚`,
              }),
            });
          }
        } catch (whatsErr) {
          console.warn("Card activation WhatsApp failed:", whatsErr);
        }

        // Send card activation email
        try {
          const { data: profile } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", userId).single();
          const { data: authUser } = await supabase.auth.admin.getUserById(userId);
          const patientName = profile ? `${profile.first_name} ${profile.last_name}` : "Paciente";
          const validUntilStr = validUntil.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" });
          const planNames: Record<string, string> = {
            prata_familiar: "Mini Família",
            ouro_individual: "Solitário",
            ouro_familiar: "King Família",
            diamante_familiar: "Prime Família",
          };
          if (authUser?.user?.email) {
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
            const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
              method: "POST",
              headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
              body: JSON.stringify({
                type: "card_activated",
                to: authUser.user.email,
                data: {
                  patient_name: patientName,
                  plan_name: planNames[planType] || planType,
                  valid_until: validUntilStr,
                  discount_percent: "30",
                },
              }),
            });
          }
        } catch (emailErr) {
          console.warn("Card activation email failed (non-blocking):", emailErr);
        }
      }

      if (["cancelled", "refunded", "chargeback"].includes(newPaymentStatus || "")) {
        // Deactivate discount card
        const userId = parts[parts.length - 1];
        const planType = parts.slice(1, -1).join("_");
        
        await supabase.from("discount_cards")
          .update({ status: "cancelled", cancelled_at: new Date().toISOString() })
          .eq("user_id", userId)
          .eq("plan_type", planType)
          .eq("status", "active");

        await supabase.from("notifications").insert({
          user_id: userId,
          title: "❌ Cartão de Benefícios Cancelado",
          message: `Seu Cartão de Benefícios foi cancelado devido a: ${newPaymentStatus}.`,
          type: "payment",
          link: "/dashboard/plans",
        });
        console.info(`[Asaas Webhook] Cancelled discount card for user ${userId}`);
      }
    }

    // ─── Handle urgent care queue payments ───
    const isQueuePayment = externalRef.startsWith("queue_");
    if (isQueuePayment && newPaymentStatus === "approved") {
      const queueId = externalRef.replace("queue_", "");
      await supabase.from("on_demand_queue")
        .update({ status: "waiting", payment_id: payment.id })
        .eq("id", queueId)
        .eq("status", "pending_payment");
      console.info(`[Asaas Webhook] Queue entry ${queueId} activated after payment`);

      // Notify patient
      const { data: queueEntry } = await supabase
        .from("on_demand_queue")
        .select("patient_id")
        .eq("id", queueId)
        .single();

      if (queueEntry?.patient_id) {
        await supabase.from("notifications").insert({
          user_id: queueEntry.patient_id,
          title: "✅ Pagamento confirmado!",
          message: "Você entrou na fila do Plantão 24h. Aguarde ser atendido.",
          type: "payment",
          link: "/dashboard/urgent-care",
        });
      }
    }

    // ─── Handle renewal payment events ───
    const isRenewal = externalRef.startsWith("renewal_");
    if (isRenewal && newPaymentStatus === "approved") {
      const renewalId = externalRef.replace("renewal_", "");
      await supabase.from("prescription_renewals")
        .update({ paid_at: new Date().toISOString(), status: "pending_review", payment_id: payment.id })
        .eq("id", renewalId);
      console.info(`[Asaas Webhook] Renewal ${renewalId} payment confirmed`);

      // Notify patient about renewal payment
      const { data: renewal } = await supabase
        .from("prescription_renewals")
        .select("patient_id")
        .eq("id", renewalId)
        .single();

      if (renewal?.patient_id) {
        await supabase.from("notifications").insert({
          user_id: renewal.patient_id,
          title: "✅ Pagamento da renovação confirmado",
          message: "Sua solicitação de renovação de receita será analisada por um médico em breve.",
          type: "prescription",
          link: "/dashboard/renewals",
        });
      }
    }

    // ─── Handle appointment payment events (existing logic) ───
    const appointmentId = !isCardSubscription && !isRenewal && !isQueuePayment ? externalRef : null;

    if (!newPaymentStatus) {
      console.info(`[Asaas Webhook] Unhandled event: ${event}`);
      return new Response(JSON.stringify({ received: true, message: "Event not mapped" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (appointmentId) {
      const updateData: Record<string, any> = {
        payment_status: newPaymentStatus,
      };

      if (newPaymentStatus === "approved") {
        updateData.payment_confirmed_at = new Date().toISOString();
        updateData.status = "confirmed";
      }

      if (["refunded", "chargeback", "cancelled"].includes(newPaymentStatus)) {
        updateData.status = "cancelled";
        updateData.cancel_reason = `Pagamento ${newPaymentStatus === "refunded" ? "reembolsado" : newPaymentStatus === "chargeback" ? "contestado (chargeback)" : "cancelado"} via Asaas`;
      }

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
        console.info(`[Asaas Webhook] Appointment ${appointmentId} → payment_status: ${newPaymentStatus}`);

        if (newPaymentStatus === "approved" && appointment) {
          const scheduledDate = new Date(appointment.scheduled_at).toLocaleString("pt-BR", {
            timeZone: "America/Sao_Paulo", day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit",
          });

          if (appointment.patient_id) {
            await supabase.from("notifications").insert({
              user_id: appointment.patient_id,
              title: "✅ Pagamento Confirmado!",
              message: `Seu pagamento foi aprovado. Consulta agendada para ${scheduledDate}.`,
              type: "payment", link: "/dashboard/appointments",
            });
          }

          const { data: doctorProfile } = await supabase
            .from("doctor_profiles").select("user_id").eq("id", appointment.doctor_id).single();

          if (doctorProfile?.user_id) {
            await supabase.from("notifications").insert({
              user_id: doctorProfile.user_id,
              title: "💰 Novo Pagamento Confirmado",
              message: `Pagamento confirmado para consulta em ${scheduledDate}.`,
              type: "payment", link: "/dashboard/appointments",
            });
          }

          // WhatsApp notification
          try {
            let patientPhone: string | null = null;
            let patientName = "";
            if (appointment.patient_id) {
              const { data: profile } = await supabase.from("profiles").select("phone, first_name").eq("user_id", appointment.patient_id).single();
              patientPhone = profile?.phone || null;
              patientName = profile?.first_name || "";
            } else if (appointment.guest_patient_id) {
              const { data: guest } = await supabase.from("guest_patients").select("phone, full_name").eq("id", appointment.guest_patient_id).single();
              patientPhone = guest?.phone || null;
              patientName = guest?.full_name?.split(" ")[0] || "";
            }
            if (patientPhone) {
              const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
              const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
              const whatsappMsg = `✅ *Pagamento Confirmado!*\n\nOlá, ${patientName}!\nSeu pagamento foi aprovado.\n\n📅 Consulta: ${scheduledDate}\n\n_Alô Médico_`;
              await fetch(`${SUPABASE_URL}/functions/v1/send-whatsapp`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
                body: JSON.stringify({ phone: patientPhone, message: whatsappMsg }),
              });
            }
          } catch (whatsErr) {
            console.warn("WhatsApp notification failed (non-blocking):", whatsErr);
          }

          // Email notification for all patients (registered + guests)
          try {
            const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
            const SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
            
            let recipientEmail = "";
            let recipientName = "";
            
            if (appointment.patient_id) {
              const { data: authUser } = await supabase.auth.admin.getUserById(appointment.patient_id);
              recipientEmail = authUser?.user?.email ?? "";
              const { data: prof } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", appointment.patient_id).single();
              recipientName = prof ? `${prof.first_name} ${prof.last_name}` : "Paciente";
            } else if (appointment.guest_patient_id) {
              const { data: guest } = await supabase.from("guest_patients").select("email, full_name").eq("id", appointment.guest_patient_id).single();
              recipientEmail = guest?.email ?? "";
              recipientName = guest?.full_name ?? "Paciente";
            }

            if (recipientEmail) {
              // Get doctor name
              const { data: docProf } = await supabase.from("doctor_profiles").select("user_id").eq("id", appointment.doctor_id).single();
              let drName = "Médico";
              if (docProf) {
                const { data: dp } = await supabase.from("profiles").select("first_name, last_name").eq("user_id", docProf.user_id).single();
                if (dp) drName = `Dr(a). ${dp.first_name} ${dp.last_name}`;
              }
              const schedDate = new Date(appointment.scheduled_at);
              
              await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
                method: "POST",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${SERVICE_KEY}` },
                body: JSON.stringify({
                  type: "payment_confirmed",
                  to: recipientEmail,
                  data: {
                    patient_name: recipientName,
                    doctor_name: drName,
                    date: schedDate.toLocaleDateString("pt-BR", { timeZone: "America/Sao_Paulo" }),
                    time: schedDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" }),
                    amount: payment.value?.toFixed(2) || "",
                  },
                }),
              });
            }
          } catch (emailErr) {
            console.warn("Payment confirmation email failed (non-blocking):", emailErr);
          }
        }

        // Refund notifications
        if (["refunded", "partially_refunded"].includes(newPaymentStatus) && appointment?.patient_id) {
          await supabase.from("notifications").insert({
            user_id: appointment.patient_id,
            title: "💸 Reembolso Processado",
            message: newPaymentStatus === "refunded"
              ? `Seu pagamento de R$ ${payment.value?.toFixed(2)} foi reembolsado.`
              : `Um reembolso parcial foi processado.`,
            type: "payment", link: "/dashboard/appointments",
          });
        }

        // Refusal notifications
        if (newPaymentStatus === "refused" && appointment?.patient_id) {
          await supabase.from("notifications").insert({
            user_id: appointment.patient_id,
            title: "❌ Pagamento Recusado",
            message: "Seu pagamento não foi aprovado. Tente novamente.",
            type: "payment", link: "/dashboard/appointments",
          });
        }
      }
    }

    // ─── Activity log ───
    await supabase.from("activity_logs").insert({
      action: `asaas_${event.toLowerCase()}`,
      entity_type: "payment",
      entity_id: payment.id,
      details: {
        external_reference: externalRef,
        billing_type: payment.billingType,
        value: payment.value,
        net_value: payment.netValue,
        payment_status: newPaymentStatus,
        asaas_status: payment.status,
        customer_id: payment.customer,
        due_date: payment.dueDate,
        subscription_id: payment.subscription || null,
      },
    });

    return new Response(JSON.stringify({ received: true, status: newPaymentStatus }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Unknown error";
    console.error("[Asaas Webhook] Fatal error:", error);
    return new Response(JSON.stringify({ received: true, error: msg }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
