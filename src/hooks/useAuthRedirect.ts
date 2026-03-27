import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { getSubdomainRole } from "./use-subdomain-redirect";

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
      ["doctor", "admin", "clinic", "receptionist", "support", "partner"].includes(r)
    );

    const subRole = getSubdomainRole();
    if (subRole) {
      navigate(`/dashboard?role=${subRole}`);
    } else {
      navigate("/dashboard");
    }
  };

  return { redirectAfterLogin };
}
