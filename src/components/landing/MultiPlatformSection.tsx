import { motion } from "framer-motion";
import { Monitor, Smartphone, Tablet, Apple, Chrome, Download, Wifi, Zap, Shield, Bell, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState, useEffect } from "react";
import devicesImg from "@/assets/devices-mascot.png";
import mascotImg from "@/assets/mascot-thumbsup.png";

const platforms = [
  { icon: Smartphone, label: "Android" },
  { icon: Apple, label: "iOS" },
  { icon: Monitor, label: "Windows" },
  { icon: Apple, label: "macOS" },
  { icon: Chrome, label: "Linux" },
  { icon: Tablet, label: "Tablet" },
];

const pwaFeatures = [
  { icon: Download, title: "Sem download", desc: "Funciona direto do navegador", stat: "0 MB" },
  { icon: Wifi, title: "Funciona offline", desc: "Acesse dados sem internet", stat: "100%" },
  { icon: Zap, title: "Super rápido", desc: "Carrega em menos de 2s", stat: "< 2s" },
];

const comparisons = [
  { feature: "Instalação", pwa: "Instantânea", native: "3-5 min" },
  { feature: "Espaço usado", pwa: "~2 MB", native: "50-200 MB" },
  { feature: "Atualizações", pwa: "Automáticas", native: "Manual" },
  { feature: "Notificações", pwa: "✅ Sim", native: "✅ Sim" },
  { feature: "Offline", pwa: "✅ Sim", native: "✅ Sim" },
];

const extraFeatures = [
  { icon: Bell, label: "Push Notifications" },
  { icon: Shield, label: "Criptografia E2E" },
  { icon: RefreshCw, label: "Auto-update" },
];

