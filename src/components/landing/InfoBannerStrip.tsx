import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";

interface InfoBannerStripProps {
  icon: LucideIcon;
  label: string;
  title: string;
  highlight?: string;
  description?: string;
  href?: string;
  gradient?: string;
  mascotSrc?: string;
  imageSrc?: string;
  imageAlt?: string;
  bgClass?: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  reverse?: boolean;
  variant?: string;
}

const InfoBannerStrip = ({
  icon: Icon,
  label,
  title,
  highlight,
  description,
  href,
  gradient = "from-primary to-blue-600",
  mascotSrc,
  imageSrc,
  imageAlt,
  variant,
}: InfoBannerStripProps) => {
  const navigate = useNavigate();
  const imgSrc = mascotSrc || imageSrc;

  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className="mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28 my-6"
    >
      <div
        className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${gradient} p-6 md:p-8 cursor-pointer group`}
        onClick={() => href && navigate(href)}
        role={href ? "link" : undefined}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1 space-y-2">
            <div className="flex items-center gap-2">
              <Icon className="h-4 w-4 text-white/80" />
              <span className="text-[10.5px] font-bold uppercase tracking-wider text-white/80">{label}</span>
            </div>
            <h3 className="text-lg md:text-xl font-bold text-white leading-tight">{title}</h3>
            {highlight && <p className="text-sm text-white/90 font-medium">{highlight}</p>}
            {description && <p className="text-sm text-white/70 leading-relaxed">{description}</p>}
          </div>
          {imgSrc && (
            <div className="w-32 h-32 md:w-40 md:h-40 shrink-0 flex items-center justify-center">
              <img
                src={imgSrc}
                alt={imageAlt || title}
                className="w-full h-full object-contain drop-shadow-lg group-hover:scale-105 transition-transform duration-300"
                loading="lazy"
                decoding="async"
              />
            </div>
          )}
        </div>
        {/* Decorative orb */}
        <div className="absolute -right-16 -top-16 h-48 w-48 rounded-full bg-white/5 blur-2xl" />
        <div className="absolute -left-8 -bottom-8 h-32 w-32 rounded-full bg-white/5 blur-xl" />
      </div>
    </motion.section>
  );
};

export default InfoBannerStrip;
