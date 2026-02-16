import { motion } from "framer-motion";
import { Monitor, Smartphone, Tablet, Apple, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
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

const MultiPlatformSection = () => {
  return (
    <section className="py-20 px-4">
      <div className="container mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-10 md:p-16 text-primary-foreground"
        >
          {/* Decorative circles */}
          <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-white/5 -translate-y-1/3 translate-x-1/3" />
          <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-white/5 translate-y-1/3 -translate-x-1/3" />

          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            {/* Text */}
            <div>
              <motion.h2
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight mb-4"
              >
                Sua saúde ainda mais conectada em{" "}
                <span className="text-white/90 underline decoration-white/30 underline-offset-4">
                  qualquer dispositivo
                </span>
              </motion.h2>

              <motion.p
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="text-primary-foreground/80 text-lg max-w-md mb-8 leading-relaxed"
              >
                A AloClinica é um app progressivo (PWA) — funciona direto do navegador sem precisar baixar nada. Acesse de qualquer lugar, em qualquer plataforma.
              </motion.p>

              {/* Rating */}
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.4 }}
                className="flex items-center gap-4 mb-8"
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
                transition={{ delay: 0.5 }}
                className="flex flex-wrap gap-3"
              >
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/90 rounded-full px-6 font-bold shadow-lg gap-2"
                >
                  <Chrome className="w-5 h-5" />
                  Abrir no navegador
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="border-white/30 text-primary-foreground hover:bg-white/10 rounded-full px-6 gap-2"
                >
                  <Smartphone className="w-5 h-5" />
                  Instalar como app
                </Button>
              </motion.div>
            </div>

            {/* Right side: Devices + mascot + platform icons */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.6 }}
              className="flex flex-col items-center gap-6"
            >
              {/* Devices image with mascot overlay */}
              <div className="relative w-full max-w-md">
                <img
                  src={devicesImg}
                  alt="AloClinica em notebook, celular e tablet"
                  className="w-full rounded-2xl drop-shadow-2xl"
                />
                {/* Mascot floating on corner */}
                <motion.img
                  src={mascotImg}
                  alt="Mascote Pingo"
                  className="absolute -bottom-6 -right-4 w-28 h-28 object-contain drop-shadow-lg"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                />
              </div>

              {/* Platform grid below */}
              <div className="grid grid-cols-3 gap-3 w-full max-w-sm mt-4">
                {platforms.map((platform, i) => (
                  <motion.div
                    key={platform.label}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.4 + i * 0.1 }}
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
