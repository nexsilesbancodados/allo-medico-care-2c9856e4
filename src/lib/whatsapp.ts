import { supabase } from "@/integrations/supabase/client";

export const sendWhatsApp = async (phone: string, message: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("send-whatsapp", {
      body: { phone, message },
    });
    if (error) {
      console.error("WhatsApp send error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("WhatsApp send exception:", err);
    return { success: false, error: err };
  }
};

export const triggerAppointmentConfirmed = async (appointmentId: string) => {
  try {
    const { data, error } = await supabase.functions.invoke("appointment-confirmed", {
      body: { appointment_id: appointmentId },
    });
    if (error) {
      console.error("Appointment confirmed trigger error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Appointment confirmed exception:", err);
    return { success: false, error: err };
  }
};
