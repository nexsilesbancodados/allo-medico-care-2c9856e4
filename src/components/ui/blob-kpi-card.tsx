import { ReactNode } from "react";
import { motion } from "framer-motion";

/**
 * Card KPI estilo aquarela semi-transparente.
 * Referência: blobs coloridos translúcidos com ícone + valor + label brancos.
 */

export type BlobColor =
  | "primary"
  | "secondary"
  | "success"
  | "warning"
  | "destructive"
  | "accent"
  | "purple"
  | "teal";

interface BlobKPICardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color?: BlobColor;
  delay?: number;
  onClick?: () => void;
  variant?: 0 | 1 | 2 | 3 | 4;
}

// Formas orgânicas irregulares (estilo aquarela)
const BLOB_SHAPES = [
  "62% 38% 46% 54% / 60% 44% 56% 40%",
  "44% 56% 68% 32% / 42% 58% 42% 58%",
  "56% 44% 38% 62% / 50% 40% 60% 50%",
  "70% 30% 50% 50% / 36% 60% 40% 64%",
  "46% 54% 60% 40% / 58% 38% 62% 42%",
];

// Paleta aquarela: translúcida, pastel saturado — igual à imagem de referência
const COLOR_MAP: Record<
  BlobColor,
  {
    base: string;      // cor principal (HSL values)
    glow: string;      // sombra colorida
  }
> = {
  primary:     { base: "210 75% 62%",  glow: "210 75% 55%" },
  secondary:   { base: "160 55% 55%",  glow: "160 55% 48%" },
  success:     { base: "148 60% 54%",  glow: "148 60% 46%" },
  warning:     { base: "32 90% 62%",   glow: "32 90% 52%"  },
  destructive: { base: "5 78% 65%",    glow: "5 78% 56%"   },
  accent:      { base: "272 60% 68%",  glow: "272 60% 58%" },
  purple:      { base: "265 65% 68%",  glow: "265 65% 58%" },
  teal:        { base: "183 58% 58%",  glow: "183 58% 48%" },
};

const BlobKPICard = ({
  label,
  value,
  icon,
  color = "primary",
  delay = 0,
  onClick,
  variant = 0,
}: BlobKPICardProps) => {
  const shape = BLOB_SHAPES[variant % BLOB_SHAPES.length];
  const c = COLOR_MAP[color];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.72, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.10, y: -7, transition: { duration: 0.22 } }}
      whileTap={{ scale: 0.94 }}
      className="flex items-center justify-center cursor-pointer select-none"
      onClick={onClick}
      style={{ width: "100%", aspectRatio: "1 / 1", maxWidth: 175, minWidth: 90 }}
    >
      {/* Camada de sombra/glow externa */}
      <div
        className="absolute"
        style={{
          inset: "8%",
          borderRadius: shape,
          background: `hsl(${c.glow} / 0.22)`,
          filter: "blur(18px)",
          transform: "scale(1.08) translateY(6px)",
        }}
      />

      {/* Blob principal — aquarela semi-transparente */}
      <div
        className="relative w-full h-full flex flex-col items-center justify-center"
        style={{
          borderRadius: shape,
          // Camadas de gradiente sobrepostas para efeito aquarela
          background: `
            radial-gradient(ellipse at 32% 28%, hsl(0 0% 100% / 0.45) 0%, transparent 48%),
            radial-gradient(ellipse at 72% 72%, hsl(${c.base} / 0.18) 0%, transparent 55%),
            radial-gradient(ellipse at 20% 80%, hsl(${c.glow} / 0.30) 0%, transparent 45%),
            radial-gradient(ellipse at 60% 40%, hsl(${c.base} / 0.72) 0%, hsl(${c.glow} / 0.58) 100%)
          `,
          boxShadow: `
            0 16px 48px -10px hsl(${c.glow} / 0.38),
            0 4px 16px -4px hsl(${c.glow} / 0.25),
            inset 0 1px 0 hsl(0 0% 100% / 0.40)
          `,
          // Borda interna suave branca para efeito de luz
          border: "1.5px solid hsl(0 0% 100% / 0.30)",
        }}
      >
        {/* Reflexo especular superior — característica do estilo aquarela da ref */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "10%",
            left: "15%",
            width: "50%",
            height: "30%",
            borderRadius: "50%",
            background:
              "radial-gradient(ellipse, rgba(255,255,255,0.50) 0%, rgba(255,255,255,0.10) 60%, transparent 100%)",
            filter: "blur(6px)",
            transform: "rotate(-15deg)",
          }}
        />

        {/* Conteúdo */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 px-3 text-center">
          {/* Ícone */}
          <div
            style={{
              color: "rgba(255,255,255,0.95)",
              fontSize: "clamp(1.1rem, 3.5vw, 1.5rem)",
              lineHeight: 1,
              filter: "drop-shadow(0 1px 3px rgba(0,0,0,0.20))",
            }}
          >
            {icon}
          </div>

          {/* Valor numérico */}
          <span
            style={{
              color: "#ffffff",
              fontWeight: 800,
              fontSize: "clamp(1.2rem, 4.5vw, 1.8rem)",
              lineHeight: 1.05,
              textShadow: "0 2px 8px rgba(0,0,0,0.20)",
              letterSpacing: "-0.02em",
            }}
          >
            {value}
          </span>

          {/* Label */}
          <span
            style={{
              color: "rgba(255,255,255,0.90)",
              fontWeight: 600,
              fontSize: "clamp(0.55rem, 1.7vw, 0.68rem)",
              lineHeight: 1.3,
              textShadow: "0 1px 4px rgba(0,0,0,0.18)",
              maxWidth: "85%",
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
