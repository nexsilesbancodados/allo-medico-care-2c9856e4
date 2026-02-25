import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText, Shield, Clock, Upload, CheckCircle2, ArrowRight, Users,
  Zap, Monitor, Lock, Stethoscope, ChevronRight, Brain, Fingerprint, Bell
} from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import logo from "@/assets/logo.png";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const examTypes = [
  { icon: <Brain className="w-5 h-5 text-white" />, title: "Eletroencefalograma", gradient: "from-primary to-primary/70" },
  { icon: <Stethoscope className="w-5 h-5 text-white" />, title: "Eletrocardiograma", gradient: "from-destructive to-destructive/70" },
  { icon: <Monitor className="w-5 h-5 text-white" />, title: "Raio-X / Tomografia", gradient: "from-secondary to-secondary/70" },
  { icon: <FileText className="w-5 h-5 text-white" />, title: "Ressonância Magnética", gradient: "from-warning to-warning/70" },
  { icon: <Brain className="w-5 h-5 text-white" />, title: "Ultrassonografia", gradient: "from-primary to-secondary" },
  { icon: <Stethoscope className="w-5 h-5 text-white" />, title: "Espirometria", gradient: "from-secondary to-primary" },
];

const benefits = [
  "Laudos emitidos por especialistas qualificados",
  "Assinatura digital SHA-256 com certificação ICP-Brasil",
  "Código de verificação para autenticidade",
  "Notificação automática via WhatsApp e E-mail",
  "Armazenamento seguro em nuvem (LGPD)",
  "Tempo médio de resposta inferior a 2 horas",
];

const steps = [
  { step: "01", title: "Upload do Exame", desc: "O médico assistente faz upload das imagens e dados clínicos na plataforma.", icon: <Upload className="w-6 h-6 text-white" />, gradient: "from-primary to-primary/70" },
  { step: "02", title: "Análise pelo Especialista", desc: "Um médico laudista qualificado analisa o exame com suporte de IA para triagem de prioridade.", icon: <Brain className="w-6 h-6 text-white" />, gradient: "from-warning to-warning/70" },
  { step: "03", title: "Laudo Assinado Digitalmente", desc: "O laudo é assinado com hash SHA-256 e disponibilizado para download em PDF com QR Code de verificação.", icon: <Fingerprint className="w-6 h-6 text-white" />, gradient: "from-secondary to-secondary/70" },
  { step: "04", title: "Notificação Automática", desc: "Paciente e médico solicitante recebem notificação via WhatsApp e E-mail com o link do laudo.", icon: <Bell className="w-6 h-6 text-white" />, gradient: "from-destructive to-destructive/70" },
];

