import { useNavigate } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface InfoBannerStripProps {
  icon: LucideIcon;
  label: string;
  title: string;
  highlight?: string;
  href: string;
  gradient?: string;
  mascotSrc?: string;
}

const InfoBannerStrip = ({ icon: Icon, label, title, highlight, href, gradient = "from-primary to-secondary", mascotSrc }: InfoBannerStripProps) => {
  const navigate = useNavigate();

  return (
    <div className="py-5 px-4">
      <div className="container mx-auto max-w-5xl">
        <button
          onClick={() => navigate(href)}
          className={`w-full group relative overflow-hidden rounded-3xl bg-gradient-to-br ${gradient} px-5 sm:px-10 py-6 sm:py-7 flex items-center justify-between gap-3 shadow-2xl shadow-black/15 transition-colors duration-300 ease-out active:scale-[0.985] cursor-pointer`}
        >
          {/* Noise texture overlay */}
          <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "128px 128px" }} />

          {/* Soft radial glow behind content */}
          <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[200px] rounded-full bg-white/[0.08] blur-3xl pointer-events-none" />
          <div className="absolute -bottom-12 right-1/4 w-[200px] h-[160px] rounded-full bg-black/[0.06] blur-3xl pointer-events-none" />

          {/* Shimmer sweep */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.09] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1400ms] ease-out pointer-events-none" />

          {/* Content left */}
          <div className="flex items-center gap-4 sm:gap-6 relative z-10 min-w-0 flex-1">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-white/[0.13] flex items-center justify-center shrink-0 shadow-lg shadow-black/[0.08] border border-white/[0.12]">
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
            </div>
            <div className="text-left min-w-0">
              <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold block mb-1 leading-none">{label}</span>
              <p className="text-sm sm:text-[15px] font-extrabold text-white leading-snug" style={{ textWrap: "balance" } as React.CSSProperties}>
                {title}
              </p>
              {highlight && (
                <p className="text-[10px] sm:text-xs text-white/55 font-semibold mt-1 tracking-wide">{highlight}</p>
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
            <div className="flex items-center gap-1.5 text-white/90 text-xs font-bold shrink-0 group-hover:text-white transition-colors duration-300 bg-white/[0.12] hover:bg-white/[0.18] rounded-full px-4 sm:px-5 py-2.5 border border-white/[0.1] shadow-sm">
              <span className="hidden sm:inline tracking-wide">Saiba mais</span>
              <ArrowRight className="w-4 h-4 transition-transform duration-300 group-hover:translate-x-1" />
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default InfoBannerStrip;
