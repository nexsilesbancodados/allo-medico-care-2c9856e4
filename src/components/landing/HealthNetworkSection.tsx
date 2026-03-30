import { memo } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { MapPin, VideoCamera, FileText, Pill, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";

import networkImg from "@/assets/section-health-network.jpg";

const features = [
  { icon: VideoCamera, title: "Teleconsulta em HD", desc: "Videochamada segura com especialistas" },
  { icon: FileText, title: "Laudos à distância", desc: "Resultados de exames com IA" },
  { icon: Pill, title: "Receita digital", desc: "Válida em qualquer farmácia do Brasil" },
  { icon: MapPin, title: "Acesso nacional", desc: "Conecte-se de qualquer estado" },
];

function HealthNetworkSection() {
  const navigate = useNavigate();

  return (
    <section className="py-16 md:py-24 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-[600px] h-[600px] rounded-full bg-primary/[0.02] blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-[500px] h-[500px] rounded-full bg-secondary/[0.03] blur-[100px]" />
      </div>

      <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28 relative">
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          {/* Image side */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="relative"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10">
              <img
                src={networkImg}
                alt="Rede de saúde digital conectada"
                className="w-full h-auto"
                loading="lazy"
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/10 via-transparent to-secondary/10" />
            </div>

            {/* Floating counter */}
            <motion.div
              className="absolute -bottom-4 -right-4 sm:bottom-4 sm:right-4 bg-card/95 backdrop-blur-xl rounded-2xl px-5 py-4 shadow-xl border border-border/50"
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <p className="text-2xl font-extrabold text-primary">12.000+</p>
              <p className="text-[11px] text-muted-foreground">Pacientes atendidos</p>
            </motion.div>
          </motion.div>

          {/* Text side */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <span className="text-[10px] sm:text-xs font-bold uppercase tracking-[0.25em] text-primary/60 mb-3 block">
              Ecossistema integrado
            </span>
            <h2 className="text-2xl md:text-4xl font-extrabold text-foreground mb-5 tracking-tight leading-tight">
              Uma rede completa de saúde{" "}
              <span className="text-primary">na palma da mão</span>
            </h2>
            <p className="text-muted-foreground text-sm md:text-base leading-relaxed mb-8 max-w-lg">
              Do agendamento à receita, passando por laudos e prontuários — tudo integrado em uma única plataforma segura e regulamentada.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.08 }}
                  className="flex items-start gap-3 p-3 rounded-xl hover:bg-muted/40 transition-colors"
                >
                  <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="w-4 h-4 text-primary" weight="fill" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-foreground">{f.title}</h4>
                    <p className="text-xs text-muted-foreground">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <Button
              size="lg"
              className="rounded-2xl px-8 gap-2 font-bold bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20 group"
              onClick={() => navigate("/paciente")}
            >
              Começar agora
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" weight="bold" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

export default memo(HealthNetworkSection);
