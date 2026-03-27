import { useNavigate } from "react-router-dom";
import { type LucideIcon } from "lucide-react";
import { BannerCTA } from "@/components/ui/banner-cta";

interface InfoBannerStripProps {
  icon: LucideIcon;
  label: string;
  title: string;
  highlight?: string;
  href: string;
  gradient?: string;
  mascotSrc?: string;
  /** Visual variant inspired by geometric banner designs */
  variant?: "angular" | "wave" | "diagonal" | "chevron" | "split";
}

const InfoBannerStrip = ({
  icon: Icon,
  label,
  title,
  highlight,
  href,
  gradient = "from-primary to-secondary",
  mascotSrc,
  variant = "angular",
}: InfoBannerStripProps) => {
  const navigate = useNavigate();

  return (
    <div className="py-5 px-4">
      <div className="container mx-auto max-w-[1800px] px-0 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
        <button
          onClick={() => navigate(href)}
          className={`w-full group relative overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} px-5 sm:px-10 py-6 sm:py-7 flex items-center justify-between gap-3 shadow-lg hover:shadow-xl transition-all duration-300 ease-out active:scale-[0.985] cursor-pointer`}
        >
          {/* ── Geometric overlays per variant ── */}
          {variant === "angular" && (
            <>
              {/* Large angular shape from right */}
              <div className="absolute top-0 right-0 w-[55%] h-full pointer-events-none">
                <svg viewBox="0 0 500 200" fill="none" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M120 0 L500 0 L500 200 L60 200 Z" fill="white" fillOpacity="0.07" />
                  <path d="M180 0 L500 0 L500 200 L120 200 Z" fill="white" fillOpacity="0.05" />
                </svg>
              </div>
              {/* Accent circle cluster */}
              <div className="absolute -right-6 -top-6 w-32 h-32 rounded-full bg-white/[0.06] pointer-events-none" />
              <div className="absolute right-16 -bottom-10 w-24 h-24 rounded-full bg-black/[0.05] pointer-events-none" />
            </>
          )}

          {variant === "wave" && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                <svg viewBox="0 0 1200 200" fill="none" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M0 80 Q300 20 600 100 Q900 180 1200 60 L1200 200 L0 200 Z" fill="white" fillOpacity="0.06" />
                  <path d="M0 120 Q300 60 600 140 Q900 200 1200 100 L1200 200 L0 200 Z" fill="white" fillOpacity="0.04" />
                </svg>
              </div>
              <div className="absolute -left-8 top-1/2 -translate-y-1/2 w-40 h-40 rounded-full bg-white/[0.05] blur-2xl pointer-events-none" />
            </>
          )}

          {variant === "diagonal" && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                <svg viewBox="0 0 1000 200" fill="none" preserveAspectRatio="none" className="w-full h-full">
                  <polygon points="650,0 1000,0 1000,200 500,200" fill="white" fillOpacity="0.08" />
                  <polygon points="750,0 1000,0 1000,200 600,200" fill="white" fillOpacity="0.05" />
                  <polygon points="850,0 1000,0 1000,200 700,200" fill="black" fillOpacity="0.04" />
                </svg>
              </div>
            </>
          )}

          {variant === "chevron" && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                <svg viewBox="0 0 1000 200" fill="none" preserveAspectRatio="none" className="w-full h-full">
                  <path d="M580 0 L700 100 L580 200 L1000 200 L1000 0 Z" fill="white" fillOpacity="0.07" />
                  <path d="M640 0 L760 100 L640 200 L1000 200 L1000 0 Z" fill="white" fillOpacity="0.05" />
                  <path d="M700 0 L820 100 L700 200 L1000 200 L1000 0 Z" fill="black" fillOpacity="0.04" />
                </svg>
              </div>
              {/* Small accent dots */}
              <div className="absolute right-[15%] top-3 w-2 h-2 rounded-full bg-white/20 pointer-events-none" />
              <div className="absolute right-[18%] bottom-4 w-1.5 h-1.5 rounded-full bg-white/15 pointer-events-none" />
            </>
          )}

          {variant === "split" && (
            <>
              <div className="absolute inset-0 pointer-events-none">
                <svg viewBox="0 0 1000 200" fill="none" preserveAspectRatio="none" className="w-full h-full">
                  {/* Two-tone split with angled divider */}
                  <path d="M550 0 L650 0 L550 200 L450 200 Z" fill="white" fillOpacity="0.1" />
                  <rect x="620" y="0" width="380" height="200" fill="white" fillOpacity="0.06" />
                </svg>
              </div>
              <div className="absolute right-0 top-0 h-full w-1 bg-white/10 pointer-events-none" />
              <div className="absolute -right-4 -bottom-4 w-28 h-28 rounded-full border-[3px] border-white/[0.08] pointer-events-none" />
            </>
          )}

          {/* Shimmer sweep on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.08] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1400ms] ease-out pointer-events-none" />

          {/* Content left */}
          <div className="flex items-center gap-4 sm:gap-6 relative z-10 min-w-0 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.14] flex items-center justify-center shrink-0 shadow-lg shadow-black/[0.08] border border-white/[0.12] backdrop-blur-sm">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="text-left min-w-0">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white/50 font-bold block mb-1 leading-none">{label}</span>
              <p className="text-sm sm:text-[15px] font-extrabold text-white leading-snug" style={{ textWrap: "balance" } as React.CSSProperties}>
                {title}
              </p>
              {highlight && (
                <p className="text-[10px] sm:text-xs text-white/60 font-semibold mt-1 tracking-wide">{highlight}</p>
              )}
            </div>
          </div>

          {/* Mascot + CTA right */}
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 relative z-10">
            {mascotSrc && (
              <img
                src={mascotSrc}
                alt=""
                aria-hidden="true"
                className="w-[72px] h-[72px] sm:w-[88px] sm:h-[88px] object-contain drop-shadow-2xl hidden sm:block select-none"
                draggable={false} loading="lazy" decoding="async" />
            )}
            <BannerCTA tone="light" size="sm">
              <span className="hidden sm:inline">Saiba mais</span>
            </BannerCTA>
          </div>
        </button>
      </div>
    </div>
  );
};

export default InfoBannerStrip;
