import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

const EmptyState = ({ icon: Icon, title, description, actionLabel, onAction, className = "" }: EmptyStateProps) => (
  <div className={`text-center py-12 ${className}`}>
    <motion.div
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 200, damping: 15 }}
      className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-primary/10 to-secondary/10 flex items-center justify-center mb-4 shadow-lg shadow-primary/5"
    >
      <Icon className="w-8 h-8 text-primary" />
    </motion.div>
    <motion.p
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="text-sm font-semibold text-foreground mb-1"
    >
      {title}
    </motion.p>
    {description && (
      <motion.p
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="text-xs text-muted-foreground mb-5 max-w-xs mx-auto"
      >
        {description}
      </motion.p>
    )}
    {actionLabel && onAction && (
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
        <Button size="sm" variant="outline" className="rounded-xl" onClick={onAction}>
          {actionLabel}
        </Button>
      </motion.div>
    )}
  </div>
);

export default EmptyState;
