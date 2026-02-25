import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { ClipboardCheck, FileSignature, Shield, Clock, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import teleLaudoImg from "@/assets/telelaudo-section.png";

const features = [
  { icon: ClipboardCheck, title: "Fila Inteligente", desc: "Exames organizados por prioridade e tipo para máxima eficiência." },
  { icon: FileSignature, title: "Assinatura Digital", desc: "Laudos assinados com hash SHA-256 e código de verificação único." },
  { icon: Shield, title: "Segurança LGPD", desc: "Dados criptografados com acesso controlado por RLS." },
  { icon: Clock, title: "Entrega Rápida", desc: "PDF gerado automaticamente com notificação ao solicitante." },
];

const TeleLaudoSection = () => {
  return (
    <section className="py-20 px-4 bg-gradient-to-b from-background to-muted/30 overflow-hidden">
      <div className="container mx-auto max-w-6xl">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Image */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-elevated">
              <img
                src={teleLaudoImg}
                alt="Médico laudando exames de imagem em monitor"
                className="w-full h-auto object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-primary/20 to-transparent" />
            </div>
            {/* Floating badge */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, type: "spring" }}
              className="absolute -bottom-4 -right-4 bg-card border border-border rounded-xl px-4 py-3 shadow-lg"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                <span className="text-sm font-semibold text-foreground">Laudos 24h</span>
              </div>
            </motion.div>
          </motion.div>

          {/* Right: Content */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="space-y-6"
          >
            <div>
              <span className="inline-block text-xs font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1 rounded-full mb-3">
                Telelaudo
              </span>
              <h2 className="text-3xl sm:text-4xl font-bold text-foreground leading-tight">
                Laudos Médicos à Distância com{" "}
                <span className="text-primary">Assinatura Digital</span>
              </h2>
              <p className="mt-3 text-muted-foreground text-lg leading-relaxed">
                Nossa plataforma conecta clínicas e médicos laudistas para emissão de laudos com segurança, agilidade e validade jurídica.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {features.map((f, i) => (
                <motion.div
                  key={f.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex gap-3 items-start"
                >
                  <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <f.icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-sm text-foreground">{f.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Link to="/medico">
                <Button size="lg" className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-8 gap-2 shadow-elevated">
                  Começar a Laudar
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/medico">
                <Button size="lg" variant="outline" className="rounded-full px-8">
                  Sou Médico Laudista
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TeleLaudoSection;
