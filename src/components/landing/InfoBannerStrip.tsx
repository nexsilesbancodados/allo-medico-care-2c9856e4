import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface InfoBannerStripProps {
  icon: LucideIcon;
  label: string;
  title: string;
  description: string;
  imageSrc?: string;
  imageAlt?: string;
  bgClass?: string;
  ctaLabel?: string;
  ctaAction?: () => void;
  reverse?: boolean;
}

const InfoBannerStrip = ({
  icon: Icon,
  label,
  title,
  description,
  imageSrc,
  imageAlt,
  bgClass = "bg-muted/30",
  ctaLabel,
  ctaAction,
  reverse = false,
}: InfoBannerStripProps) => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5 }}
      className={`mx-4 sm:mx-6 lg:mx-12 xl:mx-20 2xl:mx-28 my-6 rounded-3xl overflow-hidden ${bgClass}`}
    >
      <div className={`flex flex-col ${reverse ? "md:flex-row-reverse" : "md:flex-row"} items-center gap-6 p-6 md:p-8`}>
        {imageSrc && (
          <div className="w-full md:w-2/5 shrink-0">
            <img
              src={imageSrc}
              alt={imageAlt || title}
              className="w-full h-48 md:h-56 object-cover rounded-2xl"
              loading="lazy"
              decoding="async"
            />
          </div>
        )}
        <div className="flex-1 space-y-3">
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-primary" />
            <span className="text-[10.5px] font-bold uppercase tracking-wider text-primary">{label}</span>
          </div>
          <h3 className="text-lg md:text-xl font-bold text-foreground leading-tight">{title}</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
          {ctaLabel && ctaAction && (
            <button
              onClick={ctaAction}
              className="mt-2 text-sm font-semibold text-primary hover:underline"
            >
              {ctaLabel} →
            </button>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default InfoBannerStrip;
