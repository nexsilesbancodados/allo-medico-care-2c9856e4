import { supabase } from "@/integrations/supabase/client";
import { logError } from "@/lib/logger";

export const registerConsent = async (
  userId: string,
  consentType = "terms_and_privacy",
  version = "1.0",
) => {
  try {
    await supabase.from("user_consents").insert({
      user_id: userId,
      consent_type: consentType,
      version,
      user_agent: navigator.userAgent,
    } as any);
  } catch (err) {
    logError("Failed to register consent", err, { userId, consentType, version });
  }
};
