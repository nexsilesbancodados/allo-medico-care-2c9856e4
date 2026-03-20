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
  mascotSrc?: string;
}

const InfoBannerStrip = ({ icon: Icon, label, title, highlight, href, gradient = "from-primary to-secondary", mascotSrc }: InfoBannerStripProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, filter: "blur(4px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, amount: 0.5 }}
      transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
      className="py-4 px-4"
    >
      <div className="container mx-auto max-w-5xl">
        <button
          onClick={() => navigate(href)}
          className={`w-full group relative overflow-hidden rounded-2xl bg-gradient-to-r ${gradient} px-6 sm:px-8 py-5 sm:py-6 flex items-center justify-between gap-4 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-[1.01] active:scale-[0.99] cursor-pointer`}
        >
          {/* Animated floating particles */}
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <motion.div
              className="absolute w-3 h-3 rounded-full bg-white/10"
              style={{ top: "20%", left: "15%" }}
              animate={{ y: [-8, 8, -8], opacity: [0.3, 0.7, 0.3] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute w-2 h-2 rounded-full bg-white/10"
              style={{ top: "60%", left: "35%" }}
              animate={{ y: [6, -6, 6], opacity: [0.2, 0.6, 0.2] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
            />
            <motion.div
              className="absolute w-2.5 h-2.5 rounded-full bg-white/[0.08]"
              style={{ top: "30%", left: "55%" }}
              animate={{ y: [-5, 10, -5], opacity: [0.15, 0.5, 0.15] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />
          </div>

          {/* Shimmer effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.07] to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-[1200ms] ease-out" />

          {/* Decorative shape */}
          <div className="absolute -top-8 -right-8 w-32 h-32 rounded-full bg-white/[0.05]" />
          <div className="absolute -bottom-6 left-1/3 w-24 h-24 rounded-full bg-white/[0.04]" />

          {/* Content */}
          <div className="flex items-center gap-4 sm:gap-5 relative z-10 min-w-0">
            <motion.div
              className="w-11 h-11 sm:w-12 sm:h-12 rounded-xl bg-white/15 backdrop-blur-sm flex items-center justify-center shrink-0 shadow-lg shadow-black/10"
              whileHover={{ rotate: 8, scale: 1.1 }}
              transition={{ type: "spring", stiffness: 300, damping: 15 }}
            >
              <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary-foreground" />
            </motion.div>
            <div className="text-left min-w-0">
              <span className="text-[10px] uppercase tracking-widest text-primary-foreground/50 font-bold block mb-0.5">{label}</span>
              <p className="text-sm sm:text-base font-extrabold text-primary-foreground leading-snug">
                {title}
              </p>
              {highlight && (
                <p className="text-[11px] sm:text-xs text-white/60 font-medium mt-0.5">{highlight}</p>
              )}
            </div>
          </div>

          {/* Mascot + CTA */}
          <div className="flex items-center gap-3 shrink-0 relative z-10">
            {mascotSrc && (
              <motion.img
                src={mascotSrc}
                alt=""
                aria-hidden="true"
                className="w-16 h-16 sm:w-20 sm:h-20 object-contain drop-shadow-xl hidden sm:block"
                initial={{ opacity: 0, x: 10 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3, duration: 0.5 }}
                whileHover={{ scale: 1.1, rotate: -5 }}
              />
            )}
            <div className="flex items-center gap-1.5 text-primary-foreground/80 text-xs font-bold shrink-0 group-hover:text-primary-foreground transition-colors bg-white/10 rounded-full px-4 py-2 backdrop-blur-sm">
              <span className="hidden sm:inline">Saiba mais</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
            </div>
          </div>
        </button>
      </div>
    </motion.div>
  );
};

export default InfoBannerStrip;