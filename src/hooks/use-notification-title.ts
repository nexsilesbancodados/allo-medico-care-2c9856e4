import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const SITE_TITLE = "AloClinica";

/**
 * Updates the document title with unread notification count.
 * e.g. "(3) AloClinica" when there are 3 unread notifications.
 * Place inside AuthProvider.
 */
const useNotificationTitle = () => {
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    let mounted = true;

    const updateTitle = async () => {
      const { count } = await supabase
        .from("notifications")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("is_read", false);

      if (!mounted) return;

      const base = document.title.replace(/^\(\d+\)\s*/, "");
      document.title = count && count > 0 ? `(${count}) ${base}` : base;
    };

    updateTitle();

    // Listen for changes
    const channel = supabase
      .channel("title-badge")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        () => updateTitle()
      )
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, [user]);
};

export default useNotificationTitle;
