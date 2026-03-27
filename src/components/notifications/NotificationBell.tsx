import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bell, CheckCircle, Trash } from "@phosphor-icons/react";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import PushNotificationToggle from "./PushNotificationToggle";

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  is_read: boolean;
  link: string | null;
  created_at: string;
}

const NOTIFICATION_SOUND_URL = "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbsGczDjFjqufk0YhQMi5Xp+Xm0IROMy1Vp+bl0IJPMy5XqObl0YFPMy5Yqefl0YFPNC9ZquijAAA=";

const playNotificationSound = () => {
  try {
    const audio = new Audio(NOTIFICATION_SOUND_URL);
    audio.volume = 0.3;
    audio.play().catch(() => {});
  } catch {}
};

const NotificationBell = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [hasNewPulse, setHasNewPulse] = useState(false);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const pulseTimeout = useRef<NodeJS.Timeout>();

  const unreadCount = notifications.filter(n => !n.is_read).length + unreadMessages;

  const showRealtimeToast = useCallback((notif: Notification) => {
    const typeIcons: Record<string, string> = {
      appointment: "📅", reminder: "⏰", message: "💬", system: "🔔", info: "ℹ️",
    };
    const icon = typeIcons[notif.type] ?? "🔔";

    playNotificationSound();

    // Pulse animation on badge
    setHasNewPulse(true);
    if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
    pulseTimeout.current = setTimeout(() => setHasNewPulse(false), 3000);

    toast(notif.title, {
      description: notif.message,
      icon,
      action: notif.link
        ? { label: "Ver", onClick: () => navigate(notif.link!) }
        : undefined,
      duration: 6000,
    });
  }, [navigate]);

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    fetchUnreadMessages();

    // Realtime subscription for notifications
    const channel = supabase
      .channel("notifications-realtime")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "notifications", filter: `user_id=eq.${user.id}` },
        (payload) => {
          const newNotif = payload.new as Notification;
          setNotifications(prev => [newNotif, ...prev]);
          showRealtimeToast(newNotif);
        }
      )
      .subscribe();

    // Realtime subscription for unread messages (issue #12 rodada 3)
    const msgChannel = supabase
      .channel("unread-messages-count")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        () => fetchUnreadMessages()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(msgChannel);
      if (pulseTimeout.current) clearTimeout(pulseTimeout.current);
    };
  }, [user, showRealtimeToast]);

  const fetchUnreadMessages = async () => {
    if (!user) return;
    const { count } = await supabase
      .from("messages")
      .select("id", { count: "exact", head: true })
      .eq("is_read", false)
      .neq("sender_id", user.id);
    setUnreadMessages(count ?? 0);
  };

  const fetchNotifications = async () => {
    const { data } = await supabase
      .from("notifications")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false })
      .limit(30);
    setNotifications((data as Notification[]) ?? []);
  };

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    const { error } = await supabase.from("notifications").update({ is_read: true }).eq("id", id);
    if (error) {
      // Rollback
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: false } : n));
    }
  };

  const markAllRead = async () => {
    const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
    if (unreadIds.length === 0) return;
    // Optimistic update
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    const { error } = await supabase.from("notifications").update({ is_read: true }).in("id", unreadIds);
    if (error) {
      // Rollback
      fetchNotifications();
    }
  };

  const deleteNotification = async (id: string) => {
    // Optimistic update
    const prev = notifications;
    setNotifications(p => p.filter(n => n.id !== id));
    const { error } = await supabase.from("notifications").delete().eq("id", id);
    if (error) {
      setNotifications(prev);
      toast.error("Erro ao excluir notificação");
    }
  };

  const handleClick = (n: Notification) => {
    if (!n.is_read) markAsRead(n.id);
    if (n.link) { navigate(n.link); setOpen(false); }
  };

  const typeIcons: Record<string, string> = {
    appointment: "📅", reminder: "⏰", message: "💬", system: "🔔", info: "ℹ️",
    waitlist: "🔔", approval: "✅", consultation: "🩺", document: "📄", certificate: "📋",
  };

  if (!user) return null;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Notificações" className="relative h-9 w-9 rounded-xl overflow-visible">
          <Bell size={18} weight={unreadCount > 0 ? "fill" : "regular"} />
          <AnimatePresence>
            {unreadCount > 0 && (
              <motion.span
                key="badge"
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: hasNewPulse ? [1, 1.3, 1] : 1,
                  opacity: 1,
                }}
                exit={{ scale: 0, opacity: 0 }}
                transition={hasNewPulse
                  ? { scale: { duration: 0.5, repeat: 2, ease: "easeInOut" } }
                  : { duration: 0.2 }
                }
                className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold shadow-md ring-2 ring-background tabular-nums"
              >
                {unreadCount > 99 ? "99+" : unreadCount}
              </motion.span>
            )}
          </AnimatePresence>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-[340px] p-0 rounded-2xl border-border/50 shadow-elevated overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-card border-b border-border/30">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm text-foreground">Notificações</h3>
            {unreadCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">
                {unreadCount} nova{unreadCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs h-7 rounded-lg text-primary hover:text-primary hover:bg-primary/10">
              <CheckCircle size={12} weight="fill" className="mr-1" /> Ler todas
            </Button>
          )}
        </div>

        <ScrollArea className="max-h-[360px]">
          {notifications.length === 0 ? (
            <div className="py-12 text-center">
              <Bell size={28} weight="light" className="mx-auto mb-2 text-muted-foreground/30" />
              <p className="text-sm text-muted-foreground">Nenhuma notificação</p>
              <p className="text-[11px] text-muted-foreground/60 mt-0.5">Você será notificado sobre consultas e atualizações</p>
            </div>
          ) : (
            <div className="divide-y divide-border/30">
              {notifications.map(n => (
                <motion.div
                  key={n.id}
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors duration-200 group ${
                    !n.is_read ? "bg-primary/[0.03] hover:bg-primary/[0.06]" : "hover:bg-muted/40"
                  }`}
                  onClick={() => handleClick(n)}
                >
                  <span className="text-base mt-0.5 shrink-0">{typeIcons[n.type] ?? "🔔"}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start gap-1.5">
                      <p className={`text-sm leading-tight ${!n.is_read ? "font-semibold text-foreground" : "text-foreground/80"}`}>
                        {n.title}
                      </p>
                      {!n.is_read && (
                        <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5 leading-relaxed">{n.message}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      {formatDistanceToNow(new Date(n.created_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                  <Button
                    variant="ghost" size="icon"
                    className="h-7 w-7 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg"
                    aria-label="Excluir notificação"
                    onClick={(e) => { e.stopPropagation(); deleteNotification(n.id); }}
                  >
                    <Trash size={12} className="text-muted-foreground" />
                  </Button>
                </motion.div>
              ))}
            </div>
          )}
        </ScrollArea>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-border/30 bg-card/50 flex items-center justify-between">
          <PushNotificationToggle />
          {notifications.length > 0 && (
            <span className="text-[10px] text-muted-foreground">{notifications.length} notificação{notifications.length !== 1 ? "ões" : ""}</span>
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;
