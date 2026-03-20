import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ArrowRight, type LucideIcon } from "lucide-react";

interface InfoBannerStripProps {
  icon: LucideIcon;
  label: string;
  title: string;
  highlight?: string;
  href: string;
  gradient?: string;
}

const InfoBannerStrip = ({ icon: Icon, label, title, highlight, href, gradient = "from-primary to-secondary" }: InfoBannerStripProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 12, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="py-3 px-4"
    >
      <div className="container mx-auto max-w-5xl">
        <button
          onClick={() => navigate(href)}
          className={`w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} px-6 py-4 sm:py-5 flex items-center justify-between gap-4 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer`}
        >
          {/* Shimmer */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.06] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />

          <div className="flex items-center gap-3 sm:gap-4 relative z-10 min-w-0">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-white/15 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
            </div>
            <div className="text-left min-w-0">
              <span className="text-[10px] uppercase tracking-wider text-primary-foreground/50 font-semibold block">{label}</span>
              <p className="text-sm sm:text-base font-bold text-primary-foreground leading-snug truncate">
                {title}
                {highlight && <span className="text-white/80 font-medium ml-1">— {highlight}</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 text-primary-foreground/70 text-xs font-semibold shrink-0 relative z-10 group-hover:text-primary-foreground transition-colors">
            <span className="hidden sm:inline">Saiba mais</span>
            <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
          </div>
        </button>
      </div>
    </motion.div>
  );
};

export default InfoBannerStrip;