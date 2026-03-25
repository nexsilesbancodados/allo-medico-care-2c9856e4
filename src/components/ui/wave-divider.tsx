import { memo } from "react";

interface WaveDividerProps {
  fill?: string;
  showAccent?: boolean;
  className?: string;
}

const WaveDivider = memo(({ fill, showAccent = true, className = "" }: WaveDividerProps) => {
  const solidFill = fill || "hsl(var(--background))";

  return (
    <div
      className={`absolute bottom-0 left-0 w-full overflow-hidden pointer-events-none ${className}`}
      style={{ height: 200, lineHeight: 0 }}
      aria-hidden="true"
    >
      <style>{`
        .elementor-shape-wave{
          position: absolute;
          bottom: 0;
          display: block;
          width: 200% !important;
          height: 160px;
          animation: waveShape 10s ease-in-out infinite;
          will-change: transform, left;
          left: 0;
        }
        @keyframes waveShape {
          0%   { left: 0; }
          50%  { left: -50%; }
          100% { left: 0; }
        }
      `}</style>

      {/* Camada 1 — onda azul translúcida (sobe um pouco acima da branca) */}
      {showAccent && (
        <svg
          className="elementor-shape-wave"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{ zIndex: 2, opacity: 0.5, bottom: 20, animationDuration: "14s", animationDelay: "-3s" }}
        >
          <path
            d="M0,40 C180,90 360,0 540,50 C720,100 900,20 1080,60 C1260,100 1440,30 1440,30 L1440,120 L0,120 Z"
            fill="hsl(var(--primary) / 0.3)"
          />
        </svg>
      )}

      {/* Camada 2 — onda sólida (fundo da próxima seção) */}
      <svg
        className="elementor-shape-wave"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ zIndex: 3 }}
      >
        <path
          d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"
          fill={solidFill}
        />
      </svg>
    </div>
  );
});

WaveDivider.displayName = "WaveDivider";
export default WaveDivider;
