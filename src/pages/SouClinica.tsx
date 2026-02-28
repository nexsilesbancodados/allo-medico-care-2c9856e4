import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Building2, Users, Calendar, BarChart3, Shield, ArrowRight, CheckCircle2,
  ChevronRight, Smartphone, HelpCircle, Zap, DollarSign, Clock, Video,
  ClipboardList, UserPlus, Globe
} from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import { lazy, Suspense } from "react";
import clinicReceptionist from "@/assets/clinic-receptionist.png";
import mascotThumbsUp from "@/assets/mascot-thumbsup.png";

const Footer = lazy(() => import("@/components/landing/Footer"));

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const benefits = [
  { icon: Users, title: "Gestão de Médicos", desc: "Convide, gerencie e acompanhe o desempenho de cada profissional da equipe.", gradient: "from-primary to-primary/70" },
  { icon: Calendar, title: "Agendamento Central", desc: "Agenda unificada com confirmação automática e lembretes por WhatsApp.", gradient: "from-secondary to-secondary/70" },
  { icon: DollarSign, title: "Faturamento Integrado", desc: "Relatórios financeiros, repasses automáticos e controle de comissões.", gradient: "from-warning to-warning/70" },
  { icon: BarChart3, title: "Dashboard Completo", desc: "KPIs de ocupação, receita, ranking de médicos e satisfação dos pacientes.", gradient: "from-destructive to-destructive/70" },
  { icon: Video, title: "Teleconsulta Inclusa", desc: "Seus médicos podem atender presencialmente e por vídeo na mesma plataforma.", gradient: "from-success to-success/70" },
  { icon: Shield, title: "Conformidade LGPD", desc: "Dados criptografados, prontuário seguro e consentimento automatizado.", gradient: "from-primary to-secondary" },
];

const howItWorks = [
  { step: "01", title: "Cadastre sua Clínica", desc: "Preencha os dados da clínica, CNPJ e responsável técnico. Aprovação rápida.", icon: <Building2 className="w-6 h-6 text-white" />, gradient: "from-primary to-primary/70" },
  { step: "02", title: "Convide seus Médicos", desc: "Envie convites por e-mail ou WhatsApp. Configure comissões individuais.", icon: <UserPlus className="w-6 h-6 text-white" />, gradient: "from-warning to-warning/70" },
  { step: "03", title: "Gerencie tudo no Painel", desc: "Acompanhe agendamentos, faturamento e desempenho em tempo real.", icon: <ClipboardList className="w-6 h-6 text-white" />, gradient: "from-secondary to-secondary/70" },
];

const features = [
  "Painel administrativo completo e intuitivo",
  "Convite de médicos por e-mail e WhatsApp",
  "Configuração de comissão por médico",
  "Recepção digital com check-in de pacientes",
  "Relatórios de ocupação e faturamento",
  "Suporte técnico dedicado",
  "Multi-unidades em uma só conta",
  "Sem custo de instalação — pague por uso",
];

const faqItems = [
  { question: "Quanto custa para a clínica?", answer: "O cadastro é gratuito. A plataforma cobra uma taxa por consulta realizada. Não há mensalidade fixa, garantindo zero risco financeiro." },
  { question: "Quantos médicos posso cadastrar?", answer: "Não há limite. Você pode convidar quantos médicos quiser e configurar comissões individuais para cada profissional." },
  { question: "Posso usar para atendimento presencial e online?", answer: "Sim! A plataforma suporta ambos os modelos. Seus médicos podem atender presencialmente e por teleconsulta usando a mesma agenda." },
  { question: "Como funciona o repasse financeiro?", answer: "Você define o percentual de comissão para cada médico. O sistema calcula automaticamente e gera relatórios transparentes de repasse." },
  { question: "Meus dados estão seguros?", answer: "Absolutamente. Usamos criptografia de ponta, servidores em conformidade com LGPD e controle de acesso granular por função." },
];

