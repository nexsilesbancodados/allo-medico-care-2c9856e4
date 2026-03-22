import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Glasses, FileText, Shield, Clock, CheckCircle, ArrowRight, Microscope, ScanEye } from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import ophthalmologyHero from "@/assets/ophthalmology-hero.jpg";
import pingoOftalmo from "@/assets/pingo-oftalmo.png";

const Header = lazy(() => import("@/components/landing/Header"));
const Footer = lazy(() => import("@/components/landing/Footer"));

const features = [
  {
    icon: ScanEye,
    title: "Refração Digital",
    description: "Técnicos registram leituras de refração (esférico, cilíndrico, eixo) e acuidade visual diretamente no sistema.",
  },
  {
    icon: Glasses,
    title: "Receita de Óculos",
    description: "Médicos emitem receitas digitais monofocal ou multifocal com geração automática de PDF timbrado.",
  },
  {
    icon: Microscope,
    title: "Pressão Intraocular",
    description: "Registro de tonometria OD/OE integrado ao prontuário com histórico comparativo.",
  },
  {
    icon: FileText,
    title: "Laudos com IA",
    description: "Laudos oftalmológicos estruturados com assistência de inteligência artificial e macros.",
  },
  {
    icon: Shield,
    title: "Assinatura Digital ICP-Brasil",
    description: "Documentos assinados digitalmente com validade jurídica via certificado ICP-Brasil.",
  },
  {
    icon: Clock,
    title: "SLA Garantido",
    description: "Laudos urgentes em até 2h e rotina em até 24h, com monitoramento de prazos.",
  },
];

const steps = [
  { number: "01", title: "Técnico envia exame", description: "Upload de refração, tonometria e acuidade visual pelo técnico da clínica." },
  { number: "02", title: "Médico avalia", description: "Oftalmologista revisa os dados na fila digital e emite a receita." },
  { number: "03", title: "PDF assinado", description: "Receita com marca d'água é gerada e disponibilizada para download." },
];

const OftalmologiaLanding = () => {
  return (
    <>
      <SEOHead
        title="Oftalmologia Digital | AloClínica — Exames e Receitas Online"
        description="Módulo completo de oftalmologia: refração digital, receitas de óculos, laudos com IA e assinatura digital ICP-Brasil. Tudo integrado à sua clínica."
        canonical="/oftalmologia"
      />

      <Suspense fallback={null}>
        <Header />
      </Suspense>

      <div className="min-h-screen bg-background">
        {/* Hero */}
        <section className="relative overflow-hidden pt-20 lg:pt-24">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.06]" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />

          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
              >
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
                  <Eye className="w-3.5 h-3.5" />
                  Módulo Oftalmologia
                </div>

                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight">
                  Oftalmologia{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    100% Digital
                  </span>
                </h1>

                <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Registre exames de refração, emita receitas de óculos e gere laudos com inteligência artificial — 
                  tudo integrado ao ecossistema AloClínica com assinatura digital ICP-Brasil.
                </p>

                <div className="flex flex-wrap gap-3 mt-8">
                  <Button asChild size="lg" className="rounded-full gap-2 text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                    <Link to="/clinica">
                      Começar agora
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full gap-2 text-sm font-semibold">
                    <Link to="/para-empresas/telelaudo">
                      Telelaudo para Clínicas
                    </Link>
                  </Button>
                </div>

                <div className="flex items-center gap-6 mt-10 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    Sem instalação
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    LGPD compliant
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" />
                    SLA garantido
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.7, delay: 0.2 }}
                className="relative"
              >
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/40">
                  <img
                    src={ophthalmologyHero}
                    alt="Equipamento oftalmológico profissional"
                    className="w-full h-auto object-cover"
                    loading="eager"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                </div>

                <motion.div
                  className="absolute -bottom-6 -left-6 z-10"
                  animate={{ y: [0, -8, 0] }}
                  transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                >
                  <img src={pingoOftalmo} alt="Pingo Oftalmologista" className="w-28 h-28 drop-shadow-xl" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground">
                Tudo que sua clínica precisa
              </h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                Módulo completo de oftalmologia integrado ao ecossistema de telemedicina e telelaudo.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                >
                  <Card className="h-full border-border/50 bg-background/80 backdrop-blur-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 group">
                    <CardContent className="p-6">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/15 transition-colors">
                        <feature.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="text-lg font-bold text-foreground mb-2">{feature.title}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* How it works */}
        <section className="py-20 lg:py-28">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground">
                Como funciona
              </h2>
              <p className="mt-4 text-muted-foreground text-lg">
                Fluxo simples em 3 passos — do técnico ao paciente.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <motion.div
                  key={step.number}
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15, duration: 0.5 }}
                  className="text-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-2xl font-extrabold mx-auto mb-5 shadow-lg shadow-primary/20">
                    {step.number}
                  </div>
                  <h3 className="text-lg font-bold text-foreground mb-2">{step.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{step.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20 lg:py-28 bg-gradient-to-br from-primary/[0.06] to-accent/[0.04]">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-12 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <img src={pingoOftalmo} alt="Pingo" className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" />
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground">
                Pronto para digitalizar sua clínica?
              </h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">
                Comece hoje mesmo a usar o módulo de oftalmologia. Sem instalação, sem burocracia.
              </p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <Button asChild size="lg" className="rounded-full gap-2 text-sm font-semibold shadow-lg shadow-primary/20">
                  <Link to="/clinica">
                    Cadastrar minha clínica
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full text-sm font-semibold">
                  <Link to="/para-empresas">
                    Falar com vendas
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <Suspense fallback={null}>
        <Footer />
      </Suspense>
    </>
  );
};

export default OftalmologiaLanding;
