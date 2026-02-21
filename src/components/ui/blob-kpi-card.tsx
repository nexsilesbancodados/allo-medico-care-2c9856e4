import { ReactNode, useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

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

const BLOB_SHAPES = [
  "68% 32% 40% 60% / 55% 45% 55% 45%",
  "40% 60% 65% 35% / 45% 55% 45% 55%",
  "55% 45% 35% 65% / 60% 40% 58% 42%",
  "72% 28% 48% 52% / 42% 58% 38% 62%",
  "48% 52% 58% 42% / 62% 38% 55% 45%",
];

const COLOR_MAP: Record<BlobColor, { from: string; mid: string; to: string; shadow: string }> = {
  primary:     { from: "#7BB8F5", mid: "#5AA0E8", to: "#4085D4", shadow: "rgba(91,149,230,0.45)" },
  secondary:   { from: "#F4A16A", mid: "#EB8A50", to: "#D96F35", shadow: "rgba(235,138,80,0.45)" },
  success:     { from: "#82D5B8", mid: "#5EC49F", to: "#40B08A", shadow: "rgba(94,196,159,0.45)" },
  warning:     { from: "#FFD06A", mid: "#F5B83D", to: "#E8A020", shadow: "rgba(245,184,61,0.45)" },
  destructive: { from: "#F4887A", mid: "#EC6B5B", to: "#D94E3E", shadow: "rgba(236,107,91,0.45)" },
  accent:      { from: "#B99EEA", mid: "#9E80DD", to: "#8462CC", shadow: "rgba(158,128,221,0.45)" },
  purple:      { from: "#C5A8F0", mid: "#AE88E6", to: "#9468D4", shadow: "rgba(174,136,230,0.45)" },
  teal:        { from: "#72D1D8", mid: "#4EC0C9", to: "#32AAAF", shadow: "rgba(78,192,201,0.45)" },
};

/** Animated number counter */
const AnimatedValue = ({ value }: { value: string | number }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const isInView = useInView(ref, { once: true });
  const [display, setDisplay] = useState<string | number>(typeof value === "number" ? 0 : value);

  useEffect(() => {
    if (!isInView) return;
    if (typeof value === "number") {
      const duration = 800;
      const steps = 30;
      const inc = value / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += inc;
        if (current >= value) { current = value; clearInterval(interval); }
        setDisplay(Math.round(current));
      }, duration / steps);
      return () => clearInterval(interval);
    }
    // String values (e.g. "R$1200") — extract number
    const numMatch = String(value).match(/(\d+)/);
    if (numMatch) {
      const num = parseInt(numMatch[1]);
      const prefix = String(value).slice(0, String(value).indexOf(numMatch[1]));
      const suffix = String(value).slice(String(value).indexOf(numMatch[1]) + numMatch[1].length);
      const duration = 800;
      const steps = 30;
      const inc = num / steps;
      let current = 0;
      const interval = setInterval(() => {
        current += inc;
        if (current >= num) { current = num; clearInterval(interval); }
        setDisplay(`${prefix}${Math.round(current)}${suffix}`);
      }, duration / steps);
      return () => clearInterval(interval);
    }
    setDisplay(value);
  }, [isInView, value]);

  return <span ref={ref}>{display}</span>;
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
      initial={{ opacity: 0, scale: 0.7, y: 18 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.08, y: -6, transition: { duration: 0.2 } }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className="relative flex items-center justify-center cursor-pointer select-none"
      style={{ width: "100%", aspectRatio: "1 / 1", maxWidth: 180, minWidth: 100 }}
    >
      {/* Shadow/glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          borderRadius: shape,
          background: c.shadow,
          filter: "blur(22px)",
          transform: "scale(0.85) translateY(14px)",
          opacity: 0.7,
        }}
      />

      {/* Main blob */}
      <div
        className="relative w-full h-full flex flex-col items-center justify-center gap-1"
        style={{
          borderRadius: shape,
          background: `
            radial-gradient(ellipse at 30% 25%, rgba(255,255,255,0.55) 0%, transparent 50%),
            radial-gradient(ellipse at 75% 80%, rgba(0,0,0,0.08) 0%, transparent 45%),
            linear-gradient(155deg, ${c.from} 0%, ${c.mid} 50%, ${c.to} 100%)
          `,
          boxShadow: `
            inset 0 2px 0 rgba(255,255,255,0.45),
            inset 0 -2px 8px rgba(0,0,0,0.08),
            0 8px 30px -6px ${c.shadow}
          `,
        }}
      >
        {/* Highlight */}
        <div
          className="absolute pointer-events-none"
          style={{
            top: "8%", left: "12%", width: "45%", height: "32%",
            borderRadius: "50%",
            background: "radial-gradient(ellipse, rgba(255,255,255,0.60) 0%, rgba(255,255,255,0.15) 55%, transparent 100%)",
            filter: "blur(5px)",
            transform: "rotate(-18deg)",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center gap-1.5 px-3 text-center w-full">
          <div style={{ color: "rgba(255,255,255,0.95)", fontSize: "clamp(1.1rem, 3.2vw, 1.4rem)", lineHeight: 1, filter: "drop-shadow(0 1px 4px rgba(0,0,0,0.25))" }}>
            {icon}
          </div>
          <span style={{ color: "#ffffff", fontWeight: 800, fontSize: "clamp(1.3rem, 4.5vw, 2rem)", lineHeight: 1, textShadow: "0 2px 10px rgba(0,0,0,0.22)", letterSpacing: "-0.03em" }}>
            <AnimatedValue value={value} />
          </span>
          <span style={{ color: "rgba(255,255,255,0.92)", fontWeight: 600, fontSize: "clamp(0.54rem, 1.6vw, 0.68rem)", lineHeight: 1.3, textShadow: "0 1px 4px rgba(0,0,0,0.20)", maxWidth: "88%", display: "block" }}>
            {label}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default BlobKPICard;
