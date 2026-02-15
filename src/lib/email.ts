import { supabase } from "@/integrations/supabase/client";

interface SendEmailParams {
  type: "appointment_confirmation" | "appointment_reminder" | "prescription_sent" | "welcome";
  to: string;
  data: Record<string, string>;
}

export const sendEmail = async (params: SendEmailParams) => {
  try {
    const { data, error } = await supabase.functions.invoke("send-email", {
      body: params,
    });
    if (error) {
      console.error("Email send error:", error);
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    console.error("Email send exception:", err);
    return { success: false, error: err };
  }
};
