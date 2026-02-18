import { ReactNode } from "react";
import { motion } from "framer-motion";

type ShapeVariant = "hexagon" | "circle" | "diamond" | "triangle";

interface GeoKPICardProps {
  label: string;
  value: string | number;
  icon: ReactNode;
  color: string; // bg color class e.g. "bg-primary"
  textColor?: string; // e.g. "text-white"
  shape: ShapeVariant;
  onClick?: () => void;
  delay?: number;
}

// Hexagon clip-path
const HEXAGON_CLIP = "polygon(50% 0%, 93% 25%, 93% 75%, 50% 100%, 7% 75%, 7% 25%)";
// Diamond
const DIAMOND_CLIP = "polygon(50% 0%, 100% 50%, 50% 100%, 0% 50%)";
// Inverted triangle
const TRIANGLE_CLIP = "polygon(0% 0%, 100% 0%, 50% 100%)";

const shapeStyles: Record<ShapeVariant, { clip?: string; borderRadius?: string; aspect: string; padding: string }> = {
  hexagon: { clip: HEXAGON_CLIP, aspect: "aspect-[1/1.05]", padding: "py-6 px-4" },
  circle: { borderRadius: "9999px", aspect: "aspect-square", padding: "p-6" },
  diamond: { clip: DIAMOND_CLIP, aspect: "aspect-square", padding: "py-8 px-4" },
  triangle: { clip: TRIANGLE_CLIP, aspect: "aspect-[1/0.88]", padding: "pt-5 pb-10 px-4" },
};

const GeoKPICard = ({
  label, value, icon, color, textColor = "text-white", shape, onClick, delay = 0,
}: GeoKPICardProps) => {
  const styles = shapeStyles[shape];

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85, y: 16 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ scale: 1.06, y: -4 }}
      whileTap={{ scale: 0.97 }}
      className={`relative flex items-center justify-center cursor-pointer select-none ${onClick ? "cursor-pointer" : ""}`}
      onClick={onClick}
    >
      <div
        className={`${color} ${styles.aspect} w-full flex flex-col items-center justify-center gap-1 shadow-lg`}
        style={{
          clipPath: styles.clip,
          borderRadius: styles.borderRadius,
          ...(shape === "diamond" ? { paddingTop: "28%", paddingBottom: "28%" } : {}),
        }}
      >
        {/* content wrapper to keep text centered regardless of clip */}
        <div className={`flex flex-col items-center justify-center gap-1 ${shape === "triangle" ? "mt-[-10%]" : ""}`}>
          <span className={`${textColor} opacity-90`} style={{ fontSize: "1.3rem" }}>
            {icon}
          </span>
          <span className={`font-extrabold leading-none ${textColor}`} style={{ fontSize: "clamp(1.1rem, 4vw, 1.6rem)" }}>
            {value}
          </span>
          <span className={`text-center leading-tight font-medium ${textColor} opacity-85`} style={{ fontSize: "clamp(0.6rem, 2vw, 0.72rem)" }}>
            {label}
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default GeoKPICard;
