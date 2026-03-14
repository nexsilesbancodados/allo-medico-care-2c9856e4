import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/logger";

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
      logError("Email send error", error, { type: params.type });
      return { success: false, error };
    }
    return { success: true, data };
  } catch (err) {
    logError("Email send exception", err, { type: params.type });
    return { success: false, error: err };
  }
};