const SouClinica = () => {
  return (
    <>
      <SEOHead
        title="Sou Clínica — Gestão Online | AloClinica"
        description="Cadastre sua clínica na AloClinica. Gerencie médicos, agendamentos, faturamento e teleconsultas em um só painel."
      />
      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32 mt-[70px]">
          <div className="absolute inset-0 bg-gradient-to-br from-secondary via-secondary/90 to-primary" />
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
          <div className="container mx-auto px-4 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Badge className="mb-5 text-sm px-5 py-1.5 bg-white/15 text-white border-white/20 backdrop-blur-sm">
                  <Building2 className="w-3.5 h-3.5 mr-1.5" /> Para Clínicas
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight leading-tight">
                  Sua clínica<br />
                  <span className="text-white/85">100% digital</span>
                </h1>
                <p className="text-lg text-white/70 max-w-xl mb-8 leading-relaxed">
                  Gerencie médicos, agendamentos e faturamento em um só painel. Atendimento presencial e por teleconsulta integrados.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl h-14 px-10 text-base font-bold shadow-2xl shadow-black/20" asChild>
                    <Link to="/clinica">Cadastrar Clínica <ArrowRight className="w-5 h-5 ml-2" /></Link>
                  </Button>
                  <Button size="lg" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 rounded-2xl h-14 px-8 text-base font-semibold" asChild>
                    <Link to="#como-funciona">Ver recursos</Link>
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-6 mt-10">
                  {[
                    { icon: <Shield className="w-4 h-4" />, label: "LGPD Compliant" },
                    { icon: <Globe className="w-4 h-4" />, label: "Multi-unidades" },
                    { icon: <Clock className="w-4 h-4" />, label: "Setup em minutos" },
                    { icon: <Zap className="w-4 h-4" />, label: "Sem mensalidade" },
                  ].map((item, i) => (
                    <span key={i} className="flex items-center gap-2 text-white/55 text-sm font-medium">{item.icon} {item.label}</span>
                  ))}
                </div>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="hidden lg:flex justify-center"
              >
                <img src={clinicReceptionist} alt="Painel da clínica" className="w-full max-w-md rounded-3xl shadow-2xl shadow-black/30 object-cover" />
              </motion.div>
            </div>
          </div>
        </section>

        {/* Benefits */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-5xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-14">
                <Badge variant="outline" className="mb-3 text-sm px-4 py-1 rounded-full">
                  <Zap className="w-3.5 h-3.5 mr-1.5" /> Recursos
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  Gestão completa da sua clínica
                </h2>
                <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                  Tudo que você precisa para modernizar sua operação
                </p>
              </motion.div>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {benefits.map((b, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="h-full border-border/50 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group">
                      <CardContent className="p-6">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${b.gradient} flex items-center justify-center mb-4 shadow-lg group-hover:scale-110 transition-transform`}>
                          <b.icon className="w-6 h-6 text-white" />
                        </div>
                        <h3 className="font-bold text-foreground text-lg mb-1.5">{b.title}</h3>
                        <p className="text-sm text-muted-foreground leading-relaxed">{b.desc}</p>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Banner */}
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-secondary to-primary text-primary-foreground shadow-xl shadow-secondary/20">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold flex items-center gap-2 justify-center sm:justify-start">
                  <Building2 className="w-5 h-5" /> Digitalize sua clínica hoje!
                </h3>
                <p className="text-sm opacity-70 mt-1">Cadastro gratuito, setup em minutos, sem burocracia.</p>
              </div>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-8 font-bold shadow-lg shrink-0" asChild>
                <Link to="/clinica">Cadastrar <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* How it works */}
        <section id="como-funciona" className="py-20">
          <div className="container mx-auto px-4 max-w-4xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.div variants={fadeUp} className="text-center mb-14 relative">
                <Badge variant="outline" className="mb-3 text-sm px-4 py-1 rounded-full">
                  <HelpCircle className="w-3.5 h-3.5 mr-1.5" /> Passo a passo
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  Como funciona?
                </h2>
                <motion.img
                  src={mascotThumbsUp}
                  alt="Pingo mascote"
                  className="absolute -right-2 sm:right-4 -bottom-6 w-14 h-14 sm:w-18 sm:h-18 object-contain drop-shadow-lg"
                  initial={{ opacity: 0, scale: 0.5 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3, type: "spring", stiffness: 200 }}
                />
              </motion.div>
              <div className="grid md:grid-cols-3 gap-5">
                {howItWorks.map((item, i) => (
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

        {/* Features checklist */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} className="text-3xl font-black text-foreground text-center mb-3 tracking-tight">
                Tudo incluso no Painel
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-center mb-10">
                Ferramentas completas para sua clínica
              </motion.p>
              <div className="grid sm:grid-cols-2 gap-3">
                {features.map((f, i) => (
                  <motion.div key={i} variants={fadeUp} className="flex items-center gap-3 p-4 rounded-xl bg-card border border-border/50 hover:shadow-lg hover:border-primary/20 transition-all group">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-success to-success/70 flex items-center justify-center shrink-0 shadow-sm group-hover:scale-110 transition-transform">
                      <CheckCircle2 className="w-4 h-4 text-white" />
                    </div>
                    <span className="text-sm text-foreground font-medium">{f}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* CTA Banner 2 */}
        <section className="py-6 px-4">
          <div className="container mx-auto max-w-3xl">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-xl shadow-primary/20">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold">Pronto para modernizar sua clínica?</h3>
                <p className="text-sm opacity-70 mt-1">Mais de 100 clínicas já confiam na AloClinica.</p>
              </div>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-8 font-bold shadow-lg shrink-0" asChild>
                <Link to="/clinica">Começar Agora <ChevronRight className="w-4 h-4 ml-1" /></Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-3xl">
            <motion.div variants={container} initial="hidden" whileInView="show" viewport={{ once: true }}>
              <motion.h2 variants={fadeUp} className="text-3xl font-black text-foreground text-center mb-12 tracking-tight">
                Perguntas Frequentes
              </motion.h2>
              <div className="space-y-4">
                {faqItems.map((faq, i) => (
                  <motion.div key={i} variants={fadeUp}>
                    <Card className="border-border/50 hover:shadow-lg hover:border-border transition-all">
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary/15 to-secondary/15 flex items-center justify-center shrink-0 text-primary">
                            <HelpCircle className="w-5 h-5" />
                          </div>
                          <div>
                            <h3 className="font-bold text-foreground mb-2">{faq.question}</h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">{faq.answer}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Final CTA */}
        <section className="py-20">
          <div className="container mx-auto px-4 max-w-2xl text-center">
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary to-primary mx-auto mb-5 shadow-xl">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3 tracking-tight">
                Leve sua clínica para o futuro
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Cadastro gratuito, sem mensalidade e com suporte dedicado para clínicas.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" className="bg-gradient-to-r from-secondary to-primary text-primary-foreground rounded-2xl h-14 px-10 text-base font-bold shadow-xl shadow-primary/25" asChild>
                  <Link to="/clinica">Cadastrar Clínica <ArrowRight className="w-5 h-5 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-2xl h-14 px-8 text-base font-semibold" asChild>
                  <a href="https://wa.me/5511999999999?text=Olá! Gostaria de cadastrar minha clínica na AloClinica." target="_blank" rel="noopener noreferrer">
                    Falar pelo WhatsApp
                  </a>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        <Suspense fallback={null}>
          <Footer />
        </Suspense>
      </div>
    </>
  );
};

export default SouClinica;
