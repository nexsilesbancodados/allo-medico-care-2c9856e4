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
      // Check for active subscription or discount card
      const [subsRes, cardsRes] = await Promise.all([
        supabase.from("subscriptions").select("id").eq("user_id", userId).eq("status", "active").limit(1),
        supabase.from("discount_cards").select("id").eq("user_id", userId).eq("status", "active").limit(1),
      ]);

      const hasPlan = (subsRes.data?.length ?? 0) > 0 || (cardsRes.data?.length ?? 0) > 0;

      if (!hasPlan) {
        // Do NOT sign out — keep user logged in and redirect to plan selection
        toast.warning("Você ainda não tem um plano ativo. Escolha um plano para acessar.");
        navigate("/paciente?reason=no-subscription");
        return;
      }
    }

    navigate("/dashboard");
  };

  return { redirectAfterLogin };
}
