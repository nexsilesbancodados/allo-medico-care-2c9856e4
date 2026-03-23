import { motion } from "framer-motion";
import { AlertTriangle } from "lucide-react";
import { ReactNode } from "react";
import { Button } from "@/components/ui/button";

interface AlertBoxProps {
  icon?: ReactNode;
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  variant?: "danger" | "warning" | "info";
}

const variantMap = {
  danger: { wrapper: "border-red-200 bg-red-50 dark:border-red-800/40 dark:bg-red-950/20", title: "text-red-700 dark:text-red-400", sub: "text-red-500 dark:text-red-500", btn: "bg-red-600 hover:bg-red-700 text-white" },
  warning: { wrapper: "border-amber-200 bg-amber-50 dark:border-amber-800/40 dark:bg-amber-950/20", title: "text-amber-700 dark:text-amber-400", sub: "text-amber-500 dark:text-amber-500", btn: "bg-amber-600 hover:bg-amber-700 text-white" },
  info: { wrapper: "border-blue-200 bg-blue-50 dark:border-blue-800/40 dark:bg-blue-950/20", title: "text-blue-700 dark:text-blue-400", sub: "text-blue-500 dark:text-blue-500", btn: "bg-blue-600 hover:bg-blue-700 text-white" },
};

export function AlertBox({ icon, title, subtitle, actionLabel, onAction, variant = "danger" }: AlertBoxProps) {
  const v = variantMap[variant];
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 rounded-2xl border p-3.5 ${v.wrapper}`}
    >
      <div className="shrink-0 text-[20px]">
        {icon ?? <AlertTriangle className="h-5 w-5 text-red-500" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`text-[12px] font-bold ${v.title}`}>{title}</p>
        {subtitle && <p className={`mt-0.5 text-[10.5px] ${v.sub}`}>{subtitle}</p>}
      </div>
      {actionLabel && onAction && (
        <Button size="sm" onClick={onAction} className={`h-8 shrink-0 rounded-xl px-3 text-[10.5px] font-bold ${v.btn}`}>
          {actionLabel}
        </Button>
      )}
    </motion.div>
  );
}
