import { memo } from "react";

interface WaveDividerProps {
  /** Color of the bottom section the wave transitions into. Defaults to background. */
  fillClass?: string;
  /** Whether to show the accent (light blue) wave layer. */
  showAccent?: boolean;
  className?: string;
}

/**
 * Animated overlapping wave divider placed at the bottom of a section.
 * Uses two SVG layers: a semi-transparent accent wave and a solid fill wave.
 */
const WaveDivider = memo(({ fillClass, showAccent = true, className = "" }: WaveDividerProps) => {
  const fill = fillClass || "hsl(var(--background))";

  return (
    <div
      className={`absolute bottom-0 left-0 w-full overflow-hidden leading-[0] pointer-events-none ${className}`}
      style={{ height: "clamp(80px, 12vw, 180px)" }}
      aria-hidden="true"
    >
      {/* Accent wave — translucent, slightly raised */}
      {showAccent && (
        <svg
          className="wave-shape absolute bottom-3 md:bottom-5"
          viewBox="0 0 1440 120"
          preserveAspectRatio="none"
          style={{ zIndex: 2, opacity: 0.45 }}
        >
          <path
            d="M0,40 C180,90 360,0 540,50 C720,100 900,20 1080,60 C1260,100 1440,30 1440,30 L1440,120 L0,120 Z"
            fill="hsl(var(--primary) / 0.3)"
          />
        </svg>
      )}

      {/* Main wave — solid fill matching next section */}
      <svg
        className="wave-shape absolute bottom-0"
        viewBox="0 0 1440 120"
        preserveAspectRatio="none"
        style={{ zIndex: 3 }}
      >
        <path
          d="M0,60 C240,120 480,0 720,60 C960,120 1200,0 1440,60 L1440,120 L0,120 Z"
          fill={fill}
        />
      </svg>
    </div>
  );
});

WaveDivider.displayName = "WaveDivider";
export default WaveDivider;
