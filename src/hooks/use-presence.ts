import { useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useLocation } from "react-router-dom";

/**
 * Tracks user presence in the app.
 * Upserts user_presence every 30 seconds with current page.
 * Sets is_online=false on unmount.
 */
export const usePresence = () => {
  const { user } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!user) return;

    const upsert = async () => {
      await supabase.from("user_presence").upsert(
        {
          user_id: user.id,
          last_seen_at: new Date().toISOString(),
          current_page: location.pathname,
          is_online: true,
        } as any,
        { onConflict: "user_id" }
      );
    };

    upsert();
    const interval = setInterval(upsert, 30000);

    const setOffline = async () => {
      await supabase.from("user_presence").upsert(
        { user_id: user.id, is_online: false, last_seen_at: new Date().toISOString() } as any,
        { onConflict: "user_id" }
      );
    };

    window.addEventListener("beforeunload", setOffline);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", setOffline);
      setOffline();
    };
  }, [user, location.pathname]);
};
