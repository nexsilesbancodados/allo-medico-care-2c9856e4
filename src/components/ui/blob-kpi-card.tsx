import { ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Card KPI com forma orgânica blob — estilo aquarela vibrante.
 * Ícone + valor + label em branco sobre blob colorido.
 */

export type BlobColor = "primary" | "secondary" | "success" | "warning" | "destructive" | "accent" | "purple" | "teal";

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
  "60% 40% 54% 46% / 48% 55% 45% 52%",
  "42% 58% 65% 35% / 45% 52% 48% 55%",
  "55% 45% 40% 60% / 52% 45% 55% 48%",
  "68% 32% 48% 52% / 38% 58% 42% 62%",
  "48% 52% 62% 38% / 55% 42% 58% 45%",
];

// Paleta aquarela vibrante — cores sólidas com variação de luz para efeito paint
const COLOR_MAP: Record<BlobColor, { from: string; to: string; shadow: string; shimmer: string }> = {
  primary:     {
    from:    "hsl(210 85% 58%)",
    to:      "hsl(220 75% 48%)",
    shadow:  "hsl(210 85% 50% / 0.45)",
    shimmer: "hsl(210 100% 80% / 0.30)",
  },
  secondary:   {
    from:    "hsl(160 55% 52%)",
    to:      "hsl(170 60% 40%)",
    shadow:  "hsl(160 55% 45% / 0.45)",
    shimmer: "hsl(160 80% 80% / 0.30)",
  },
  success:     {
    from:    "hsl(145 65% 50%)",
    to:      "hsl(155 70% 38%)",
    shadow:  "hsl(145 65% 42% / 0.45)",
    shimmer: "hsl(145 80% 80% / 0.30)",
  },
  warning:     {
    from:    "hsl(35 90% 58%)",
    to:      "hsl(25 85% 48%)",
    shadow:  "hsl(35 90% 50% / 0.45)",
    shimmer: "hsl(40 100% 80% / 0.30)",
  },
  destructive: {
    from:    "hsl(0 80% 62%)",
    to:      "hsl(10 75% 50%)",
    shadow:  "hsl(0 80% 55% / 0.45)",
    shimmer: "hsl(0 100% 80% / 0.30)",
  },
  accent:      {
    from:    "hsl(280 65% 65%)",
    to:      "hsl(265 60% 52%)",
    shadow:  "hsl(280 65% 55% / 0.45)",
    shimmer: "hsl(280 80% 85% / 0.30)",
  },
  purple:      {
    from:    "hsl(270 70% 65%)",
    to:      "hsl(255 65% 52%)",
    shadow:  "hsl(270 70% 55% / 0.45)",
    shimmer: "hsl(270 80% 85% / 0.30)",
  },
  teal:        {
    from:    "hsl(185 65% 52%)",
    to:      "hsl(195 70% 40%)",
    shadow:  "hsl(185 65% 44% / 0.45)",
    shimmer: "hsl(185 80% 80% / 0.30)",
  },
};

const BlobKPICard = ({
  label, value, icon, color = "primary", delay = 0, onClick, variant = 0,
}: BlobKPICardProps) => {
  const shape = BLOB_SHAPES[variant % BLOB_SHAPES.length];
  const c = COLOR_MAP[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.75, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.09, y: -6, transition: { duration: 0.25 } }}
      whileTap={{ scale: 0.95 }}
      className="flex flex-col items-center justify-center cursor-pointer select-none"
      onClick={onClick}
    >
      {/* Blob shape */}
      <div
        className="relative flex flex-col items-center justify-center w-full aspect-square"
        style={{
          borderRadius: shape,
          background: `
            radial-gradient(ellipse at 35% 28%, ${c.shimmer} 0%, transparent 55%),
            radial-gradient(ellipse at 70% 75%, rgba(0,0,0,0.08) 0%, transparent 50%),
            linear-gradient(145deg, ${c.from} 0%, ${c.to} 100%)
          `,
          boxShadow: `0 12px 40px -8px ${c.shadow}, 0 4px 12px rgba(0,0,0,0.10)`,
          minWidth: 90,
          maxWidth: 170,
        }}
      >
        {/* Highlight specular superior */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "12%",
            left: "18%",
            width: "45%",
            height: "28%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.38) 0%, transparent 70%)",
            filter: "blur(4px)",
          }}
        />

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-1 px-3">
          {/* Ícone */}
          <div style={{ color: "rgba(255,255,255,0.92)", fontSize: "1.4rem", lineHeight: 1 }}>
            {icon}
          </div>

          {/* Valor */}
          <span
            className="font-extrabold leading-none"
            style={{
              color: "#ffffff",
              fontSize: "clamp(1.15rem, 4.5vw, 1.75rem)",
              textShadow: "0 1px 6px rgba(0,0,0,0.18)",
            }}
          >
            {value}
          </span>

          {/* Label */}
          <span
            className="text-center font-semibold leading-tight px-1"
            style={{
              color: "rgba(255,255,255,0.88)",
              fontSize: "clamp(0.58rem, 1.8vw, 0.7rem)",
              textShadow: "0 1px 4px rgba(0,0,0,0.15)",
              marginTop: 1,
            }}
          >
            {label}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default BlobKPICard;
