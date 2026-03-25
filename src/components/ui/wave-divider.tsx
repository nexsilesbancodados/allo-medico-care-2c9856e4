import { memo } from "react";

interface WaveDividerProps {
  /** Fill color for the solid wave. Defaults to hsl(var(--background)). */
  fill?: string;
  /** Whether to show the accent (light blue) wave layer. */
  showAccent?: boolean;
  className?: string;
}

/**
 * Animated overlapping wave divider placed at the bottom of a section.
 * Uses two SVG layers: a semi-transparent accent wave and a solid fill wave.
 */
const WaveDivider = memo(({ fill, showAccent = true, className = "" }: WaveDividerProps) => {
  const solidFill = fill || "hsl(var(--background))";

  return (
    <>
      <style>{`
        @keyframes wave-drift {
          0% { transform: translateX(0); }
          50% { transform: translateX(-50%); }
          100% { transform: translateX(0); }
        }
        .wave-svg {
          width: 200% !important;
          animation: wave-drift 10s ease-in-out infinite;
          will-change: transform;
        }
        .wave-svg-slow {
          width: 200% !important;
          animation: wave-drift 14s ease-in-out infinite;
          animation-delay: -3s;
          will-change: transform;
        }
      `}</style>
      <div
        className={`absolute bottom-0 left-0 w-full overflow-hidden leading-[0] pointer-events-none ${className}`}
        style={{ height: "clamp(80px, 12vw, 160px)" }}
        aria-hidden="true"
      >
        {/* Accent wave — translucent, slightly raised */}
        {showAccent && (
          <svg
            className="wave-svg-slow absolute bottom-2 md:bottom-4"
            viewBox="0 0 2880 120"
            preserveAspectRatio="none"
            style={{ zIndex: 2, opacity: 0.5, height: "100%" }}
          >
            <path
              d="M0,40 C180,90 360,0 540,50 C720,100 900,20 1080,60 C1260,100 1440,30 1440,30 C1620,90 1800,0 1980,50 C2160,100 2340,20 2520,60 C2700,100 2880,30 2880,30 L2880,120 L0,120 Z"
              fill="hsl(var(--primary) / 0.25)"
            />
          </svg>
        )}

        {/* Main wave — solid fill matching next section */}
        <svg
          className="wave-svg absolute bottom-0"
          viewBox="0 0 2880 120"
          preserveAspectRatio="none"
          style={{ zIndex: 3, height: "100%" }}
        >
          <path
            d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 C1680,120 1920,0 2160,60 C2400,120 2640,0 2880,60 L2880,120 L0,120 Z"
            fill={solidFill}
          />
        </svg>
      </div>
    </>
  );
});

WaveDivider.displayName = "WaveDivider";
export default WaveDivider;
