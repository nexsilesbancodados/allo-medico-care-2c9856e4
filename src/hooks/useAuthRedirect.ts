import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

/**
 * Centralized post-login redirect logic.
 * After signInWithPassword succeeds, call redirectAfterLogin(user) 
 * to handle role-based routing.
 */
export function useAuthRedirect() {
  const navigate = useNavigate();

  const redirectAfterLogin = async (userId: string) => {
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const roleList = roles?.map((r: any) => r.role) ?? [];
    const isPatient = roleList.includes("patient");
    const isOtherRole = roleList.some((r: string) =>
      ["doctor", "admin", "clinic", "receptionist", "support", "partner", "affiliate"].includes(r)
    );

    if (isPatient && !isOtherRole) {
      const now = new Date().toISOString();
      // Check for active subscription or discount card with valid expiry (issue #19)
      const [subsRes, cardsRes] = await Promise.all([
        supabase.from("subscriptions").select("id, expires_at").eq("user_id", userId).eq("status", "active").limit(1),
        supabase.from("discount_cards").select("id, valid_until").eq("user_id", userId).eq("status", "active").limit(1),
      ]);

      // Filter out expired ones that haven't been updated by cron yet
      const validSubs = (subsRes.data ?? []).filter(s => !s.expires_at || s.expires_at > now);
      const validCards = (cardsRes.data ?? []).filter(c => !c.valid_until || c.valid_until > now);
      const hasPlan = validSubs.length > 0 || validCards.length > 0;

      if (!hasPlan) {
        toast.warning("Você ainda não tem um plano ativo. Escolha um plano para acessar.");
        navigate("/paciente?reason=no-subscription");
        return;
      }
    }

    navigate("/dashboard");
  };

  return { redirectAfterLogin };
}
