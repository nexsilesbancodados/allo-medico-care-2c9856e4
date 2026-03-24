import { motion } from "framer-motion";
import { logError } from "@/lib/logger";
import { useEffect, useState, forwardRef, lazy, Suspense } from "react";
import { useTheme } from "next-themes";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import SEOHead from "@/components/SEOHead";
import Header from "@/components/landing/Header";
import HeroSection from "@/components/landing/HeroSection";
import SocialProofBar from "@/components/landing/SocialProofBar";
import FloatingMobileCTA from "@/components/landing/FloatingMobileCTA";
import { Button } from "@/components/ui/button";
import { Stethoscope, ShieldCheck, CreditCard, Brain, HeartPulse, FileText } from "lucide-react";

// Keep images as static imports but they'll be in separate chunks via asset pipeline
import bannerBenefits from "@/assets/banner-benefits-card.png";
import bannerAi from "@/assets/banner-ai-triage.png";
import bannerConsulta from "@/assets/banner-consulta.png";
import bannerPlantao from "@/assets/banner-plantao.png";
import bannerTelelaudo from "@/assets/banner-telelaudo.png";

// Lazy-load below-the-fold sections for faster initial paint
const InfoBannerStrip = lazy(() => import("@/components/landing/InfoBannerStrip"));
const StatsSection = lazy(() => import("@/components/landing/StatsSection"));
const HowItWorksSection = lazy(() => import("@/components/landing/HowItWorksSection"));
const SpecialtiesSection = lazy(() => import("@/components/landing/SpecialtiesSection"));
const PlansSection = lazy(() => import("@/components/landing/PlansSection"));
const TestimonialsSection = lazy(() => import("@/components/landing/TestimonialsSection"));
const CTABanner = lazy(() => import("@/components/landing/CTABanner"));
const FAQSection = lazy(() => import("@/components/landing/FAQSection"));
const Footer = lazy(() => import("@/components/landing/Footer"));
const SpecialtyQuiz = lazy(() => import("@/components/landing/SpecialtyQuiz"));

