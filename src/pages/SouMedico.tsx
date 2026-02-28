import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Stethoscope, Video, FileText, Users, Shield, Clock, Award, ArrowRight,
  CheckCircle2, Calendar, DollarSign, Smartphone, ChevronRight, BarChart3,
  Globe, Zap, HelpCircle
} from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import { lazy, Suspense } from "react";
import doctorPremium1 from "@/assets/doctor-premium-1.png";
import mascotWave from "@/assets/mascot-wave.png";

const Footer = lazy(() => import("@/components/landing/Footer"));

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as const } },
};
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };

const benefits = [
  { icon: Video, title: "Teleconsulta HD", desc: "Atenda de qualquer lugar com vídeo criptografado de alta qualidade.", gradient: "from-primary to-primary/70" },
  { icon: FileText, title: "Receita Digital Legal", desc: "Emita receitas, atestados e laudos com assinatura digital válida.", gradient: "from-secondary to-secondary/70" },
  { icon: Calendar, title: "Agenda Inteligente", desc: "Gestão completa da sua agenda com confirmação automática e lembretes.", gradient: "from-warning to-warning/70" },
  { icon: Users, title: "Prontuário Eletrônico", desc: "Acesse o histórico completo dos pacientes em um só lugar.", gradient: "from-destructive to-destructive/70" },
  { icon: DollarSign, title: "Receba na Hora", desc: "Pagamentos diretos sem intermediários. Você define seu preço.", gradient: "from-success to-success/70" },
  { icon: Shield, title: "Verificação CFM", desc: "Selo de médico verificado pelo CRM/CFM para máxima credibilidade.", gradient: "from-primary to-secondary" },
];

const howItWorks = [
  { step: "01", title: "Cadastre-se", desc: "Crie sua conta com código de convite e tenha seu CRM verificado automaticamente.", icon: <Stethoscope className="w-6 h-6 text-white" />, gradient: "from-primary to-primary/70" },
  { step: "02", title: "Configure seu perfil", desc: "Defina especialidades, horários, preços e personalize sua página profissional.", icon: <BarChart3 className="w-6 h-6 text-white" />, gradient: "from-warning to-warning/70" },
  { step: "03", title: "Comece a atender", desc: "Receba agendamentos, atenda por vídeo e gerencie tudo pelo painel.", icon: <Video className="w-6 h-6 text-white" />, gradient: "from-secondary to-secondary/70" },
];

const features = [
  "Defina seus próprios preços por consulta",
  "Atenda pacientes de todo o Brasil",
  "Perfil público com avaliações verificadas",
  "Plantão digital — ative e receba pacientes na hora",
  "Inteligência Artificial para suporte clínico",
  "Relatórios financeiros detalhados",
  "Suporte técnico prioritário 24/7",
  "Sem mensalidade — ganhe por consulta",
];

const faqItems = [
  { question: "Preciso de convite para me cadastrar?", answer: "Sim, o cadastro é feito com código de convite fornecido pelo administrador, garantindo qualidade e segurança na plataforma. Você também pode solicitar via WhatsApp." },
  { question: "Como funciona o pagamento?", answer: "Você define o preço da consulta. O paciente paga pela plataforma e o valor é repassado diretamente para você, com total transparência financeira." },
  { question: "Posso atender de qualquer dispositivo?", answer: "Sim! A plataforma funciona em computador, tablet e celular. Basta ter internet e câmera/microfone." },
  { question: "A receita digital tem validade legal?", answer: "Sim. Nossas receitas seguem as normas do CFM e possuem assinatura digital com validade em todo território nacional." },
  { question: "Posso usar a plataforma junto com meu consultório presencial?", answer: "Claro! Muitos médicos usam a AloClinica como complemento do atendimento presencial, ampliando seu alcance para pacientes de outras regiões." },
];

