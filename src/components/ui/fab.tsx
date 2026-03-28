import { ReactNode } from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface FABProps {
  icon: ReactNode;
  label: string;
  onClick: () => void;
  variant?: "primary" | "success" | "danger";
  position?: "bottom-right" | "bottom-center";
  className?: string;
}

const variantStyles = {
  primary: "bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30",
  success: "bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-lg shadow-emerald-500/25 hover:shadow-xl hover:shadow-emerald-500/30",
  danger: "bg-gradient-to-br from-red-600 to-red-500 text-white shadow-lg shadow-red-500/25 hover:shadow-xl hover:shadow-red-500/30",
};

const positionStyles = {
  "bottom-right": "fixed bottom-6 right-6 md:bottom-8 md:right-8",
  "bottom-center": "fixed bottom-6 left-1/2 -translate-x-1/2",
};

const FAB = ({ icon, label, onClick, variant = "primary", position = "bottom-right", className }: FABProps) => (
  <TooltipProvider delayDuration={200}>
    <Tooltip>
      <TooltipTrigger asChild>
        <motion.button
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0, opacity: 0 }}
          whileHover={{ scale: 1.08 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: "spring", stiffness: 400, damping: 20 }}
          onClick={onClick}
          aria-label={label}
          className={cn(
            "z-50 w-14 h-14 rounded-full flex items-center justify-center transition-all duration-200",
            variantStyles[variant],
            positionStyles[position],
            variant === "danger" && "animate-pulse",
            className
          )}
        >
          <span className="[&>svg]:w-6 [&>svg]:h-6">{icon}</span>
        </motion.button>
      </TooltipTrigger>
      <TooltipContent side="left" className="rounded-lg text-xs font-medium">
        {label}
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export { FAB };
export type { FABProps };