const MultiPlatformSection = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);
  const [showComparison, setShowComparison] = useState(false);

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") setInstalled(true);
      setDeferredPrompt(null);
    }
  };

  return (
    <section className="py-10 md:py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-10 md:p-16 text-primary-foreground"
        >
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold mb-6 backdrop-blur-sm"
              >
                <Smartphone className="w-3 h-3" />
                Progressive Web App
              </motion.span>

              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-2xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4"
              >
                Sua saúde conectada em{" "}
                <span className="text-white/90 underline decoration-white/30 underline-offset-4">
                  qualquer dispositivo
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-primary-foreground/80 text-base md:text-lg max-w-md mb-6 leading-relaxed"
              >
                A AloClinica é um app progressivo (PWA) — funciona direto do navegador sem precisar baixar nada.
              </motion.p>

              {/* PWA feature cards with stats */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.35 }}
                className="grid grid-cols-3 gap-3 mb-6"
              >
                {pwaFeatures.map((feat, i) => (
                  <motion.div
                    key={feat.title}
                    initial={{ opacity: 0, scale: 0.75, y: 15 }}
                    whileInView={{ opacity: 1, scale: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.08, type: "spring", stiffness: 200, damping: 15 }}
                    whileHover={{ y: -5, scale: 1.08, boxShadow: "0 12px 30px -8px rgba(255,255,255,0.15)" }}
                    whileTap={{ scale: 0.96 }}
                    className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 text-center hover:bg-white/15 transition-colors cursor-default group"
                  >
                    <motion.div whileHover={{ rotate: 10 }} transition={{ type: "spring", stiffness: 300 }}>
                      <feat.icon className="w-5 h-5 mx-auto mb-1.5 transition-transform duration-300 group-hover:scale-110" />
                    </motion.div>
                    <p className="text-xs font-bold leading-tight">{feat.title}</p>
                    <p className="text-[10px] opacity-60 mt-0.5">{feat.desc}</p>
                    <p className="text-sm font-extrabold mt-1.5">{feat.stat}</p>
                  </motion.div>
                ))}
              </motion.div>

              {/* Extra features pills */}
              <motion.div
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.45 }}
                className="flex flex-wrap gap-2 mb-6"
              >
                {extraFeatures.map((f, i) => (
                  <span key={i} className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[11px] font-medium backdrop-blur-sm">
                    <f.icon className="w-3 h-3" />
                    {f.label}
                  </span>
                ))}
              </motion.div>

              {/* Comparison toggle */}
              <motion.button
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                transition={{ delay: 0.48 }}
                onClick={() => setShowComparison(!showComparison)}
                className="text-xs font-semibold text-white/70 hover:text-white underline underline-offset-2 mb-4 transition-colors"
              >
                {showComparison ? "Ocultar comparativo" : "📊 Ver comparativo: PWA vs App Nativo"}
              </motion.button>

              {showComparison && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="bg-white/10 backdrop-blur-sm rounded-xl border border-white/10 p-3 mb-6 overflow-hidden"
                >
                  <table className="w-full text-[11px]">
                    <thead>
                      <tr className="border-b border-white/10">
                        <th className="text-left py-1.5 font-semibold opacity-60">Recurso</th>
                        <th className="text-center py-1.5 font-bold">AloClinica PWA</th>
                        <th className="text-center py-1.5 font-semibold opacity-60">App Nativo</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comparisons.map((row, i) => (
                        <tr key={i} className="border-b border-white/5">
                          <td className="py-1.5 opacity-70">{row.feature}</td>
                          <td className="py-1.5 text-center font-bold">{row.pwa}</td>
                          <td className="py-1.5 text-center opacity-60">{row.native}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </motion.div>
              )}

              {/* Rating */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.5 }}
                className="flex items-center gap-4 mb-6"
              >
                <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm rounded-full px-4 py-2">
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <svg key={star} className={`w-4 h-4 ${star <= 4 ? "text-yellow-400" : "text-yellow-400/50"} fill-current`} viewBox="0 0 20 20">
                        <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z" />
                      </svg>
                    ))}
                  </div>
                  <span className="font-bold text-sm">4.8</span>
                </div>
                <span className="text-primary-foreground/70 text-sm">+12 mil pacientes satisfeitos</span>
              </motion.div>

              {/* Install buttons */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.55 }}
                className="flex flex-wrap gap-3"
              >
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 rounded-full px-6 font-bold shadow-lg gap-2"
                >
                  <Chrome className="w-5 h-5" />
                  Abrir no navegador
                </Button>
                {deferredPrompt && !installed ? (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-primary-foreground hover:bg-white/10 rounded-full px-6 gap-2"
                    onClick={handleInstall}
                  >
                    <Download className="w-5 h-5" />
                    Instalar como app
                  </Button>
                ) : (
                  <Button
                    size="lg"
                    variant="outline"
                    className="border-white/30 text-primary-foreground hover:bg-white/10 rounded-full px-6 gap-2"
                  >
                    <Smartphone className="w-5 h-5" />
                    {installed ? "✅ Instalado!" : "Instalar como app"}
                  </Button>
                )}
              </motion.div>
            </div>

            {/* Right side */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col items-center gap-6"
            >
              <div className="relative w-full max-w-md">
                <img
                  src={devicesImg}
                  alt="AloClinica em notebook, celular e tablet"
                  className="w-full rounded-2xl drop-shadow-2xl"
                  loading="lazy" decoding="async" />
                <motion.img
                  src={mascotImg}
                  alt="Mascote Pingo"
                  className="absolute -bottom-6 -right-4 w-28 h-28 object-contain drop-shadow-lg"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />

                {/* Speed badge */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.6, type: "spring" }}
                  className="absolute -top-3 -left-3 bg-card text-foreground rounded-xl shadow-elevated px-3 py-2 flex items-center gap-2"
                >
                  <div className="w-8 h-8 rounded-lg bg-medical-green/15 flex items-center justify-center">
                    <Zap className="w-4 h-4 text-medical-green" />
                  </div>
                  <div>
                    <p className="text-xs font-bold leading-none">Lighthouse</p>
                    <p className="text-lg font-extrabold text-medical-green leading-none">98</p>
                  </div>
                </motion.div>
              </div>

              {/* Platform grid */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm mt-4">
                {platforms.map((platform, i) => (
                  <motion.div
                    key={platform.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.08 }}
                    whileHover={{ scale: 1.08, y: -4 }}
                    className="flex flex-col items-center gap-1.5 bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10 hover:bg-white/15 transition-colors cursor-default"
                  >
                    <platform.icon className="w-6 h-6" />
                    <span className="text-xs font-medium">{platform.label}</span>
                  </motion.div>
                ))}
              </div>

              <p className="text-center text-primary-foreground/60 text-xs">
                Compatível com qualquer navegador moderno
              </p>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
};

export default MultiPlatformSection;
