import { lazy, Suspense } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Eye, Glasses, FileText, Shield, Clock, CheckCircle, ArrowRight, Microscope, ScanEye, Truck, Star, Package, CreditCard } from "lucide-react";
import { motion } from "framer-motion";
import SEOHead from "@/components/SEOHead";
import ophthalmologyHero from "@/assets/ophthalmology-hero.jpg";
import pingoOftalmo from "@/assets/pingo-oftalmo.png";
import oticaBanner from "@/assets/otica-online-banner.jpg";
import oticaDelivery from "@/assets/otica-delivery.jpg";
import oticaLifestyle from "@/assets/otica-lifestyle.jpg";

const Header = lazy(() => import("@/components/landing/Header"));
const Footer = lazy(() => import("@/components/landing/Footer"));

const features = [
  { icon: ScanEye, title: "Refração Digital", description: "Técnicos registram leituras de refração (esférico, cilíndrico, eixo) e acuidade visual diretamente no sistema." },
  { icon: Glasses, title: "Receita de Óculos", description: "Médicos emitem receitas digitais monofocal ou multifocal com geração automática de PDF timbrado." },
  { icon: Microscope, title: "Pressão Intraocular", description: "Registro de tonometria OD/OE integrado ao prontuário com histórico comparativo." },
  { icon: FileText, title: "Laudos com IA", description: "Laudos oftalmológicos estruturados com assistência de inteligência artificial e macros." },
  { icon: Shield, title: "Assinatura Digital ICP-Brasil", description: "Documentos assinados digitalmente com validade jurídica via certificado ICP-Brasil." },
  { icon: Clock, title: "SLA Garantido", description: "Laudos urgentes em até 2h e rotina em até 24h, com monitoramento de prazos." },
];

const steps = [
  { number: "01", title: "Técnico envia exame", description: "Upload de refração, tonometria e acuidade visual pelo técnico da clínica." },
  { number: "02", title: "Médico avalia", description: "Oftalmologista revisa os dados na fila digital e emite a receita." },
  { number: "03", title: "PDF assinado", description: "Receita com marca d'água é gerada e disponibilizada para download." },
];

const oticaBenefits = [
  { icon: Truck, title: "Entrega em todo Brasil", description: "Receba seus óculos no conforto da sua casa com frete rastreado." },
  { icon: Star, title: "Lentes de qualidade", description: "Lentes com antirreflexo, blue light e proteção UV inclusos." },
  { icon: Package, title: "Embalagem premium", description: "Caixa exclusiva com estojo, flanela e certificado de garantia." },
  { icon: CreditCard, title: "Até 12x sem juros", description: "Parcelamento facilitado no cartão ou PIX com desconto." },
];