const Telelaudo = () => {
  return (
    <>
      <SEOHead
        title="Telelaudo - Laudos Médicos a Distância | AloClinica"
        description="Laudos médicos a distância com assinatura digital, verificação por QR Code e notificação automática. Eletro, Raio-X, Ressonância e mais."
      />
      <div className="min-h-screen bg-background">
        {/* Header */}
        <header className="border-b border-border/40 bg-card/80 backdrop-blur-xl sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2.5">
              <img src={logo} alt="AloClinica" className="w-9 h-9 rounded-xl" />
              <span className="font-bold text-foreground text-lg tracking-tight">AloClínica</span>
            </Link>
            <div className="flex items-center gap-2">
              <Button variant="ghost" className="rounded-xl text-sm font-semibold" asChild>
                <Link to="/medico">Sou Médico</Link>
              </Button>
              <Button className="rounded-xl bg-gradient-to-r from-primary to-secondary text-white font-semibold shadow-lg shadow-primary/20" asChild>
                <Link to="/clinica">Acesso Clínica</Link>
              </Button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/90 to-primary" />
          <div className="absolute -top-24 -right-24 w-80 h-80 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
          <div className="container mx-auto px-4 text-center relative">
            <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
              <Badge className="mb-5 text-sm px-5 py-1.5 bg-white/15 text-white border-white/20 backdrop-blur-sm">
                <FileText className="w-3.5 h-3.5 mr-1.5" /> Telelaudo
              </Badge>
              <h1 className="text-4xl md:text-6xl font-black text-white mb-5 tracking-tight leading-tight">
                Laudos Médicos<br />
                <span className="text-white/85">a Distância</span>
              </h1>
              <p className="text-lg text-white/70 max-w-2xl mx-auto mb-10 leading-relaxed">
                Laudos assinados digitalmente por especialistas qualificados. Upload do exame, análise com suporte de IA e entrega com verificação por QR Code.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" className="bg-white text-secondary hover:bg-white/90 rounded-2xl h-14 px-10 text-base font-bold shadow-2xl shadow-black/20" asChild>
                  <Link to="/medico">Começar a Usar <ArrowRight className="w-5 h-5 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 rounded-2xl h-14 px-8 text-base font-semibold" asChild>
                  <Link to="/para-empresas">Sou Clínica / Hospital</Link>
                </Button>
              </div>

              <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 mt-12">
                {[
                  { icon: <Shield className="w-4 h-4" />, label: "Assinatura SHA-256" },
                  { icon: <Clock className="w-4 h-4" />, label: "SLA < 2h" },
                  { icon: <Lock className="w-4 h-4" />, label: "LGPD Compliant" },
                  { icon: <Users className="w-4 h-4" />, label: "Laudistas Certificados" },
                ].map((item, i) => (
                  <span key={i} className="flex items-center gap-2 text-white/55 text-sm font-medium">
                    {item.icon} {item.label}
                  </span>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-14">
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">Como funciona o Telelaudo?</h2>
                <p className="text-muted-foreground mt-3 max-w-lg mx-auto">Do upload do exame à entrega do laudo assinado</p>
              </motion.div>
              <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-5">
                {steps.map((item, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="h-full border-border/50 hover:shadow-xl hover:border-border hover:-translate-y-1 transition-all duration-300 group overflow-hidden">
                      <CardContent className="p-6">
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform`}>
                            {item.icon}
                          </div>
                          <span className="text-3xl font-black text-muted-foreground/20">{item.step}</span>
                        </div>
                        <h3 className="font-bold text-foreground text-lg mb-2">{item.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{item.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Exam types */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} className="text-3xl font-black text-foreground text-center mb-3 tracking-tight">Exames Atendidos</motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-center mb-10">Laudamos as principais modalidades diagnósticas</motion.p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {examTypes.map((exam, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="border-border/50 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                      <CardContent className="p-5 flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${exam.gradient} flex items-center justify-center shadow-md group-hover:scale-110 transition-transform shrink-0`}>
                          {exam.icon}
                        </div>
                        <span className="font-semibold text-foreground text-sm">{exam.title}</span>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} className="text-3xl font-black text-foreground text-center mb-3 tracking-tight">Diferenciais do Telelaudo</motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-center mb-10">Segurança, agilidade e rastreabilidade</motion.p>
              <div className="grid sm:grid-cols-2 gap-3">
                {benefits.map((b, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success to-success/70 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-foreground font-medium">{b}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-secondary to-primary text-white shadow-xl shadow-secondary/20">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold flex items-center gap-2 justify-center sm:justify-start">
                  <Zap className="w-5 h-5" /> Integre o Telelaudo à sua clínica
                </h3>
                <p className="text-sm text-white/70 mt-1">Laudos rápidos, seguros e verificáveis para sua operação.</p>
              </div>
              <Button size="lg" className="bg-white text-secondary hover:bg-white/90 rounded-full px-8 font-bold shadow-lg shrink-0" asChild>
                <Link to="/para-empresas">Solicitar Acesso <ChevronRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Verification */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary mx-auto mb-5 shadow-xl">
                <Fingerprint className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3 tracking-tight">
                Verificação de Autenticidade
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Todo laudo possui um código único e QR Code para verificação pública. Farmácias e empresas podem confirmar a autenticidade em tempo real.
              </p>
              <Button size="lg" variant="outline" className="rounded-2xl h-14 px-8 text-base font-bold border-border" asChild>
                <Link to="/validar">
                  <Shield className="w-5 h-5 mr-2" /> Validar Documento
                </Link>
              </Button>
            </motion.div>
          </div>
        </section>

        <footer className="py-8 border-t border-border/40 text-center text-xs text-muted-foreground">
          <p>
            © 2026 AloClinica ·{" "}
            <Link to="/terms" className="hover:text-foreground transition-colors">Termos</Link> ·{" "}
            <Link to="/privacy" className="hover:text-foreground transition-colors">Privacidade</Link> ·{" "}
            <Link to="/lgpd" className="hover:text-foreground transition-colors">LGPD</Link>
          </p>
        </footer>
      </div>
    </>
  );
};

export default Telelaudo;
