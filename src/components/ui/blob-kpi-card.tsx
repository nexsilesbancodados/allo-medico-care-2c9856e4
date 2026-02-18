import { ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Card KPI com forma orgânica blob e efeito glassmorphism.
 * Inspirado no estilo watercolor/frosted glass da referência.
 */

export type BlobColor = "primary" | "secondary" | "success" | "warning" | "destructive" | "accent";

interface BlobKPICardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: BlobColor;
  delay?: number;
  onClick?: () => void;
  /** Índice 0-4 para variar o formato do blob */
  variant?: 0 | 1 | 2 | 3 | 4;
}

// 5 formas orgânicas distintas usando border-radius composto
const BLOB_SHAPES = [
  "63% 37% 54% 46% / 55% 48% 52% 45%",
  "40% 60% 70% 30% / 40% 50% 60% 50%",
  "54% 46% 38% 62% / 49% 70% 30% 51%",
  "70% 30% 46% 54% / 30% 52% 48% 70%",
  "45% 55% 65% 35% / 58% 40% 60% 42%",
];

// Mapeamento de cores para variáveis CSS semânticas
const COLOR_MAP: Record<BlobColor, { bg: string; glow: string; icon: string }> = {
  primary:     { bg: "hsla(var(--primary) / 0.25)",     glow: "hsla(var(--primary) / 0.15)",     icon: "hsl(var(--primary))" },
  secondary:   { bg: "hsla(var(--secondary) / 0.28)",   glow: "hsla(var(--secondary) / 0.12)",   icon: "hsl(var(--secondary))" },
  success:     { bg: "hsla(var(--success) / 0.25)",     glow: "hsla(var(--success) / 0.12)",     icon: "hsl(var(--success))" },
  warning:     { bg: "hsla(var(--warning) / 0.28)",     glow: "hsla(var(--warning) / 0.12)",     icon: "hsl(var(--warning))" },
  destructive: { bg: "hsla(var(--destructive) / 0.22)", glow: "hsla(var(--destructive) / 0.10)", icon: "hsl(var(--destructive))" },
  accent:      { bg: "hsla(var(--accent) / 0.30)",      glow: "hsla(var(--accent) / 0.15)",      icon: "hsl(var(--accent-foreground))" },
};

const BlobKPICard = ({
  label, value, icon, color = "primary", delay = 0, onClick, variant = 0,
}: BlobKPICardProps) => {
  const shape = BLOB_SHAPES[variant % BLOB_SHAPES.length];
  const colors = COLOR_MAP[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.7, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.08, y: -6 }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center justify-center cursor-pointer select-none"
      onClick={onClick}
    >
      {/* Blob shape */}
      <div
        className="relative flex flex-col items-center justify-center w-full aspect-square backdrop-blur-sm"
        style={{
          borderRadius: shape,
          background: `radial-gradient(ellipse at 40% 35%, ${colors.glow} 0%, ${colors.bg} 100%)`,
          boxShadow: `0 8px 32px ${colors.glow}, 0 2px 8px rgba(0,0,0,0.06)`,
          border: `1.5px solid ${colors.bg}`,
          minWidth: 80,
          maxWidth: 160,
        }}
      >
        {/* Specular highlight */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            borderRadius: shape,
            background: "radial-gradient(ellipse at 30% 20%, rgba(255,255,255,0.35) 0%, transparent 60%)",
          }}
        />

        {/* Icon */}
        <div className="mb-1" style={{ color: colors.icon, opacity: 0.85, fontSize: "1.3rem" }}>
          {icon}
        </div>

        {/* Value */}
        <span
          className="font-extrabold leading-none text-foreground"
          style={{ fontSize: "clamp(1.1rem, 4vw, 1.6rem)" }}
        >
          {value}
        </span>

        {/* Label */}
        <span
          className="text-center font-medium leading-tight text-foreground/70 px-2"
          style={{ fontSize: "clamp(0.58rem, 1.8vw, 0.7rem)", marginTop: 2 }}
        >
          {label}
        </span>
      </div>
    </motion.div>
  );
};

export default BlobKPICard;
