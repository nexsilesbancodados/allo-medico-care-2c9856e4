import { memo } from "react";

interface WaveDividerProps {
  color?: string;
  className?: string;
}

/**
 * Two overlapping decorative light-blue waves, matching the reference image.
 * Both waves are translucent accent shapes — NOT background fills.
 */
const WaveDivider = memo(({ color, className = "" }: WaveDividerProps) => {
  const waveColor = color ?? "hsl(var(--primary) / 0.12)";

  return (
    <div
      className={className}
      aria-hidden="true"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        overflow: "hidden",
        lineHeight: 0,
        height: 140,
        pointerEvents: "none",
      }}
    >
      {/* Back wave — slower, offset upward */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          bottom: 12,
          left: 0,
          display: "block",
          width: "200%",
          height: 120,
          zIndex: 1,
          animation: "waveSlide 14s ease-in-out infinite",
          animationDelay: "-4s",
        }}
      >
        <path
          d="M0,50 C160,100 320,10 480,55 C640,100 800,20 960,60 C1120,100 1280,25 1440,50 L1440,120 L0,120 Z"
          fill={waveColor}
        />
      </svg>

      {/* Front wave — faster, sits lower */}
      <svg
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          display: "block",
          width: "200%",
          height: 110,
          zIndex: 2,
          animation: "waveSlide 10s ease-in-out infinite",
        }}
      >
        <path
          d="M0,65 C200,110 400,15 600,60 C800,105 1000,20 1200,65 C1320,95 1440,40 1440,40 L1440,120 L0,120 Z"
          fill={waveColor}
        />
      </svg>

      <style>{`
        @keyframes waveSlide {
          0%   { left: 0; }
          50%  { left: -50%; }
          100% { left: 0; }
        }
      `}</style>
    </div>
  );
});

WaveDivider.displayName = "WaveDivider";
export default WaveDivider;
