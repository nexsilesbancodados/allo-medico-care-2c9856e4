import { memo } from "react";

interface WaveDividerProps {
  fill?: string;
  accentColor?: string;
  showAccent?: boolean;
  className?: string;
}

/**
 * Animated overlapping wave section divider.
 * Faithfully replicates the two-layer wave from the reference:
 * - Shape container with overflow:hidden at the bottom of a section
 * - Two SVGs at width:200% animated with left:-50% keyframes
 * - Light-blue accent wave (z-index 2) sits above the white wave (z-index 3)
 */
const WaveDivider = memo(({ fill, accentColor, showAccent = true, className = "" }: WaveDividerProps) => {
  const solidFill = fill ?? "hsl(var(--background))";
  const accent = accentColor ?? "hsl(var(--primary) / 0.35)";

  return (
    <div
      className={`shape-container ${className}`}
      aria-hidden="true"
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        width: "100%",
        overflow: "hidden",
        lineHeight: 0,
        height: 200,
      }}
    >
      {/* Accent wave — light blue, translucent, sits above */}
      {showAccent && (
        <svg
          className="elementor-shape shape-light-blue"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{
            position: "absolute",
            bottom: 20,
            left: 0,
            display: "block",
            width: "200%",
            height: 160,
            zIndex: 2,
            opacity: 0.5,
            animation: "waveSlide 14s ease-in-out infinite",
            animationDelay: "-3s",
          }}
        >
          <path
            d="M0,40 C180,90 360,0 540,50 C720,100 900,20 1080,60 C1260,100 1440,30 1440,30 L1440,120 L0,120 Z"
            fill={accent}
          />
        </svg>
      )}

      {/* Main wave — solid white, matches next section bg */}
      <svg
        className="elementor-shape shape-white"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          display: "block",
          width: "200%",
          height: 160,
          zIndex: 3,
          animation: "waveSlide 10s ease-in-out infinite",
        }}
      >
        <path
          d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"
          fill={solidFill}
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