const OftalmologiaLanding = () => {
  return (
    <>
      <SEOHead
        title="Oftalmologia Digital | AloClínica — Exames, Receitas e Ótica Online"
        description="Módulo completo de oftalmologia: refração digital, receitas de óculos, laudos com IA e ótica online com entrega em todo Brasil."
        canonical="/oftalmologia"
      />

      <Suspense fallback={null}><Header /></Suspense>

      <div className="min-h-screen relative">
        <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(170,55%,96%)] via-[hsl(155,45%,91%)] to-[hsl(140,40%,85%)] dark:from-[hsl(170,25%,8%)] dark:via-[hsl(155,20%,10%)] dark:to-[hsl(140,18%,12%)]" />
        {/* Hero */}
        <section className="relative overflow-hidden pt-20 lg:pt-24">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/[0.04] via-transparent to-accent/[0.06]" />
          <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-primary/[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3" />
          <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 lg:py-24">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-6">
                  <Eye className="w-3.5 h-3.5" />
                  Módulo Oftalmologia
                </div>
                <h1 className="text-4xl lg:text-5xl xl:text-6xl font-extrabold text-foreground leading-[1.1] tracking-tight">
                  Oftalmologia{" "}
                  <span className="bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">100% Digital</span>
                </h1>
                <p className="mt-6 text-lg text-muted-foreground leading-relaxed max-w-xl">
                  Registre exames de refração, emita receitas de óculos e gere laudos com inteligência artificial — tudo integrado ao ecossistema AloClínica com assinatura digital ICP-Brasil.
                </p>
                <div className="flex flex-wrap gap-3 mt-8">
                  <Button asChild size="lg" className="rounded-full gap-2 text-sm font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all">
                    <Link to="/clinica">Começar agora <ArrowRight className="w-4 h-4" /></Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="rounded-full gap-2 text-sm font-semibold">
                    <Link to="/para-empresas/telelaudo">Telelaudo para Clínicas</Link>
                  </Button>
                </div>
                <div className="flex items-center gap-6 mt-10 text-sm text-muted-foreground">
                  {["Sem instalação", "LGPD compliant", "SLA garantido"].map(t => (
                    <div key={t} className="flex items-center gap-2"><CheckCircle className="w-4 h-4 text-primary" />{t}</div>
                  ))}
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, delay: 0.2 }} className="relative">
                <div className="relative rounded-2xl overflow-hidden shadow-2xl shadow-primary/10 border border-border/40">
                  <img src={ophthalmologyHero} alt="Equipamento oftalmológico profissional" className="w-full h-auto object-cover" loading="eager" decoding="async" />
                  <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
                </div>
                <motion.div className="absolute -bottom-6 -left-6 z-10" animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}>
                  <img src={pingoOftalmo} alt="Pingo Oftalmologista" className="w-28 h-28 drop-shadow-xl" loading="lazy" decoding="async" width={112} height={112} />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ══════════ ÓTICA ONLINE — HERO BANNER ══════════ */}
        <section className="py-6 px-4">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-7xl mx-auto"
          >
            <div className="relative rounded-3xl overflow-hidden shadow-2xl shadow-primary/10 group cursor-pointer">
              <img src={oticaBanner} alt="Ótica Online — Óculos com entrega em todo Brasil" className="w-full h-[280px] sm:h-[360px] lg:h-[420px] object-cover transition-transform duration-700 group-hover:scale-[1.02]" loading="lazy" decoding="async" />
              <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/40 to-transparent" />
              <div className="absolute inset-0 flex items-center">
                <div className="px-8 sm:px-14 lg:px-20 max-w-2xl">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/90 text-primary-foreground text-[10px] sm:text-xs font-bold uppercase tracking-widest mb-4">
                    <Glasses className="w-3.5 h-3.5" />
                    Ótica Online
                  </div>
                  <h2 className="text-2xl sm:text-3xl lg:text-5xl font-extrabold text-white leading-[1.1] mb-3" style={{ textShadow: "0 2px 20px rgba(0,0,0,0.4)" }}>
                    Seus óculos na{" "}
                    <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">porta da sua casa</span>
                  </h2>
                  <p className="text-white/80 text-sm sm:text-base lg:text-lg leading-relaxed mb-6 max-w-lg">
                    Receba a receita digital do seu oftalmologista e compre seus óculos online com entrega rápida, lentes de qualidade e preço justo.
                  </p>
                  <Button size="lg" className="rounded-full gap-2 text-sm font-semibold shadow-lg shadow-primary/30">
                    Conhecer a Ótica <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </section>

        {/* ══════════ ÓTICA ONLINE — SPLIT CARDS ══════════ */}
        <section className="py-16 lg:py-24">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center mb-14">
              <motion.div initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.5 }}>
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 text-accent-foreground text-xs font-semibold mb-4">
                  <Truck className="w-3.5 h-3.5" />
                  Novidade
                </div>
                <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground">Ótica Online AloClínica</h2>
                <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">
                  Da receita ao óculos pronto — sem sair de casa. Tudo integrado ao seu prontuário digital.
                </p>
              </motion.div>
            </div>

            <div className="grid lg:grid-cols-2 gap-8 items-stretch">
              <motion.div initial={{ opacity: 0, x: -30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6 }}
                className="relative rounded-3xl overflow-hidden shadow-xl border border-border/40 group min-h-[320px]"
              >
                <img src={oticaDelivery} alt="Entrega premium de óculos" className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">Embalagem Premium</h3>
                  <p className="text-white/75 text-sm sm:text-base leading-relaxed">
                    Cada óculos é cuidadosamente embalado com estojo exclusivo, flanela de microfibra e certificado de garantia.
                  </p>
                </div>
              </motion.div>

              <motion.div initial={{ opacity: 0, x: 30 }} whileInView={{ opacity: 1, x: 0 }} viewport={{ once: true, margin: "-60px" }} transition={{ duration: 0.6, delay: 0.1 }}
                className="relative rounded-3xl overflow-hidden shadow-xl border border-border/40 group min-h-[320px]"
              >
                <img src={oticaLifestyle} alt="Cliente feliz com óculos novos" className="w-full h-full object-cover absolute inset-0 transition-transform duration-500 group-hover:scale-105" loading="lazy" decoding="async" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/30 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8">
                  <h3 className="text-xl sm:text-2xl font-extrabold text-white mb-2">Experimente em Casa</h3>
                  <p className="text-white/75 text-sm sm:text-base leading-relaxed">
                    Receba seus óculos e tenha 7 dias para trocar se não gostar. Satisfação garantida ou seu dinheiro de volta.
                  </p>
                </div>
              </motion.div>
            </div>

            {/* Benefits Grid */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 mt-10">
              {oticaBenefits.map((b, i) => (
                <motion.div key={b.title} initial={{ opacity: 0, y: 16 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.45 }}>
                  <Card className="h-full border-border/50 bg-background/80 backdrop-blur-sm hover:shadow-lg hover:border-primary/20 transition-all duration-300 text-center group">
                    <CardContent className="p-5">
                      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-3 group-hover:bg-primary/15 transition-colors">
                        <b.icon className="w-5 h-5 text-primary" />
                      </div>
                      <h4 className="text-sm font-bold text-foreground mb-1">{b.title}</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">{b.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ══════════ PROMO BANNER STRIP ══════════ */}
        <section className="py-4 px-4">
          <motion.div
            initial={{ opacity: 0, y: 18, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="max-w-5xl mx-auto"
          >
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-accent px-6 sm:px-10 py-7 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xl shadow-primary/15">
              <div className="absolute inset-0 opacity-[0.035] mix-blend-overlay pointer-events-none" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E\")", backgroundSize: "128px 128px" }} />
              <div className="absolute top-1/2 left-1/4 -translate-y-1/2 w-[300px] h-[200px] rounded-full bg-white/[0.08] blur-3xl pointer-events-none" />
              <div className="flex items-center gap-4 relative z-10">
                <div className="w-12 h-12 rounded-2xl bg-white/[0.13] backdrop-blur-md flex items-center justify-center shrink-0 border border-white/[0.12]">
                  <Glasses className="w-6 h-6 text-white" />
                </div>
                <div className="text-left">
                  <span className="text-[9px] sm:text-[10px] uppercase tracking-[0.2em] text-white/40 font-bold block mb-1">Oferta especial</span>
                  <p className="text-sm sm:text-base font-extrabold text-white leading-snug">
                    Primeira compra com <span className="underline decoration-white/40 decoration-2 underline-offset-2">20% OFF</span> + frete grátis
                  </p>
                  <p className="text-[10px] sm:text-xs text-white/55 font-semibold mt-1">Use o cupom MEUSOCULOS na ótica online</p>
                </div>
              </div>
              <Button variant="secondary" className="rounded-full gap-2 text-sm font-bold shrink-0 relative z-10 shadow-md">
                Aproveitar <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </motion.div>
        </section>

        {/* Features */}
        <section className="py-20 lg:py-28 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-12">
            <div className="text-center mb-16">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground">Tudo que sua clínica precisa</h2>
              <p className="mt-4 text-muted-foreground text-lg max-w-2xl mx-auto">Módulo completo de oftalmologia integrado ao ecossistema de telemedicina e telelaudo.</p>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((feature, i) => (
                <motion.div key={feature.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ delay: i * 0.1, duration: 0.5 }}>
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
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground">Como funciona</h2>
              <p className="mt-4 text-muted-foreground text-lg">Fluxo simples em 3 passos — do técnico ao paciente.</p>
            </div>
            <div className="grid md:grid-cols-3 gap-8">
              {steps.map((step, i) => (
                <motion.div key={step.number} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.15, duration: 0.5 }} className="text-center">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground flex items-center justify-center text-2xl font-extrabold mx-auto mb-5 shadow-lg shadow-primary/20">{step.number}</div>
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
            <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
              <img src={pingoOftalmo} alt="Pingo" className="w-20 h-20 mx-auto mb-6 drop-shadow-lg" loading="lazy" decoding="async" width={80} height={80} />
              <h2 className="text-3xl lg:text-4xl font-extrabold text-foreground">Pronto para digitalizar sua clínica?</h2>
              <p className="mt-4 text-lg text-muted-foreground max-w-2xl mx-auto">Comece hoje mesmo a usar o módulo de oftalmologia. Sem instalação, sem burocracia.</p>
              <div className="flex flex-wrap justify-center gap-4 mt-8">
                <Button asChild size="lg" className="rounded-full gap-2 text-sm font-semibold shadow-lg shadow-primary/20">
                  <Link to="/clinica">Cadastrar minha clínica <ArrowRight className="w-4 h-4" /></Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="rounded-full text-sm font-semibold">
                  <Link to="/para-empresas">Falar com vendas</Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>
      </div>

      <Suspense fallback={null}><Footer /></Suspense>
    </>
  );
};

export default OftalmologiaLanding;