import { forwardRef } from "react";
import { cn } from "@/lib/utils";

interface BannerCTAProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  /** Use "light" on dark banners (white text), "dark" on light banners (dark text) */
  tone?: "light" | "dark";
  size?: "sm" | "default" | "lg";
}

/**
 * Pill-shaped CTA with animated circle-arrow — designed for banners.
 * Adapted from Uiverse.io by alexmaracinaru.
 */
const BannerCTA = forwardRef<HTMLButtonElement, BannerCTAProps>(
  ({ children, className, tone = "light", size = "default", ...props }, ref) => {
    const sizeClasses = {
      sm: "px-4 py-2 text-xs gap-2",
      default: "px-5 py-2.5 text-sm gap-2.5",
      lg: "px-7 py-3 text-base gap-3",
    };

    const svgSize = { sm: 26, default: 32, lg: 38 };

    const isLight = tone === "light";
    const stroke = isLight ? "white" : "hsl(var(--foreground))";
    const fill = isLight ? "white" : "hsl(var(--foreground))";

    return (
      <button
        ref={ref}
        className={cn(
          "group/bcta inline-flex cursor-pointer items-center rounded-full border border-transparent font-bold outline-none transition-all duration-200 active:scale-95 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          isLight
            ? "bg-white/[0.12] text-white hover:bg-white/[0.22] border-white/[0.15]"
            : "bg-secondary text-secondary-foreground hover:brightness-110 shadow-md shadow-secondary/20",
          sizeClasses[size],
          className,
        )}
        {...props}
      >
        <span className="font-bold tracking-wide">{children}</span>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 74 74"
          width={svgSize[size]}
          height={svgSize[size]}
          className="transition-transform duration-300 group-hover/bcta:translate-x-1"
          aria-hidden="true"
        >
          <circle strokeWidth="3" stroke={stroke} r="35.5" cy="37" cx="37" opacity="0.5" />
          <path
            fill={fill}
            d="M25 35.5C24.1716 35.5 23.5 36.1716 23.5 37C23.5 37.8284 24.1716 38.5 25 38.5V35.5ZM49.0607 38.0607C49.6464 37.4749 49.6464 36.5251 49.0607 35.9393L39.5147 26.3934C38.9289 25.8076 37.9792 25.8076 37.3934 26.3934C36.8076 26.9792 36.8076 27.9289 37.3934 28.5147L45.8787 37L37.3934 45.4853C36.8076 46.0711 36.8076 47.0208 37.3934 47.6066C37.9792 48.1924 38.9289 48.1924 39.5147 47.6066L49.0607 38.0607ZM25 38.5L48 38.5V35.5L25 35.5V38.5Z"
          />
        </svg>
      </button>
    );
  },
);

BannerCTA.displayName = "BannerCTA";

export { BannerCTA };
