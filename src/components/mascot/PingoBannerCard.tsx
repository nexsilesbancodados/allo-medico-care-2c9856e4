/**
 * PingoBannerCard — Banner com imagem real do Pingo (igual ao header do site)
 * Usa drop-shadow para simular 3D, mesmo padrão do ListItem do Header.tsx
 */
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface PingoBannerCardProps {
  /** Imported image asset (same pattern as Header.tsx ListItem) */
  pingImg: string;
  pingAlt?: string;
  pingSize?: number;
  bgClass?: string;
  borderClass?: string;
  label?: string;
  labelColor?: string;
  title: string;
  titleColor?: string;
  subtitle?: string;
  ctaLabel?: string;
  ctaBg?: string;
  onCta?: () => void;
  className?: string;
  animate?: boolean;
  children?: ReactNode;
}

export function PingoBannerCard({
  pingImg, pingAlt = "Pingo", pingSize = 88,
  bgClass = "bg-blue-50 dark:bg-blue-950/30",
  borderClass = "border-blue-100 dark:border-blue-900/30",
  label, labelColor = "text-blue-600 dark:text-blue-400",
  title, titleColor = "text-foreground",
  subtitle, ctaLabel, ctaBg = "bg-[#2563EB] hover:bg-[#1D4ED8]",
  onCta, className, animate = true, children,
}: PingoBannerCardProps) {
  return (
    <div className={cn(
      "relative flex items-center gap-3 overflow-hidden rounded-2xl border p-3.5",
      bgClass, borderClass, className
    )}>
      {/* Top shine */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/60 to-transparent" />

      {/* Pingo image — same rendering as Header ListItem */}
      <motion.div
        className="flex shrink-0 items-end justify-center"
        style={{ width: pingSize, height: pingSize }}
        animate={animate ? { y: [0, -7, 0] } : undefined}
        transition={animate ? { duration: 3.2, repeat: Infinity, ease: "easeInOut" } : undefined}
        initial={animate ? { opacity: 0, scale: 0.8 } : undefined}
        whileInView={animate ? { opacity: 1, scale: 1 } : undefined}
        viewport={{ once: true }}
      >
        <img
          src={pingImg}
          alt={pingAlt}
          className="w-full h-full object-contain select-none"
          style={{ filter: "drop-shadow(0 6px 14px rgba(0,0,0,.18))" }}
        />
      </motion.div>

      {/* Content */}
      <div className="min-w-0 flex-1">
        {label && (
          <p className={cn("mb-0.5 text-[9.5px] font-bold uppercase tracking-[0.12em]", labelColor)}>{label}</p>
        )}
        <p className={cn("text-[13.5px] font-extrabold leading-tight tracking-tight", titleColor)}>{title}</p>
        {subtitle && <p className="mt-0.5 text-[11px] leading-snug text-muted-foreground">{subtitle}</p>}
        {children}
        {ctaLabel && onCta && (
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={onCta}
            className={cn(
              "mt-2.5 inline-flex items-center gap-1 rounded-xl px-3.5 py-1.5",
              "text-[10.5px] font-bold text-white transition-all active:scale-95",
              "shadow-[0_3px_10px_rgba(37,99,235,.3)]",
              ctaBg
            )}
          >
            {ctaLabel} →
          </motion.button>
        )}
      </div>
    </div>
  );
}