const SouMedico = () => {
  return (
    <>
      <SEOHead
        title="Sou Médico — Atenda Online | AloClinica"
        description="Cadastre-se como médico na AloClinica. Atenda por teleconsulta, emita receitas digitais e amplie sua base de pacientes."
      />
      <div className="min-h-screen bg-background">
        <Header />

        {/* Hero */}
        <section className="relative overflow-hidden py-24 sm:py-32 mt-[70px]">
          <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/90 to-secondary" />
          <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 w-72 h-72 rounded-full bg-white/5 blur-3xl" />
          <div className="container mx-auto px-4 relative">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <Badge className="mb-5 text-sm px-5 py-1.5 bg-white/15 text-white border-white/20 backdrop-blur-sm">
                  <Stethoscope className="w-3.5 h-3.5 mr-1.5" /> Para Médicos
                </Badge>
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-black text-white mb-5 tracking-tight leading-tight">
                  Atenda pacientes<br />
                  <span className="text-white/85">de todo o Brasil</span>
                </h1>
                <p className="text-lg text-white/70 max-w-xl mb-8 leading-relaxed">
                  Amplie sua base de pacientes, defina seus preços e atenda por videochamada de onde estiver. Sem mensalidade — ganhe por consulta realizada.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-2xl h-14 px-10 text-base font-bold shadow-2xl shadow-black/20" asChild>
                    <Link to="/medico">Cadastrar como Médico <ArrowRight className="w-5 h-5 ml-2" /></Link>
                  </Button>
                  <Button size="lg" variant="ghost" className="text-white/80 hover:text-white hover:bg-white/10 rounded-2xl h-14 px-8 text-base font-semibold" asChild>
                    <Link to="#como-funciona">Como funciona</Link>
                  </Button>
                </div>
                <div className="flex flex-wrap items-center gap-6 mt-10">
                  {[
                    { icon: <Shield className="w-4 h-4" />, label: "CFM Verificado" },
                    { icon: <Award className="w-4 h-4" />, label: "Selo Confiança" },
                    { icon: <Globe className="w-4 h-4" />, label: "30+ Especialidades" },
                    { icon: <Zap className="w-4 h-4" />, label: "Sem Mensalidade" },
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
                <img src={doctorPremium1} alt="Médico na plataforma" className="w-full max-w-md rounded-3xl shadow-2xl shadow-black/30 object-cover" />
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
                  <Zap className="w-3.5 h-3.5 mr-1.5" /> Vantagens
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-black text-foreground tracking-tight">
                  Tudo que você precisa para atender online
                </h2>
                <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
                  Ferramentas profissionais para elevar seu atendimento
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-xl shadow-primary/20">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold flex items-center gap-2 justify-center sm:justify-start">
                  <Stethoscope className="w-5 h-5" /> Comece a atender online hoje!
                </h3>
                <p className="text-sm opacity-70 mt-1">Cadastro rápido, sem mensalidade, ganhe por consulta.</p>
              </div>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-8 font-bold shadow-lg shrink-0" asChild>
                <Link to="/medico">Cadastrar <ArrowRight className="w-4 h-4 ml-1.5" /></Link>
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
                  src={mascotWave}
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
                Recursos da Plataforma
              </motion.h2>
              <motion.p variants={fadeUp} className="text-muted-foreground text-center mb-10">
                Tudo incluso, sem custos adicionais
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
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-secondary to-primary text-primary-foreground shadow-xl shadow-secondary/20">
              <div className="text-center sm:text-left">
                <h3 className="text-lg font-bold">Pronto para ampliar seu consultório?</h3>
                <p className="text-sm opacity-70 mt-1">Milhares de pacientes buscando médicos como você.</p>
              </div>
              <Button size="lg" className="bg-white text-primary hover:bg-white/90 rounded-full px-8 font-bold shadow-lg shrink-0" asChild>
                <Link to="/medico">Começar Agora <ChevronRight className="w-4 h-4 ml-1" /></Link>
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
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-secondary mx-auto mb-5 shadow-xl">
                <Smartphone className="w-8 h-8 text-white" />
              </div>
              <h2 className="text-2xl sm:text-3xl font-black text-foreground mb-3 tracking-tight">
                Transforme sua prática médica
              </h2>
              <p className="text-muted-foreground max-w-md mx-auto mb-8">
                Junte-se a mais de 500 médicos que já atendem pela AloClinica. Cadastro gratuito e sem burocracia.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button size="lg" className="bg-gradient-to-r from-primary to-secondary text-primary-foreground rounded-2xl h-14 px-10 text-base font-bold shadow-xl shadow-primary/25" asChild>
                  <Link to="/medico">Criar Minha Conta <ArrowRight className="w-5 h-5 ml-2" /></Link>
                </Button>
                <Button size="lg" variant="outline" className="rounded-2xl h-14 px-8 text-base font-semibold" asChild>
                  <a href="https://wa.me/5511999999999?text=Olá! Sou médico e gostaria de saber mais sobre a plataforma." target="_blank" rel="noopener noreferrer">
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

export default SouMedico;
