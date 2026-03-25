import { Link } from "react-router-dom";
import { ArrowLeft, LucideIcon } from "lucide-react";
import { motion } from "framer-motion";
import WaveDivider from "@/components/ui/wave-divider";
import bannerLegal from "@/assets/banner-legal-hero.jpg";

interface InstitutionalHeroProps {
  title: string;
  subtitle?: string;
  icon: LucideIcon;
  lastUpdate?: string;
}

const InstitutionalHero = ({ title, subtitle, icon: Icon, lastUpdate }: InstitutionalHeroProps) => (
  <section className="relative overflow-hidden pb-12" style={{ minHeight: "260px" }}>
    <img src={bannerLegal} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" decoding="async" />
    <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/75 to-primary/50" />
    <div className="container mx-auto px-4 relative z-10 flex items-end pb-8 pt-12 max-w-3xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Link to="/" className="inline-flex items-center gap-2 text-white/80 hover:text-white transition text-sm mb-4">
          <ArrowLeft className="w-4 h-4" /> Voltar ao início
        </Link>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-12 h-12 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/10">
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">{title}</h1>
            {subtitle && <p className="text-sm text-white/70">{subtitle}</p>}
          </div>
        </div>
        {lastUpdate && (
          <p className="text-xs text-white/60 mt-2">Última atualização: {lastUpdate}</p>
        )}
      </motion.div>
    </div>
    <WaveDivider />
  </section>
);

export default InstitutionalHero;