const Index = forwardRef<HTMLDivElement>((_, ref) => {
  const { setTheme, theme } = useTheme();
  const [showQuiz, setShowQuiz] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const prev = theme;
    setTheme("light");
    return () => { if (prev && prev !== "light") setTheme(prev); };
  }, []);


  useEffect(() => {
    const handler = () => setShowQuiz(true);
    window.addEventListener("open-specialty-quiz", handler);
    return () => window.removeEventListener("open-specialty-quiz", handler);
  }, []);

  return (
    <div className="min-h-screen relative overflow-x-clip">
      {/* Fixed subtle gradient background */}
      <div className="fixed inset-0 -z-10 bg-gradient-to-br from-[hsl(195,100%,95%)] via-[hsl(200,85%,88%)] to-[hsl(210,90%,72%)] dark:from-[hsl(210,40%,10%)] dark:via-[hsl(200,35%,14%)] dark:to-[hsl(195,30%,12%)] pointer-events-none" />
      <SEOHead
        title="Consultas Médicas Online por Vídeo 24h | AloClínica"
        description="Consulte médicos online por vídeo 24h. Agendamento fácil, receitas digitais válidas, 30+ especialidades, plantão clínico 24h. Sua saúde na palma da mão."
        canonical="https://allo-medico-care.lovable.app/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "MedicalOrganization",
          name: "AloClínica",
          url: "https://allo-medico-care.lovable.app",
          logo: "https://allo-medico-care.lovable.app/pwa-512x512.png",
          description: "Plataforma de telemedicina com consultas online por vídeo 24h, receitas digitais válidas e mais de 30 especialidades médicas.",
          medicalSpecialty: ["Cardiologia", "Dermatologia", "Endocrinologia", "Neurologia", "Oftalmologia", "Ortopedia", "Pediatria", "Clínica Geral"],
          areaServed: { "@type": "Country", name: "BR" },
          contactPoint: { "@type": "ContactPoint", contactType: "customer service", availableLanguage: ["Portuguese"], telephone: "+55-11-99999-0000" },
          sameAs: ["https://www.instagram.com/aloclinica", "https://www.facebook.com/aloclinica"],
          hasOfferCatalog: {
            "@type": "OfferCatalog",
            name: "Planos de Telemedicina",
            itemListElement: [
              { "@type": "Offer", name: "Consulta Avulsa", price: "89.00", priceCurrency: "BRL" },
              { "@type": "Offer", name: "Plantão 24h Diurno", price: "75.00", priceCurrency: "BRL" },
              { "@type": "Offer", name: "Cartão Desconto Individual", price: "24.90", priceCurrency: "BRL" },
            ],
          },
          potentialAction: {
            "@type": "ReserveAction",
            target: {
              "@type": "EntryPoint",
              urlTemplate: "https://allo-medico-care.lovable.app/paciente",
              actionPlatform: ["http://schema.org/DesktopWebPlatform", "http://schema.org/MobileWebPlatform"],
            },
            result: { "@type": "Reservation", name: "Consulta Médica Online" },
          },
          aggregateRating: { "@type": "AggregateRating", ratingValue: "4.9", reviewCount: "2500", bestRating: "5" },
        }}
      />
      <Header />
      <HeroSection />
      <SocialProofBar />

      {/* Plantão 24h — animated urgency strip */}
      <section className="py-8 px-4 relative overflow-hidden">
        <div className="max-w-[1800px] mx-auto px-4 sm:px-6 lg:px-12 xl:px-20 2xl:px-28">
          <motion.div
            initial={{ opacity: 0, y: 20, filter: "blur(6px)" }}
            whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            viewport={{ once: true, amount: 0.4 }}
            transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
            className="relative rounded-3xl overflow-hidden"
          >
            {/* Animated gradient background */}
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-primary bg-[length:200%_100%] animate-[gradient-slide_6s_ease-in-out_infinite]" />

            {/* Floating orbs */}
            <motion.div
              className="absolute w-40 h-40 rounded-full bg-white/[0.06] blur-2xl"
              style={{ top: "-20%", left: "10%" }}
              animate={{ x: [0, 30, 0], y: [0, 15, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            />
            <motion.div
              className="absolute w-32 h-32 rounded-full bg-white/[0.05] blur-2xl"
              style={{ bottom: "-15%", right: "15%" }}
              animate={{ x: [0, -20, 0], y: [0, -12, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            />

            <div className="relative z-10 flex flex-col sm:flex-row items-center justify-between gap-5 px-6 sm:px-10 py-7 sm:py-8">
              {/* Pulse indicator + text */}
              <div className="flex items-center gap-5 text-center sm:text-left">
                {/* Animated pulse ring */}
                <div className="relative shrink-0 hidden sm:flex">
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-white/20"
                    animate={{ scale: [1, 1.5, 1], opacity: [0.4, 0, 0.4] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut" }}
                  />
                  <motion.div
                    className="absolute inset-0 rounded-2xl bg-white/15"
                    animate={{ scale: [1, 1.8, 1], opacity: [0.3, 0, 0.3] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeOut", delay: 0.5 }}
                  />
                  <div className="relative w-14 h-14 rounded-2xl bg-white/15 backdrop-blur-sm flex items-center justify-center border border-white/20">
                    <Stethoscope className="w-6 h-6 text-white" />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 justify-center sm:justify-start mb-1">
                    <motion.span
                      className="w-2.5 h-2.5 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50"
                      animate={{ opacity: [1, 0.4, 1] }}
                      transition={{ duration: 1.5, repeat: Infinity }}
                    />
                    <span className="text-[10px] font-bold tracking-widest uppercase text-white/60">Ao vivo agora</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white leading-tight">
                    Plantão Clínico 24h
                  </h2>
                  <p className="text-sm text-white/70 mt-1 font-medium">
                    Médicos disponíveis agora · Sem agendamento
                  </p>
                </div>
              </div>

              {/* CTA Button */}
              <motion.div
                whileHover={{ scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Button
                  size="lg"
                  className="bg-white text-primary hover:bg-white/95 rounded-2xl px-8 gap-2.5 shadow-2xl shadow-black/15 font-extrabold shrink-0 transition-all relative z-10 text-sm sm:text-base"
                  onClick={() => navigate(user ? "/dashboard/urgent-care" : "/consulta-avulsa")}
                >
                  <motion.div
                    animate={{ rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut", delay: 3 }}
                  >
                    <Stethoscope className="w-5 h-5" />
                  </motion.div>
                  Acessar Plantão
                </Button>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </section>

      <Suspense fallback={null}>
        <StatsSection />

        <InfoBannerStrip
          icon={ShieldCheck}
          label="Cartão de Benefícios"
          title="Economize até 30% em todas as consultas"
          highlight="A partir de R$37,90/mês"
          href="/cartao-beneficios"
          gradient="from-secondary to-emerald-600"
          mascotSrc={bannerBenefits}
        />

        <HowItWorksSection />

        <InfoBannerStrip
          icon={Brain}
          label="Inteligência Artificial"
          title="Triagem inteligente com IA"
          highlight="Descubra o especialista ideal em segundos"
          href="/teleconsulta"
          gradient="from-blue-600 to-primary"
          mascotSrc={bannerAi}
        />

        <SpecialtiesSection />

        <InfoBannerStrip
          icon={CreditCard}
          label="Consulta Avulsa"
          title="Consulte agora sem mensalidade"
          highlight="A partir de R$89 com receita digital"
          href="/consulta-avulsa"
          gradient="from-primary to-violet-600"
          mascotSrc={bannerConsulta}
        />

        <PlansSection />

        <InfoBannerStrip
          icon={HeartPulse}
          label="Plantão 24h"
          title="Precisa de atendimento urgente?"
          highlight="Médicos disponíveis agora"
          href="/consulta-avulsa"
          gradient="from-rose-500 to-primary"
          mascotSrc={bannerPlantao}
        />

        <TestimonialsSection />

        <InfoBannerStrip
          icon={FileText}
          label="Telelaudo"
          title="Laudos médicos à distância com IA"
          highlight="Para clínicas e hospitais"
          href="/telelaudo"
          gradient="from-amber-500 to-orange-600"
          mascotSrc={bannerTelelaudo}
        />

        <CTABanner />
        <FAQSection />

        <section aria-labelledby="triage-heading" className="py-16 px-4">
          <div className="max-w-2xl mx-auto text-center space-y-5">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mx-auto">
              <Stethoscope className="w-8 h-8 text-primary" aria-hidden="true" />
            </div>
            <h2 id="triage-heading" className="text-2xl sm:text-3xl font-bold text-foreground tabular-nums">
              Não sabe qual especialidade procurar?
            </h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Nossa triagem inteligente analisa seus sintomas e sugere o especialista ideal em segundos.
            </p>
            <Button
              size="lg"
              className="bg-gradient-hero hover:opacity-90 text-primary-foreground rounded-full px-8 gap-2 text-base shadow-elevated"
              onClick={() => setShowQuiz(true)}
            >
              <Stethoscope className="w-5 h-5" aria-hidden="true" />
              Fazer Triagem Gratuita
            </Button>
          </div>
        </section>

        <Footer />
      </Suspense>

      <FloatingMobileCTA />
      {showQuiz && (
        <Suspense fallback={null}>
          <SpecialtyQuiz onClose={() => setShowQuiz(false)} />
        </Suspense>
      )}
    </div>
  );
});
Index.displayName = "Index";
export default Index;
